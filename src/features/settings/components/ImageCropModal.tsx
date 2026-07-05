"use client";

import { useEffect, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { Dialog } from "radix-ui";
import { Loader2, RotateCw, X, ZoomIn } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getCroppedFile } from "../lib/cropImage";

export type ImageCropModalLabels = {
  title: string;
  description: string;
  zoom: string;
  rotate: string;
  cancel: string;
  save: string;
  error: string;
};

/**
 * Centered crop-and-position dialog shared by the profile avatar and
 * organization logo uploaders. Opens with a picked {@link File}, lets the user
 * zoom / drag / rotate inside a round (avatar) or square (logo) frame, then
 * hands a normalized cropped `File` back via {@link onCropped}. The parent runs
 * the actual upload and closes the modal on success.
 */
export function ImageCropModal({
  open,
  onOpenChange,
  file,
  shape,
  fileName,
  labels,
  busy,
  onCropped,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  shape: "round" | "square";
  fileName: string;
  labels: ImageCropModalLabels;
  /** True while the parent's upload mutation is in flight. */
  busy: boolean;
  onCropped: (file: File) => void;
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/35" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-51 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col rounded-2xl bg-white shadow-2xl outline-none">
          <div className="flex items-start justify-between gap-4 border-b border-gray-100 p-5">
            <div className="min-w-0">
              <Dialog.Title className="text-lg font-medium text-brand-black">
                {labels.title}
              </Dialog.Title>
              <Dialog.Description className="mt-1 text-sm text-gray-400">
                {labels.description}
              </Dialog.Description>
            </div>
            <Dialog.Close className="rounded-lg p-1 text-gray-400 transition hover:bg-gray-50 hover:text-brand-black">
              <X className="size-5" />
            </Dialog.Close>
          </div>

          {/* Keyed by file identity so crop transforms reset per new pick. */}
          {file && (
            <CropBody
              key={`${file.name}:${file.size}:${file.lastModified}`}
              file={file}
              shape={shape}
              fileName={fileName}
              labels={labels}
              busy={busy}
              onCropped={onCropped}
            />
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CropBody({
  file,
  shape,
  fileName,
  labels,
  busy,
  onCropped,
}: {
  file: File;
  shape: "round" | "square";
  fileName: string;
  labels: ImageCropModalLabels;
  busy: boolean;
  onCropped: (file: File) => void;
}) {
  // Object URL created once per mount (component is keyed on the file).
  const [imageSrc] = useState(() => URL.createObjectURL(file));
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [area, setArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => () => URL.revokeObjectURL(imageSrc), [imageSrc]);

  const onSave = async () => {
    if (!area) return;
    setProcessing(true);
    setFailed(false);
    try {
      const cropped = await getCroppedFile(imageSrc, area, rotation, {
        fileName,
      });
      onCropped(cropped);
    } catch {
      setFailed(true);
    } finally {
      setProcessing(false);
    }
  };

  const working = processing || busy;

  return (
    <>
      <div className="p-5">
        <div className="relative h-72 w-full overflow-hidden rounded-xl bg-gray-900">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            rotation={rotation}
            aspect={1}
            cropShape={shape === "round" ? "round" : "rect"}
            showGrid={shape === "square"}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onRotationChange={setRotation}
            onCropComplete={(_, areaPixels) => setArea(areaPixels)}
          />
        </div>

        <div className="mt-4 flex items-center gap-3">
          <ZoomIn className="size-4 shrink-0 text-gray-400" />
          <label className="sr-only" htmlFor="image-crop-zoom">
            {labels.zoom}
          </label>
          <input
            id="image-crop-zoom"
            type="range"
            min={1}
            max={3}
            step={0.01}
            value={zoom}
            onChange={(event) => setZoom(Number(event.target.value))}
            className="h-1 flex-1 cursor-pointer accent-brand-primary"
            aria-label={labels.zoom}
          />
          <button
            type="button"
            onClick={() => setRotation((prev) => (prev + 90) % 360)}
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-3 py-1.5 text-xs font-semibold text-brand-black hover:bg-gray-50"
          >
            <RotateCw className="size-3.5" />
            {labels.rotate}
          </button>
        </div>

        {failed && <p className="mt-3 text-sm text-red-600">{labels.error}</p>}
      </div>

      <div className="flex justify-end gap-2 border-t border-gray-100 p-5">
        <Dialog.Close asChild>
          <Button type="button" variant="outline" disabled={working}>
            {labels.cancel}
          </Button>
        </Dialog.Close>
        <Button type="button" onClick={onSave} disabled={working || !area}>
          {working && <Loader2 className="size-4 animate-spin" />}
          {labels.save}
        </Button>
      </div>
    </>
  );
}
