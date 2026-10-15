import '@/lib/i18n'
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClientProvider, QueryClient } from '@tanstack/react-query'
import HistoryActions from './HistoryActions'
import * as historyExport from '@/lib/historyExport'
import type { UserMotorcycle, Ticket } from '@/types'

const moto: UserMotorcycle = {
  id: 1,
  currentKm: 12000,
  acquiredAt: '2022-01-01T00:00:00.000Z',
  motorcycleId: 1,
  brand: 'Suzuki',
  model: 'GSF 600 Bandit',
  year: 1997,
  isCustom: false,
  catalogSlug: 'suzuki-gsf600-bandit-1995-1999',
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('HistoryActions', () => {
  it('shows Import and Export buttons', () => {
    renderWithClient(<HistoryActions moto={moto} doneTickets={[] as Ticket[]} existingTickets={[] as Ticket[]} />)
    expect(screen.getByRole('button', { name: 'Importer' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Exporter' })).toBeInTheDocument()
  })

  it('triggers a CSV download when "Exporter en CSV" is chosen', async () => {
    const downloadSpy = vi.spyOn(historyExport, 'downloadFile').mockImplementation(() => {})
    renderWithClient(<HistoryActions moto={moto} doneTickets={[] as Ticket[]} existingTickets={[] as Ticket[]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Exporter' }))
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Exporter en CSV' }))

    expect(downloadSpy).toHaveBeenCalledWith(expect.any(String), expect.stringContaining('.csv'), 'text/csv')
  })

  it('opens the import dialog when "Importer" is clicked', async () => {
    renderWithClient(<HistoryActions moto={moto} doneTickets={[] as Ticket[]} existingTickets={[] as Ticket[]} />)
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))
    expect(await screen.findByText('Sélectionne un fichier CSV ou JSON')).toBeInTheDocument()
  })
})
