import '@/lib/i18n'
import { describe, it, expect } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import ImportHistoryDialog from './ImportHistoryDialog'
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
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function makeCsvFile(content: string): File {
  return new File([content], 'history.csv', { type: 'text/csv' })
}

describe('ImportHistoryDialog', () => {
  it('walks a CSV through upload → mapping → matching → preview → confirm', async () => {
    server.use(
      http.post('*/api/v1/user-motorcycles/:id/history/import', () => HttpResponse.json({ created: 1, regenerated: 0 }, { status: 201 })),
    )

    renderWithClient(
      <ImportHistoryDialog open onOpenChange={() => {}} moto={moto} existingTickets={[] as Ticket[]} />,
    )

    const file = makeCsvFile('Date,Opération,Kilométrage\n2024-01-15,Réparation guidon,9000\n')
    const input = document.querySelector('input[type="file"]') as HTMLInputElement
    await userEvent.upload(input, file)

    // Mapping step: headers auto-guessed, just continue.
    await userEvent.click(await screen.findByRole('button', { name: 'Importer' }))

    // Matching step: no candidates configured for this test, row stays "Aucun — ponctuel".
    await userEvent.click(await screen.findByRole('button', { name: 'Importer' }))

    // Preview step: one valid entry, confirm.
    await screen.findByText('1 lignes seront importées, 0 ignorées')
    await userEvent.click(screen.getByRole('button', { name: 'Importer' }))

    await waitFor(() => expect(screen.queryByText('Erreur lors de l\'import.')).not.toBeInTheDocument())
  })
})
