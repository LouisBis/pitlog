import '@/lib/i18n'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import TicketCardBody from './TicketCardBody'
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
  photoBase64: 'data:image/jpeg;base64,AAAA',
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('TicketCardBody', () => {
  it('shows the photo thumbnail for a done ticket with a photo', () => {
    renderWithClient(
      <TicketCardBody
        ticket={doneTicket}
        parts={[]}
        urgency="ok"
        kmLabel={null}
        daysLabel={null}
        doneAtKmLabel="Fait à 8500 km"
      />,
    )
    expect(screen.getByRole('button', { name: 'Photo du ticket' })).toBeInTheDocument()
  })
})
