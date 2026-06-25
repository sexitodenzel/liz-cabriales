import imageCompression from "browser-image-compression"

const DEFAULT_MAX_SIZE_MB = 0.5
const DEFAULT_MAX_DIMENSION = 1920

type CompressOptions = {
  maxSizeMB?: number
  maxWidthOrHeight?: number
}

const SKIP_TYPES = new Set(["image/gif", "image/svg+xml"])

export async function compressImage(
  file: File,
  options: CompressOptions = {}
): Promise<File> {
  if (SKIP_TYPES.has(file.type)) return file

  try {
    const compressed = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB ?? DEFAULT_MAX_SIZE_MB,
      maxWidthOrHeight: options.maxWidthOrHeight ?? DEFAULT_MAX_DIMENSION,
      useWebWorker: true,
      initialQuality: 0.82,
    })

    if (compressed.size >= file.size) return file

    return new File([compressed], file.name, {
      type: compressed.type || file.type,
      lastModified: Date.now(),
    })
  } catch {
    return file
  }
}
