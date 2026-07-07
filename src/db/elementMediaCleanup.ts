import { deleteMediaIfUnreferenced } from './mediaRepo'
import type { CanvasElement } from './schema'

export async function cleanupMediaForDeletedElement(element: CanvasElement): Promise<void> {
  if (element.type === 'image') {
    await deleteMediaIfUnreferenced(element.assetId)
  } else if (element.type === 'markdown') {
    await deleteMediaIfUnreferenced(element.contentId)
  }
}
