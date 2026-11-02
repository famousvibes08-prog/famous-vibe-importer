const MAX_EDGE = 640;

function drawToDataUrl(
  width: number,
  height: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
): string | null {
  if (!width || !height) return null;
  const scale = Math.min(1, MAX_EDGE / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  draw(ctx, w, h);
  return canvas.toDataURL("image/jpeg", 0.7);
}

async function frameFromImage(file: File): Promise<string | null> {
  const bitmap = await createImageBitmap(file);
  try {
    return drawToDataUrl(bitmap.width, bitmap.height, (ctx, w, h) => {
      ctx.drawImage(bitmap, 0, 0, w, h);
    });
  } finally {
    bitmap.close();
  }
}

function waitFor(ready: () => boolean, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const timer = setInterval(() => {
      if (ready()) {
        clearInterval(timer);
        resolve();
      } else if (Date.now() - start > timeoutMs) {
        clearInterval(timer);
        reject(new Error("Timed out reading the video"));
      }
    }, 100);
  });
}

async function frameFromVideo(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement("video");
    video.src = url;
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.onerror = () => {};
    await waitFor(() => video.readyState >= 2, 8000);
    const target =
      Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(1, video.duration * 0.25)
        : 0.1;
    await new Promise<void>((resolve) => {
      video.onseeked = () => resolve();
      video.currentTime = target;
      setTimeout(resolve, 3000);
    });
    return drawToDataUrl(video.videoWidth, video.videoHeight, (ctx, w, h) => {
      ctx.drawImage(video, 0, 0, w, h);
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Captures a small preview frame from an image or video upload for the AI quality check. */
export async function captureMediaFrame(file: File): Promise<string | null> {
  try {
    if (file.type.startsWith("image/")) return await frameFromImage(file);
    if (file.type.startsWith("video/")) return await frameFromVideo(file);
    return null;
  } catch {
    return null;
  }
}
