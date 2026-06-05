"use client";

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

/**
 * In-browser video compression with ffmpeg.wasm.
 *
 * We deliberately use the SINGLE-THREADED core: it doesn't need
 * SharedArrayBuffer, so the app doesn't have to send cross-origin-isolation
 * (COOP/COEP) headers — those would break third-party embeds like the
 * reCAPTCHA widget used on /commander and /register. It's slower than the
 * multi-threaded core but runs only on the admin product page, so shoppers
 * are never affected.
 *
 * Output target: 720p (fit inside 1280×720, never upscaling the box),
 * H.264 / yuv420p at CRF 28, AAC 128k audio, +faststart for web playback.
 */

// Core must match the @ffmpeg/ffmpeg major.minor (0.12.x). Loaded from a CDN
// at runtime so we don't commit ~30 MB of wasm to the repo.
const CORE_VERSION = "0.12.10";
const CORE_BASE = `https://unpkg.com/@ffmpeg/core@${CORE_VERSION}/dist/umd`;

let ffmpegSingleton: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

/** Lazily construct + load ffmpeg once, reusing it across compressions. */
async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpegSingleton) return ffmpegSingleton;
  if (!loadPromise) {
    loadPromise = (async () => {
      const ffmpeg = new FFmpeg();
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${CORE_BASE}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${CORE_BASE}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });
      ffmpegSingleton = ffmpeg;
      return ffmpeg;
    })().catch((err) => {
      // Reset so a later attempt can retry the load (e.g. transient CDN error).
      loadPromise = null;
      throw err;
    });
  }
  return loadPromise;
}

export interface CompressResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compress `file` to a 720p H.264 MP4 entirely in the browser.
 * `onProgress` receives a 0..1 ratio (best-effort — ffmpeg's estimate).
 */
export async function compressVideo(
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<CompressResult> {
  const ffmpeg = await getFFmpeg();

  const onProg = ({ progress }: { progress: number }) => {
    onProgress?.(Math.min(1, Math.max(0, progress)));
  };
  ffmpeg.on("progress", onProg);

  // ffmpeg probes the input by content, so the extension is irrelevant.
  const input = "input";
  const output = "output.mp4";

  try {
    await ffmpeg.writeFile(input, await fetchFile(file));
    await ffmpeg.exec([
      "-i",
      input,
      // Fit inside a 720p box, preserve aspect, keep dimensions even.
      "-vf",
      "scale=1280:720:force_original_aspect_ratio=decrease:force_divisible_by=2",
      "-c:v",
      "libx264",
      "-preset",
      "veryfast",
      "-crf",
      "28",
      "-pix_fmt",
      "yuv420p",
      "-movflags",
      "+faststart",
      "-c:a",
      "aac",
      "-b:a",
      "128k",
      output,
    ]);

    const data = await ffmpeg.readFile(output);
    // Copy into a fresh ArrayBuffer-backed array — ffmpeg's FileData is typed
    // as possibly SharedArrayBuffer-backed, which isn't a valid BlobPart.
    const bytes = new Uint8Array(data as Uint8Array);
    const blob = new Blob([bytes], { type: "video/mp4" });

    // Free the virtual FS so repeated compressions don't leak memory.
    await ffmpeg.deleteFile(input).catch(() => {});
    await ffmpeg.deleteFile(output).catch(() => {});

    return { blob, originalSize: file.size, compressedSize: blob.size };
  } finally {
    ffmpeg.off("progress", onProg);
  }
}
