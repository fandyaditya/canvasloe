export {
  createImageMedia as createAsset,
  createImageMedia,
  createMarkdownMedia,
  deleteAsset,
  deleteCanvasMedia,
  deleteMedia,
  deleteMediaIfUnreferenced,
  deleteProjectMedia,
  ensureCanvasFolders,
  getAsset,
  getAssetsByCanvas,
  getMedia,
  getMediaByCanvas,
  isMediaReferenced,
  readMarkdownContent,
  readMediaBlob,
  updateAssetBlob,
  updateImageMedia,
  updateMarkdownContent,
} from './mediaRepo'

export type { MediaAsset as ImageAsset } from './schema'
