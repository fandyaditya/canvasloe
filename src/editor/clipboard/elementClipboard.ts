import { db } from '../../db/db'
import type { CanvasElement, FrameElement, ImageElement, MarkdownElement } from '../../db/schema'
import { createId } from '../../utils/ids'
import { duplicateMediaAsset } from '../../db/mediaRepo'
import { applyFrameLayout, getSelectionBounds } from '../frame/frameLayout'

type ElementClipboardPayload = {
  elements: CanvasElement[]
  sourceCanvasId: string
  sourceProjectId: string
  bounds: { x: number; y: number; width: number; height: number }
  pasteCount: number
}

let clipboard: ElementClipboardPayload | null = null

function cloneElements(elements: CanvasElement[]): CanvasElement[] {
  return JSON.parse(JSON.stringify(elements)) as CanvasElement[]
}

export function hasElementClipboard(): boolean {
  return clipboard != null && clipboard.elements.length > 0
}

export function copyElementsToClipboard(
  allElements: CanvasElement[],
  selectedIds: string[],
  sourceCanvasId: string,
  sourceProjectId: string,
): boolean {
  if (selectedIds.length === 0) return false

  const selected = new Set(selectedIds)
  const toCopy = new Map<string, CanvasElement>()

  for (const id of selectedIds) {
    const el = allElements.find((e) => e.id === id)
    if (!el) continue

    if (el.type === 'frame') {
      toCopy.set(el.id, el)
      for (const childId of el.childIds ?? []) {
        const child = allElements.find((e) => e.id === childId)
        if (child) toCopy.set(childId, child)
      }
      continue
    }

    const parentFrame = allElements.find(
      (f): f is FrameElement => f.type === 'frame' && (f.childIds ?? []).includes(id),
    )
    if (parentFrame && selected.has(parentFrame.id)) continue

    toCopy.set(id, el)
  }

  const elements = [...toCopy.values()]
  if (elements.length === 0) return false

  clipboard = {
    elements: cloneElements(elements),
    sourceCanvasId,
    sourceProjectId,
    bounds: getSelectionBounds(elements),
    pasteCount: 0,
  }

  return true
}

async function remapMediaReferences(
  element: CanvasElement,
  projectId: string,
  canvasId: string,
  sourceCanvasId: string,
  mediaIdMap: Map<string, string>,
): Promise<CanvasElement> {
  const needsCopy = canvasId !== sourceCanvasId

  if (element.type === 'image') {
    const image = element as ImageElement
    if (!needsCopy) return element

    let nextAssetId = mediaIdMap.get(image.assetId)
    if (!nextAssetId) {
      nextAssetId = await duplicateMediaAsset(image.assetId, projectId, canvasId)
      mediaIdMap.set(image.assetId, nextAssetId)
    }
    return { ...element, assetId: nextAssetId }
  }

  if (element.type === 'markdown') {
    const markdown = element as MarkdownElement
    if (!needsCopy) return element

    let nextContentId = mediaIdMap.get(markdown.contentId)
    if (!nextContentId) {
      nextContentId = await duplicateMediaAsset(markdown.contentId, projectId, canvasId)
      mediaIdMap.set(markdown.contentId, nextContentId)
    }
    return { ...element, contentId: nextContentId }
  }

  return element
}

export async function pasteElementsFromClipboard(
  projectId: string,
  canvasId: string,
  targetElements: CanvasElement[],
  pasteAt: { x: number; y: number },
): Promise<{ elements: CanvasElement[]; selectedIds: string[] } | null> {
  if (!clipboard || clipboard.elements.length === 0) return null

  const idMap = new Map<string, string>()
  for (const el of clipboard.elements) {
    idMap.set(el.id, createId())
  }

  const offset = 20 * clipboard.pasteCount
  const dx = pasteAt.x - clipboard.bounds.x - clipboard.bounds.width / 2 + offset
  const dy = pasteAt.y - clipboard.bounds.y - clipboard.bounds.height / 2 + offset

  const maxZ = targetElements.reduce((max, el) => Math.max(max, el.zIndex), 0)
  const mediaIdMap = new Map<string, string>()
  const now = Date.now()

  const pasted: CanvasElement[] = []
  for (let i = 0; i < clipboard.elements.length; i++) {
    const source = clipboard.elements[i]!
    let next = {
      ...source,
      id: idMap.get(source.id)!,
      projectId,
      canvasId,
      x: source.x + dx,
      y: source.y + dy,
      zIndex: maxZ + i + 1,
      createdAt: now,
      updatedAt: now,
    } as CanvasElement

    if (next.type === 'frame') {
      next = {
        ...next,
        childIds: (source as FrameElement).childIds
          .map((childId) => idMap.get(childId))
          .filter((childId): childId is string => childId != null),
      }
    }

    next = await remapMediaReferences(next, projectId, canvasId, clipboard.sourceCanvasId, mediaIdMap)
    pasted.push(next)
  }

  for (const el of pasted) {
    await db.elements.add(el)
  }

  let merged = [...targetElements, ...pasted]
  for (const el of pasted) {
    if (el.type === 'frame') {
      merged = applyFrameLayout(el.id, merged)
    }
  }

  clipboard.pasteCount += 1

  const pastedIdSet = new Set(pasted.map((el) => el.id))
  const selectedIds = pasted
    .filter((el) => {
      if (el.type === 'frame') return true
      const parent = pasted.find(
        (f): f is FrameElement => f.type === 'frame' && (f.childIds ?? []).includes(el.id),
      )
      return !parent || !pastedIdSet.has(parent.id)
    })
    .map((el) => el.id)

  return { elements: merged, selectedIds }
}
