// Web-only image picker: opens the browser's file dialog, downscales the
// chosen photo on a canvas and returns a compact JPEG data-URL (~20-40KB).
// Small enough to live inside the Firestore profile doc (1MB limit), which
// gives us cross-device sync without setting up Firebase Storage.
export function pickProfileImage(maxSize = 256): Promise<string | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        if (!ctx) { URL.revokeObjectURL(img.src); return resolve(null); }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(img.src);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.onerror = () => { URL.revokeObjectURL(img.src); resolve(null); };
      img.src = URL.createObjectURL(file);
    };
    input.click();
  });
}
