import { toast } from "sonner";

const MARK_PREFIX = "FamousVibe";

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function drawWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  username: string,
) {
  const label = `${MARK_PREFIX} • @${username}`;
  const fontSize = Math.max(14, Math.round(width * 0.032));
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  const textWidth = ctx.measureText(label).width;
  const padX = fontSize * 0.8;
  const padY = fontSize * 0.55;
  const pillW = textWidth + padX * 2;
  const pillH = fontSize + padY * 2;
  const x = width - pillW - fontSize;
  const y = height - pillH - fontSize;
  const r = pillH / 2;

  const gradient = ctx.createLinearGradient(x, y, x + pillW, y + pillH);
  gradient.addColorStop(0, "rgba(255, 46, 154, 0.78)");
  gradient.addColorStop(0.52, "rgba(168, 85, 247, 0.78)");
  gradient.addColorStop(1, "rgba(59, 130, 246, 0.78)");

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + pillW - r, y);
  ctx.arcTo(x + pillW, y, x + pillW, y + r, r);
  ctx.lineTo(x + pillW, y + pillH - r);
  ctx.arcTo(x + pillW, y + pillH, x + pillW - r, y + pillH, r);
  ctx.lineTo(x + r, y + pillH);
  ctx.arcTo(x, y + pillH, x, y + pillH - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fillStyle = gradient;
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x + padX, y + pillH / 2 + 1);
  ctx.restore();
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.src = src;
  await image.decode();
  return image;
}

export async function downloadWatermarkedImage(src: string, username: string) {
  const image = await loadImage(src);
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");
  ctx.drawImage(image, 0, 0);
  drawWatermark(ctx, canvas.width, canvas.height, username);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("Could not render image");
  triggerDownload(blob, `famousvibe-${Date.now()}.png`);
}

export async function downloadWatermarkedVideo(src: string, username: string) {
  const supportsRecorder =
    typeof MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement.prototype.captureStream === "function";

  if (!supportsRecorder) {
    toast.message("Watermarked video isn't supported on this browser", {
      description: "Downloading the original video and a watermarked cover instead.",
    });
    triggerDownload(await (await fetch(src)).blob(), `famousvibe-${Date.now()}.mp4`);
    return;
  }

  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.src = src;
  video.muted = false;
  video.playsInline = true;
  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load video"));
  });

  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable");

  const stream = canvas.captureStream(30);
  const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
  const chunks: BlobPart[] = [];
  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data);
  };

  const done = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  let raf = 0;
  const renderFrame = () => {
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    drawWatermark(ctx, canvas.width, canvas.height, username);
    raf = requestAnimationFrame(renderFrame);
  };

  recorder.start();
  await video.play();
  renderFrame();

  await new Promise<void>((resolve) => {
    video.onended = () => resolve();
  });

  cancelAnimationFrame(raf);
  recorder.stop();
  await done;

  triggerDownload(new Blob(chunks, { type: "video/webm" }), `famousvibe-${Date.now()}.webm`);
}

export async function downloadWatermarked(
  src: string,
  mediaType: "image" | "video",
  username: string,
) {
  try {
    if (mediaType === "image") await downloadWatermarkedImage(src, username);
    else await downloadWatermarkedVideo(src, username);
  } catch (error) {
    toast.error(error instanceof Error ? error.message : "Download failed");
  }
}
