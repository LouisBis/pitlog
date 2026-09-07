import { describe, it, expect } from 'vitest'
import { scaledDimensions, resizeImage } from './imagePhoto'

describe('scaledDimensions', () => {
  it('leaves a landscape image under the limit unchanged', () => {
    expect(scaledDimensions(800, 600, 1200)).toEqual({ width: 800, height: 600 })
  })

  it('scales down a landscape image over the limit, preserving aspect ratio', () => {
    expect(scaledDimensions(2400, 1200, 1200)).toEqual({ width: 1200, height: 600 })
  })

  it('scales down a portrait image by its longer side', () => {
    expect(scaledDimensions(1200, 2400, 1200)).toEqual({ width: 600, height: 1200 })
  })

  it('leaves a square image at exactly the limit unchanged', () => {
    expect(scaledDimensions(1200, 1200, 1200)).toEqual({ width: 1200, height: 1200 })
  })
})

describe('resizeImage', () => {
  it('rejects a non-image file before touching the canvas', async () => {
    const file = new File(['not an image'], 'notes.txt', { type: 'text/plain' })
    await expect(resizeImage(file)).rejects.toThrow('invalid_file_type')
  })
})
