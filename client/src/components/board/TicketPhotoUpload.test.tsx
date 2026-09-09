import '@/lib/i18n'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import TicketPhotoUpload from './TicketPhotoUpload'
import type { Ticket } from '@/types'

const doneTicket: Ticket = {
  id: 1,
  userMotorcycleId: 1,
  catalogSlug: null,
  intervalSlug: null,
  customIntervalId: null,
  operation: 'Oil change',
  status: 'done',
  targetKm: null,
  targetDate: null,
  doneKm: 8500,
  doneAt: '2026-08-01T00:00:00.000Z',
  customKm: null,
  customDays: null,
  photoBase64: null,
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('TicketPhotoUpload', () => {
  it('renders nothing for a ticket that is not done', () => {
    const { container } = renderWithClient(<TicketPhotoUpload ticket={{ ...doneTicket, status: 'todo' }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows an add button when the done ticket has no photo', () => {
    renderWithClient(<TicketPhotoUpload ticket={doneTicket} />)
    expect(screen.getByRole('button', { name: 'Ajouter une photo' })).toBeInTheDocument()
  })

  it('shows the thumbnail; replace/delete actions appear once the viewer is open', async () => {
    renderWithClient(<TicketPhotoUpload ticket={{ ...doneTicket, photoBase64: 'data:image/jpeg;base64,AAAA' }} />)
    expect(screen.queryByRole('button', { name: 'Remplacer' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Supprimer la photo' })).not.toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Photo du ticket' }))

    expect(screen.getByRole('button', { name: 'Remplacer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Supprimer la photo' })).toBeInTheDocument()
  })

  it('shows an inline error when the delete mutation fails', async () => {
    server.use(http.delete('*/api/v1/tickets/:id/photo', () => new HttpResponse(null, { status: 500 })))
    renderWithClient(<TicketPhotoUpload ticket={{ ...doneTicket, photoBase64: 'data:image/jpeg;base64,AAAA' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Photo du ticket' }))
    await userEvent.click(screen.getByRole('button', { name: 'Supprimer la photo' }))
    await waitFor(() => expect(screen.getByText('Erreur lors de l\'envoi de la photo.')).toBeInTheDocument())
  })

  it('shows an inline error when the selected file is not an image', async () => {
    // accept="image/*" makes the real OS picker filter non-images; applyAccept: false
    // bypasses that here to simulate a user picking one anyway (e.g. via "All Files").
    const user = userEvent.setup({ applyAccept: false })
    const { container } = renderWithClient(<TicketPhotoUpload ticket={doneTicket} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    const notAnImage = new File(['not an image'], 'notes.txt', { type: 'text/plain' })
    await user.upload(input, notAnImage)
    await waitFor(() => expect(screen.getByText("Ce fichier n'est pas une image.")).toBeInTheDocument())
  })
})
