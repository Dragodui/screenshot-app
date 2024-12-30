import { IRect } from '../../types'

let startX: number,
  startY: number,
  rect: IRect | null = null
let capture: Buffer | null = null

const copyButton: HTMLElement | null = document.getElementById('copy')
const saveButton: HTMLElement | null = document.getElementById('save')
const buttonsBlock: HTMLElement | null = document.getElementById('buttons')

copyButton?.addEventListener('click', async (e) => {
  e.stopPropagation()
  console.log('Copy button clicked')
  await handleCopy()
})

saveButton?.addEventListener('click', async (e) => {
  e.stopPropagation()
  console.log('Save button clicked')
  await handleSave()
})

document.addEventListener('mousedown', (e) => {
  if (e.target === copyButton || e.target === saveButton) return
  startX = e.clientX
  startY = e.clientY
  rect = { x: startX, y: startY, width: 0, height: 0 }
  updateSelection()
})

document.addEventListener('mousemove', (e) => {
  if (!rect) return

  rect.width = e.clientX - startX
  rect.height = e.clientY - startY

  if (rect.width < 0) {
    rect.x = e.clientX
    rect.width = Math.abs(rect.width)
  }
  if (rect.height < 0) {
    rect.y = e.clientY
    rect.height = Math.abs(rect.height)
  }

  updateSelection()
})

document.addEventListener('mouseup', async () => {
  if (!rect) return

  const { x, y, width, height } = rect

  if (width <= 0 || height <= 0) {
    console.error('Invalid region dimensions (non-positive width or height)', {
      x,
      y,
      width,
      height
    })
    rect = null
    return
  }

  try {
    const selectionElement = document.getElementById('selection')
    if (selectionElement) {
      selectionElement.style.display = 'none'
    }
    capture = await (window as any).api.captureRegion(rect)
    if (selectionElement) {
      selectionElement.style.display = ''
    }
  } catch (error) {
    console.error('Error during screenshot process:', error)
  } finally {
    rect = null
  }
})

document.addEventListener('keydown', async (e) => {
  if (e.key === 'Escape') {
    ;(window as any).api.closeWindow()
  }
  if (e.key === 'c' && e.ctrlKey) {
    await handleCopy()
  }
  if (e.key === 's' && e.ctrlKey) {
    await handleSave()
  }
})

const handleCopy = async () => {
  if (!capture) return
  try {
    await (window as any).api.copyScreenshot(capture)
    await (window as any).api.closeWindow()
  } catch (error) {
    console.error('Error during screenshot process:', error)
  }
}

const handleSave = async () => {
  if (!capture) return
  try {
    await (window as any).api.saveScreenshot(capture)
    await (window as any).api.closeWindow()
  } catch (error) {
    console.error('Error during screenshot process:', error)
  }
}

const updateSelection = () => {
  const overlay = document.getElementById('overlay')
  const selection = document.getElementById('selection')
  if (!selection || !overlay || !rect) return

  selection.style.left = `${rect.x}px`
  selection.style.top = `${rect.y}px`
  selection.style.width = `${rect.width}px`
  selection.style.height = `${rect.height}px`

  overlay.style.clipPath = `polygon(
    0 0, 
    100% 0, 
    100% 100%, 
    0 100%, 
    0 ${rect.y}px, 
    ${rect.x}px ${rect.y}px, 
    ${rect.x}px ${rect.y + rect.height}px, 
    ${rect.x + rect.width}px ${rect.y + rect.height}px, 
    ${rect.x + rect.width}px ${rect.y}px, 
    0 ${rect.y}px
  )`

  if (buttonsBlock && copyButton && saveButton) {
    buttonsBlock.style.display = 'flex'
    buttonsBlock.style.top = `${rect.y}px`
    buttonsBlock.style.left = `${rect.x + rect.width}px`
    copyButton.style.display = 'flex'
    saveButton.style.display = 'flex'
  }
}
