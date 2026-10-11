/**
 * Browser-side image resize and WebP conversion for admin uploads.
 * Reduces bandwidth and storage costs by resizing to max 1200px wide
 * and converting to WebP at 82% quality before upload.
 */

import imageCompression from "browser-image-compression";

export async function resizeAndConvertToWebP(
  file: File,
  maxWidth: number = 1200,
  quality: number = 0.82,
): Promise<File> {
  try {
    const options = {
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
      fileType: "image/webp",
      initialQuality: quality,
    };

    const compressedFile = await imageCompression(file, options);

    // Ensure the file has .webp extension
    const fileName = file.name.replace(/\.[^.]+$/, ".webp");
    return new File([compressedFile], fileName, { type: "image/webp" });
  } catch (error) {
    // If conversion fails, try basic resize without format change
    console.error("WebP conversion failed, trying basic resize:", error);
    const options = {
      maxWidthOrHeight: maxWidth,
      useWebWorker: true,
    };
    return await imageCompression(file, options);
  }
}
