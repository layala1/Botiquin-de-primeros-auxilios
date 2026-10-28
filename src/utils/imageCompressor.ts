/**
 * Helper to compress high-resolution camera images or gallery uploads
 * Scales images to a max dimension (e.g. 1024px) and compresses to JPEG ~0.75.
 * Reduces 6-10MB mobile photos down to ~60-100KB with excellent visual clarity for medicines.
 */
export async function compressImage(
  source: string | File | Blob,
  maxWidth = 1024,
  maxHeight = 1024,
  quality = 0.75
): Promise<string> {
  return new Promise((resolve, reject) => {
    let imgSource = '';

    if (typeof source === 'string') {
      imgSource = source;
      processImage(imgSource);
    } else {
      const reader = new FileReader();
      reader.onload = () => {
        imgSource = reader.result as string;
        processImage(imgSource);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(source);
    }

    function processImage(src: string) {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(src); // fallback
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedDataUrl);
      };

      img.onerror = () => {
        // If image fails to decode, resolve with original string or reject gracefully
        resolve(src);
      };

      img.src = src;
    }
  });
}
