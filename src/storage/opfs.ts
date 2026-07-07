export type OpfsEntry = {
  name: string
  kind: 'file' | 'directory'
  path: string
}

export type OpfsTreeEntry = OpfsEntry & {
  children?: OpfsTreeEntry[]
}

export function isOpfsSupported(): boolean {
  return typeof navigator !== 'undefined' && 'storage' in navigator && 'getDirectory' in navigator.storage
}

let rootHandle: FileSystemDirectoryHandle | null = null

export async function getOpfsRoot(): Promise<FileSystemDirectoryHandle> {
  if (!isOpfsSupported()) {
    throw new Error('OPFS is not supported in this browser')
  }
  if (!rootHandle) {
    const storageRoot = await navigator.storage.getDirectory()
    rootHandle = await storageRoot.getDirectoryHandle('media', { create: true })
  }
  return rootHandle
}

function splitPath(path: string): string[] {
  return path.split('/').filter(Boolean)
}

async function getDirHandle(
  path: string,
  create = false,
): Promise<FileSystemDirectoryHandle> {
  const parts = splitPath(path)
  let dir = await getOpfsRoot()
  for (const part of parts) {
    dir = await dir.getDirectoryHandle(part, { create })
  }
  return dir
}

async function getParentDirAndName(
  path: string,
  create = false,
): Promise<{ dir: FileSystemDirectoryHandle; name: string }> {
  const parts = splitPath(path)
  const name = parts.pop()
  if (!name) throw new Error(`Invalid path: ${path}`)
  const dir = parts.length > 0 ? await getDirHandle(parts.join('/'), create) : await getOpfsRoot()
  return { dir, name }
}

export async function ensureDirectory(path: string): Promise<void> {
  if (!path) return
  await getDirHandle(path, true)
}

export async function writeFile(path: string, data: Blob | string): Promise<void> {
  const { dir, name } = await getParentDirAndName(path, true)
  const handle = await dir.getFileHandle(name, { create: true })
  const writable = await handle.createWritable()
  await writable.write(typeof data === 'string' ? data : data)
  await writable.close()
}

export async function readFile(path: string): Promise<Blob> {
  const { dir, name } = await getParentDirAndName(path)
  const handle = await dir.getFileHandle(name)
  return handle.getFile()
}

export async function readText(path: string): Promise<string> {
  const blob = await readFile(path)
  return blob.text()
}

export async function deleteFile(path: string): Promise<void> {
  const { dir, name } = await getParentDirAndName(path)
  await dir.removeEntry(name)
}

export async function deleteDirectory(path: string): Promise<void> {
  if (!path) return
  const { dir, name } = await getParentDirAndName(path)
  await dir.removeEntry(name, { recursive: true })
}

export async function listDirectory(path = ''): Promise<OpfsEntry[]> {
  const dir = path ? await getDirHandle(path) : await getOpfsRoot()
  const entries: OpfsEntry[] = []
  const prefix = path ? `${path}/` : ''

  for await (const [name, handle] of dir.entries()) {
    entries.push({
      name,
      kind: handle.kind,
      path: `${prefix}${name}`,
    })
  }

  return entries.sort((a, b) => {
    if (a.kind !== b.kind) return a.kind === 'directory' ? -1 : 1
    return a.name.localeCompare(b.name)
  })
}

export async function listTree(path = '', maxDepth = 4): Promise<OpfsTreeEntry[]> {
  const entries = await listDirectory(path)
  const result: OpfsTreeEntry[] = []

  for (const entry of entries) {
    if (entry.kind === 'directory' && maxDepth > 0) {
      const children = await listTree(entry.path, maxDepth - 1)
      result.push({ ...entry, children })
    } else {
      result.push(entry)
    }
  }

  return result
}

export async function fileExists(path: string): Promise<boolean> {
  try {
    await readFile(path)
    return true
  } catch {
    return false
  }
}

export async function getOpfsTotalSize(path = ''): Promise<number> {
  if (!isOpfsSupported()) return 0

  const entries = await listDirectory(path)
  let total = 0

  for (const entry of entries) {
    if (entry.kind === 'directory') {
      total += await getOpfsTotalSize(entry.path)
    } else {
      const file = await readFile(entry.path)
      total += file.size
    }
  }

  return total
}

export async function listAllOpfsFilePaths(path = ''): Promise<string[]> {
  if (!isOpfsSupported()) return []

  const entries = await listDirectory(path)
  const files: string[] = []

  for (const entry of entries) {
    if (entry.kind === 'directory') {
      files.push(...(await listAllOpfsFilePaths(entry.path)))
    } else {
      files.push(entry.path)
    }
  }

  return files
}

export async function clearOpfsMedia(): Promise<void> {
  if (!isOpfsSupported()) return

  const entries = await listDirectory()
  for (const entry of entries) {
    await deleteDirectory(entry.path)
  }
}
