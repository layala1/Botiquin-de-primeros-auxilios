import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '35mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Explicit Service Worker route (required for PWA WebAPK on Android)
app.get('/sw.js', (_req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Service-Worker-Allowed', '/');
  res.sendFile(path.resolve(__dirname, 'public', 'sw.js'));
});

// Explicit Manifest routes
app.get(['/manifest.json', '/manifest.webmanifest'], (_req, res) => {
  res.setHeader('Content-Type', 'application/manifest+json');
  res.sendFile(path.resolve(__dirname, 'public', 'manifest.json'));
});

// Analyze medicine or first aid item photos (supports single or multiple angles/photos)
app.post('/api/analyze-medicine', async (req, res) => {
  try {
    const { images, image, userHint } = req.body;

    // Collect all provided images
    const rawImages: string[] = Array.isArray(images) && images.length > 0
      ? images
      : (image ? [image] : []);

    if (rawImages.length === 0) {
      return res.status(400).json({ error: 'No se proporcionaron imágenes para analizar.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        error: 'No se encontró GEMINI_API_KEY en las variables de entorno del servidor.'
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    // Build image parts for all provided photos (front, back, blister, etc.)
    const imageParts = rawImages.map((img) => {
      const cleanBase64 = img.includes(',') ? img.split(',')[1] : img;
      return {
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64,
        },
      };
    });

    const promptText = `
Eres un farmacéutico y especialista médico en clasificación de botiquines y medicamentos.
El usuario ha proporcionado ${imageParts.length} fotografía(s) de un medicamento, producto de curación o utensilio médico (por ejemplo: la cara frontal donde aparece la marca, la cara posterior/lateral donde aparecen los componentes, fórmula química, laboratorio, advertencias y fecha de caducidad, o fotos del blíster).

INSTRUCCIONES CLAVE DE EXTRACCIÓN:
1. Cruza la información de TODAS las fotografías proporcionadas para completar los datos de manera integral.
2. NOMBRE DEL PRODUCTO:
   - Si la caja o blíster tiene un nombre comercial o de marca registrada (ej. "Dolox", "Advil", etc.), úsalo.
   - Si es un genérico puro o no tiene nombre comercial propio (ejemplo: caja que dice directamente "Ketorolaco Trometamina" o "Paracetamol"), usa el nombre del componente químico / principio activo como nombre principal del remedio.
3. COMPONENTE QUÍMICO / PRINCIPIO ACTIVO:
   - Extrae el principio activo químico completo (ejemplo: "Ketorolaco Trometamina", "Ibuprofeno", "Amoxicilina con Ácido Clavulánico", "Alcohol etílico al 70%", o especificación técnica si es instrumental).
4. LABORATORIO O CASA FARMACÉUTICA FABRICANTE:
   - Identifica la casa farmacéutica o laboratorio fabricante visible en la caja o reverso (ejemplo: "La Santé", "Farmacéutica Labs", "Genfar", "Bayer", "MK", "Pfizer", "BD", etc.).
5. CONCENTRACIÓN Y DOSIS:
   - Extrae la cantidad en miligramos, gramos, porcentaje o mililitros (ejemplo: "30 mg", "500 mg", "1 g", "100 ml", "5 ml").
6. CONTENIDO NETO Y CANTIDAD:
   - Especifica las unidades o contenido neto indicado en el empaque (ejemplo: "4 tabletas sublinguales", "10 comprimidos", "1 frasco con 120 ml", "20 cápsulas blandas", "5 ampollas").
7. PRESENTACIÓN:
   - Identifica el tipo de presentación exacta: "Tabletas sublinguales", "Tabletas / Comprimidos", "Cápsulas", "Jarabe / Suspensión", "Crema / Pomada", "Gotas", "Inyectable / Ampolla", "Inyectadora / Jeringa", "Gasas", "Algodón", "Vendas", "Tijeras", "Termómetro", etc.
8. FECHA DE CADUCIDAD Y LOTE:
   - Lee con especial atención las fechas de vencimiento (EXP, VENC, VTO) en formato YYYY-MM o YYYY-MM-DD y el número de lote (LOTE / LOT). Si no es visible, deja cadena vacía.
9. INDICACIONES Y VÍA DE ADMINISTRACIÓN:
   - Para qué sirve (ej: "Analgésico y antiinflamatorio para dolor agudo", "Tratamiento de fiebre y dolor") y vía de administración ("Sublingual", "Oral", "Tópica", "Inyectable", etc.).
10. Si en las fotos se aprecian varios medicamentos o utensilios distintos, incluye cada uno en la lista de items. Si se trata del mismo medicamento fotografiado desde varios ángulos (frontal y reverso), devuelve UN solo item consolidando toda la información detectada.
${userHint ? `Pista o comentario adicional del usuario: "${userHint}"` : ''}
`;

    // Candidate models to guarantee high availability even during traffic spikes
    const CANDIDATE_MODELS = [
      'gemini-3-flash-preview',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
    ];

    let lastError: any = null;
    let parsedData: any = null;

    for (const modelName of CANDIDATE_MODELS) {
      try {
        console.log(`Intentando análisis con modelo: ${modelName} (${imageParts.length} fotos)...`);
        const response = await ai.models.generateContent({
          model: modelName,
          contents: {
            parts: [
              ...imageParts,
              {
                text: promptText,
              },
            ],
          },
          config: {
            temperature: 0.1,
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                summary: {
                  type: Type.STRING,
                  description: 'Resumen en español de los datos analizados a partir de las fotos.',
                },
                items: {
                  type: Type.ARRAY,
                  description: 'Lista de medicamentos o artículos médicos detectados.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: {
                        type: Type.STRING,
                        description: 'Nombre del remedio (comercial o principio activo si es genérico).',
                      },
                      tradeName: {
                        type: Type.STRING,
                        description: 'Nombre comercial o marca si la tiene, o vacío.',
                      },
                      activeIngredient: {
                        type: Type.STRING,
                        description: 'Componente químico / principio activo completo.',
                      },
                      laboratory: {
                        type: Type.STRING,
                        description: 'Casa farmacéutica o laboratorio fabricante.',
                      },
                      category: {
                        type: Type.STRING,
                        description: 'Categoría: medicamento, material_curacion, utensilio_instrumental, antiseptico_higiene, otro',
                      },
                      presentation: {
                        type: Type.STRING,
                        description: 'Presentación: Tabletas sublinguales, Cápsulas, Jarabe, Crema, etc.',
                      },
                      dosage: {
                        type: Type.STRING,
                        description: 'Dosis o concentración (ej: 30 mg, 500 mg, 5 ml).',
                      },
                      quantity: {
                        type: Type.STRING,
                        description: 'Contenido neto (ej: 4 tabletas sublinguales, 1 frasco de 120 ml).',
                      },
                      expirationDate: {
                        type: Type.STRING,
                        description: 'Fecha de caducidad estimada (YYYY-MM o YYYY-MM-DD), o vacía.',
                      },
                      batch: {
                        type: Type.STRING,
                        description: 'Número de lote si es visible.',
                      },
                      indications: {
                        type: Type.STRING,
                        description: 'Indicaciones principales y para qué sirve.',
                      },
                      administrationRoute: {
                        type: Type.STRING,
                        description: 'Vía de administración (Sublingual, Oral, Tópica, Inyectable, etc.).',
                      },
                      storageRecommendation: {
                        type: Type.STRING,
                        description: 'Advertencias de conservación y almacenamiento.',
                      },
                      confidenceNote: {
                        type: Type.STRING,
                        description: 'Observaciones para que el usuario revise si faltó algún ángulo.',
                      },
                    },
                    required: ['name', 'category', 'presentation', 'indications'],
                  },
                },
              },
              required: ['items'],
            },
          },
        });

        const responseText = response.text || '{}';
        parsedData = JSON.parse(responseText);
        if (parsedData.items && parsedData.items.length > 0) {
          console.log(`Análisis exitoso con ${modelName}:`, parsedData.items.map((i: any) => i.name));
          break; // success!
        }
      } catch (err: any) {
        console.warn(`Fallo con modelo ${modelName}:`, err.message || err);
        lastError = err;
      }
    }

    if (!parsedData || !parsedData.items || parsedData.items.length === 0) {
      throw lastError || new Error('No se pudo extraer información médica de las fotografías proporcionadas.');
    }

    res.json(parsedData);
  } catch (error: any) {
    console.error('Error final analizando imágenes con Gemini:', error);
    res.status(500).json({
      error: 'Error al analizar la imagen con el modelo de IA.',
      details: error.message || String(error),
    });
  }
});

// Setup Vite in Dev or Static files in Prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
