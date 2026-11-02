import '@/lib/i18n'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { http, HttpResponse } from 'msw'
import { server } from '@/mocks/server'
import AccentColorPicker from './AccentColorPicker'
import type { UserMotorcycle } from '@/types'

const customMoto: UserMotorcycle = {
  id: 1,
  currentKm: 1000,
  acquiredAt: '2022-01-01T00:00:00.000Z',
  motorcycleId: 1,
  brand: 'Franken',
  model: 'Bike',
  year: 2020,
  isCustom: true,
  catalogSlug: null,
  accentColor: null,
}

const catalogMoto: UserMotorcycle = {
  ...customMoto,
  id: 2,
  brand: 'Honda',
  isCustom: false,
  catalogSlug: 'honda-cb500-2020',
}

function renderWithClient(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

describe('AccentColorPicker', () => {
  it('renders 8 swatches for a custom motorcycle, none pre-selected', () => {
    renderWithClient(<AccentColorPicker moto={customMoto} />)
    const swatches = screen.getAllByRole('button')
    expect(swatches).toHaveLength(8)
    expect(swatches.every((s) => s.getAttribute('aria-pressed') === 'false')).toBe(true)
  })

  it('marks the motorcycle\'s chosen swatch as selected', () => {
    renderWithClient(<AccentColorPicker moto={{ ...customMoto, accentColor: 'purple' }} />)
    expect(screen.getByRole('button', { name: 'Couleur : Violet' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('calls the accent-color endpoint when a swatch is clicked', async () => {
    server.use(
      http.patch('*/api/v1/user-motorcycles/:id/accent-color', () =>
        HttpResponse.json({ id: 1, accentColor: 'blue' }),
      ),
    )
    renderWithClient(<AccentColorPicker moto={customMoto} />)
    await userEvent.click(screen.getByRole('button', { name: 'Couleur : Bleu' }))
    // No crash / error surfaced — the optimistic update + mutation round-trip succeeded.
  })

  it('renders a single static dot for a catalog motorcycle, no buttons', () => {
    renderWithClient(<AccentColorPicker moto={catalogMoto} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
  })

  it('renders nothing for a catalog motorcycle with no brand mapping', () => {
    renderWithClient(<AccentColorPicker moto={{ ...catalogMoto, brand: 'Ducati' }} />)
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(document.querySelector('span')).toBeNull()
  })
})
