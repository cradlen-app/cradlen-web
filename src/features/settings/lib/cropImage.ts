/**
 * Canvas-based image cropping used by the settings avatar/logo crop modal.
 *
 * `react-easy-crop` reports the selected region in source pixels (plus a
 * rotation); this util renders that rotated region onto a canvas and returns a
 * normalized square {@link File}. Output is WebP (keeps alpha for transparent
 * logos) and capped in size so it stays well under the 5 MB upload limit.
 */

/** Selected crop region in source-image pixels, as produced by react-easy-crop. */
export type CropAreaPixels = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CroppedFileOptions = {
  fileName: string;
  /** Max width/height of the output square, in px. Defaults to 512. */
  maxSize?: number;
  /** Output MIME type. Defaults to `image/webp`. */
  type?: string;
  /** Encoder quality (0..1) for lossy types. Defaults to 0.9. */
  quality?: number;
};

function createImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", (error) => reject(error));
    image.src = src;
  });
}

function toRadians(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Bounding-box size of `width`×`height` after rotating by `degrees`. */
function rotatedBoundingBox(width: number, height: number, degrees: number) {
  const rad = toRadians(degrees);
  return {
    width: Math.abs(Math.cos(rad) * width) + Math.abs(Math.sin(rad) * height),
    height: Math.abs(Math.sin(rad) * width) + Math.abs(Math.cos(rad) * height),
  };
}

/**
 * Render the rotated crop region of `src` to a square {@link File}.
 *
 * @param src   Object URL / data URL of the source image.
 * @param crop  Selected region in source pixels (react-easy-crop `croppedAreaPixels`).
 * @param rotation  Rotation in degrees applied in the cropper.
 */
export async function getCroppedFile(
  src: string,
  crop: CropAreaPixels,
  rotation: number,
  { fileName, maxSize = 512, type = "image/webp", quality = 0.9 }: CroppedFileOptions,
): Promise<File> {
  const image = await createImage(src);

  // 1. Draw the (optionally rotated) full image onto an offscreen canvas.
  const box = rotatedBoundingBox(image.width, image.height, rotation);
  const rotated = document.createElement("canvas");
  rotated.width = Math.round(box.width);
  rotated.height = Math.round(box.height);
  const rctx = rotated.getContext("2d");
  if (!rctx) throw new Error("Canvas 2D context unavailable");

  rctx.translate(rotated.width / 2, rotated.height / 2);
  rctx.rotate(toRadians(rotation));
  rctx.drawImage(image, -image.width / 2, -image.height / 2);

  // 2. Copy the selected region into a capped square output canvas.
  const outSize = Math.max(1, Math.min(Math.round(crop.width), maxSize));
  const output = document.createElement("canvas");
  output.width = outSize;
  output.height = outSize;
  const octx = output.getContext("2d");
  if (!octx) throw new Error("Canvas 2D context unavailable");

  octx.drawImage(
    rotated,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outSize,
    outSize,
  );

  const blob = await new Promise<Blob | null>((resolve) =>
    output.toBlob(resolve, type, quality),
  );
  if (!blob) throw new Error("Image encoding failed");

  return new File([blob], fileName, { type });
}
