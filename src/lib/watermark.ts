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
  const original = async () => {
    const response = await fetch(src);
    if (!response.ok) throw new Error("Could not download original video");
    const blob = await response.blob();
    const extension = blob.type.includes("webm") ? "webm" : blob.type.includes("quicktime") ? "mov" : "mp4";
    triggerDownload(blob, `famousvibe-${Date.now()}.${extension}`);
    toast.message("Original video downloaded", { description: "No end card added; original quality and audio preserved." });
  };
  if (typeof MediaRecorder === "undefined" || typeof HTMLCanvasElement.prototype.captureStream !== "function") {
    await original();
    return;
  }
  toast.message("Preparing creator end card", { description: "Keeps original dimensions; adding an end card re-encodes video and audio." });
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = false;
  video.playsInline = true;
  const audio = new AudioContext();
  const resumed = audio.resume().catch(() => undefined);
  let raf = 0;
  let stream: MediaStream | undefined;
  let recorder: MediaRecorder | undefined;
  try {
    const ready = new Promise<void>((resolve, reject) => {
      video.onloadedmetadata = () => resolve();
      video.onerror = () => reject(new Error("Could not load video"));
    });
    video.src = src;
    await ready;
    await resumed;
    if (audio.state !== "running") throw new Error("Audio export unavailable");
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    const logo = await loadImage("/icon-512.png");
    const source = audio.createMediaElementSource(video);
    const destination = audio.createMediaStreamDestination();
    source.connect(destination);
    // Connect only to the recording destination, avoiding duplicate playback sound.
    stream = new MediaStream([...canvas.captureStream(30).getVideoTracks(), ...destination.stream.getAudioTracks()]);
    const mimeType = ["video/webm;codecs=vp9,opus", "video/webm;codecs=vp8,opus", "video/mp4", "video/webm"].find((type) => MediaRecorder.isTypeSupported(type));
    if (!mimeType) throw new Error("Video export unavailable");
    recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: Math.max(12_000_000, canvas.width * canvas.height * 8), audioBitsPerSecond: 256_000 });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (event) => { if (event.data.size) chunks.push(event.data); };
    const stopped = new Promise<void>((resolve, reject) => {
      if (!recorder) return reject(new Error("Recorder unavailable"));
      recorder.onstop = () => resolve();
      recorder.onerror = () => reject(new Error("Video export failed"));
    });
    const styles = getComputedStyle(document.documentElement);
    const color = (name: string) => styles.getPropertyValue(name).trim();
    let endStarted = 0;
    const renderFrame = () => {
      if (endStarted) {
        const progress = Math.min(1, (performance.now() - endStarted) / 600);
        ctx.fillStyle = color("--background");
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.globalAlpha = progress;
        const size = canvas.width * (0.27 + progress * 0.03);
        ctx.drawImage(logo, (canvas.width - size) / 2, canvas.height * 0.35 - size / 2, size, size);
        ctx.textAlign = "center";
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
        gradient.addColorStop(0, color("--neon-pink"));
        gradient.addColorStop(0.5, color("--neon-purple"));
        gradient.addColorStop(1, color("--neon-blue"));
        ctx.fillStyle = gradient;
        ctx.font = `700 ${canvas.width * 0.1}px Inter, sans-serif`;
        ctx.fillText("FamousVibe", canvas.width / 2, canvas.height * 0.53, canvas.width * 0.85);
        ctx.fillStyle = color("--foreground");
        ctx.font = `600 ${canvas.width * 0.055}px Inter, sans-serif`;
        ctx.fillText(`@${username}`, canvas.width / 2, canvas.height * 0.6, canvas.width * 0.85);
        ctx.restore();
      } else ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      raf = requestAnimationFrame(renderFrame);
    };
    const ended = new Promise<void>((resolve, reject) => {
      video.onended = () => resolve();
      video.onerror = () => reject(new Error("Playback export failed"));
    });
    await video.play();
    renderFrame();
    recorder.start(1000);
    await ended;
    endStarted = performance.now();
    await new Promise((resolve) => setTimeout(resolve, 3000));
    cancelAnimationFrame(raf);
    recorder.stop();
    await stopped;
    triggerDownload(new Blob(chunks, { type: mimeType }), `famousvibe-${Date.now()}.${mimeType.includes("mp4") ? "mp4" : "webm"}`);
    toast.success("Video with creator end card downloaded");
  } catch {
    toast.message("End card export unavailable", { description: "Downloading the unchanged original instead." });
    await original();
  } finally {
    cancelAnimationFrame(raf);
    if (recorder && recorder.state !== "inactive") recorder.stop();
    video.pause();
    video.removeAttribute("src");
    video.load();
    stream?.getTracks().forEach((track) => track.stop());
    await audio.close();
  }
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
