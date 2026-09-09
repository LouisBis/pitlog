import '@/lib/i18n'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import TicketPhotoThumbnail from './TicketPhotoThumbnail'

describe('TicketPhotoThumbnail', () => {
  it('renders a thumbnail image', () => {
    render(<TicketPhotoThumbnail photoBase64="data:image/jpeg;base64,AAAA" />)
    expect(screen.getByRole('button', { name: 'Photo du ticket' })).toBeInTheDocument()
  })

  it('opens the full-size viewer on click', async () => {
    render(<TicketPhotoThumbnail photoBase64="data:image/jpeg;base64,AAAA" />)
    await userEvent.click(screen.getByRole('button', { name: 'Photo du ticket' }))
    expect(screen.getByRole('img', { name: 'Photo du ticket' })).toBeInTheDocument()
  })

  it('closes the viewer on the close button', async () => {
    render(<TicketPhotoThumbnail photoBase64="data:image/jpeg;base64,AAAA" />)
    await userEvent.click(screen.getByRole('button', { name: 'Photo du ticket' }))
    await userEvent.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('img', { name: 'Photo du ticket' })).not.toBeInTheDocument()
  })
})
