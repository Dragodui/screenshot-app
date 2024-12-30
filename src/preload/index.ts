import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { IRect } from './../types'

// Custom APIs for renderer
const api = {
  saveScreenshot: async (imageBuffer: Buffer) => ipcRenderer.invoke('save-screenshot', imageBuffer),
  copyScreenshot: async (imageBuffer: Buffer) => ipcRenderer.invoke('copy-screenshot', imageBuffer),
  captureRegion: (region: IRect) => ipcRenderer.invoke('capture-region', region),
  closeWindow: () => ipcRenderer.send('close-window')
}

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
