import type { MediaKind } from '../db/schema'

const KIND_FOLDERS: Record<MediaKind, string> = {
  image: 'images',
  video: 'videos',
  markdown: 'md',
}

export function kindFolder(kind: MediaKind): string {
  return KIND_FOLDERS[kind]
}

export function canvasMediaRoot(projectId: string, canvasId: string): string {
  return `${projectId}/${canvasId}`
}

export function mediaPath(
  projectId: string,
  canvasId: string,
  kind: MediaKind,
  filename: string,
): string {
  return `${canvasMediaRoot(projectId, canvasId)}/${kindFolder(kind)}/${filename}`
}

export function extensionForMime(mimeType: string, kind: MediaKind): string {
  if (kind === 'markdown') return 'md'
  const map: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'video/mp4': 'mp4',
    'video/webm': 'webm',
    'video/quicktime': 'mov',
  }
  return map[mimeType] ?? mimeType.split('/')[1]?.split('+')[0] ?? 'bin'
}

export function mediaFilename(id: string, mimeType: string, kind: MediaKind): string {
  return `${id}.${extensionForMime(mimeType, kind)}`
}
