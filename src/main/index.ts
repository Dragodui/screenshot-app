import {
  app,
  BrowserWindow,
  screen,
  ipcMain,
  globalShortcut,
  clipboard,
  nativeImage,
  desktopCapturer,
  dialog
} from 'electron'
import { join } from 'path'
import { electronApp, is } from '@electron-toolkit/utils'
import path from 'path'
import { IRect } from '../types'

let captureWindow: BrowserWindow | null = null
let currentRect: IRect | null = null

const createCaptureWindow = () => {
  const { bounds } = screen.getPrimaryDisplay()

  captureWindow = new BrowserWindow({
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    // alwaysOnTop: true,
    resizable: false,
    movable: false,
    skipTaskbar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })
  // captureWindow.webContents.openDevTools();

  captureWindow.on('focus', () => {
    console.log('Capture window is focused')
  })

  captureWindow.on('blur', () => {
    console.log('Capture window lost focus')
  })

  captureWindow.setIgnoreMouseEvents(false)

  captureWindow.focus()

  captureWindow.on('closed', () => {
    captureWindow = null
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    captureWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    captureWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.electron')

  globalShortcut.register('CommandOrControl+Shift+S', () => {
    console.log('CommandOrControl+Shift+S is pressed')
    createCaptureWindow()
  })
})

ipcMain.handle('save-screenshot', async (_event, imageBuffer: Buffer) => {
  try {
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Screenshot',
      defaultPath: path.join(app.getPath('pictures'), `screenshot-${Date.now()}.png`),
      filters: [{ name: 'Images', extensions: ['png'] }]
    })

    if (canceled || !filePath) {
      console.error('Save canceled')
      return
    }

    require('fs').writeFileSync(filePath, imageBuffer)

    console.log(`Screenshot saved to ${filePath}`)
  } catch (error) {
    console.error('Error saving screenshot', error)
  }
})

ipcMain.handle('copy-screenshot', async (_event, imageBuffer: Buffer) => {
  try {
    const image = nativeImage.createFromBuffer(imageBuffer)
    clipboard.writeImage(image)

    console.log('Screenshot copied to clipboard')
  } catch (error) {
    console.error('Error copying screenshot', error)
  }
})

ipcMain.handle('capture-region', async (_event, region: IRect) => {
  try {
    currentRect = region
    const { x, y, width, height } = region

    if (width <= 0 || height <= 0) {
      console.error('Invalid region:', region)
    }

    console.log('CAPTURE REGION', region)

    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: screen.getPrimaryDisplay().size
    })
    const screenSource = sources.find((source) => source.id === 'screen:0:0')

    if (!screenSource) {
      return
    }

    const image = nativeImage.createFromDataURL(screenSource.thumbnail.toDataURL())

    const screenSize = image.getSize()
    if (x < 0 || y < 0 || x + width > screenSize.width || y + height > screenSize.height) {
      console.error('Invalid region:', region)
    }

    const croppedImage = image.crop({ x, y, width, height })
    const resultImage = croppedImage.toPNG()
    return resultImage
  } catch (error) {
    console.error('Error capturing region:', error)
    throw error
  }
})

ipcMain.on('close-window', () => {
  try {
    if (captureWindow) {
      captureWindow.hide()
      console.log('hided')
    }
  } catch (error) {
    console.error('Error closing window', error)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})
