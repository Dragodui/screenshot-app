import { ElectronAPI } from '@electron-toolkit/preload'
import { IRect } from './../types'
interface Api {
  saveScreenshot: (imageBuffer: Buffer) => Promise<void>
  copyScreenshot: (imageBuffer: Buffer) => Promise<void>
  captureRegion: (region: IRect) => Promise<Buffer>
  closeWindow: () => void
}
declare global {
  interface Window {
    electron: ElectronAPI
    api: Api
  }
}
