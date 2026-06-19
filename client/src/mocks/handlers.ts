import { http, HttpResponse } from 'msw'
import type { CreatePartPayload, CreateTicketPayload, TicketStatus, UpdateTicketIntervalPayload } from '@/types'
import { mockUserMotorcycles, mockTickets, mockParts, mockVelocity, mockIntervals, nextId, nextMockPartId } from './data'
import type { UpdateTicketPayload } from '@/lib/api'

export const handlers = [
  http.get('*/api/v1/user-motorcycles', () => {
    return HttpResponse.json(mockUserMotorcycles)
  }),

  http.get('*/api/v1/user-motorcycles/:id/velocity', ({ params }) => {
    const id = Number(params.id)
    if (!mockUserMotorcycles.find((m) => m.id === id)) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(mockVelocity)
  }),

  http.patch('*/api/v1/user-motorcycles/:id/km', async ({ params, request }) => {
    const id = Number(params.id)
    const moto = mockUserMotorcycles.find((m) => m.id === id)
    if (!moto) return new HttpResponse(null, { status: 404 })
    const body = (await request.json()) as { km: number }
    if (body.km <= moto.currentKm) return new HttpResponse(null, { status: 400 })
    moto.currentKm = body.km
    return HttpResponse.json({ id: moto.id, currentKm: moto.currentKm })
  }),

  http.delete('*/api/v1/user-motorcycles/:id', ({ params }) => {
    const id = Number(params.id)
    const idx = mockUserMotorcycles.findIndex((m) => m.id === id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    const ticketIds = mockTickets.filter((t) => t.userMotorcycleId === id).map((t) => t.id)
    ticketIds.forEach((tid) => {
      const pi = mockParts.findIndex((p) => p.ticketId === tid)
      if (pi !== -1) mockParts.splice(pi, 1)
    })
    mockTickets.splice(0, mockTickets.length, ...mockTickets.filter((t) => t.userMotorcycleId !== id))
    mockUserMotorcycles.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.post('*/api/v1/user-motorcycles/:id/import-intervals', ({ params }) => {
    const id = Number(params.id)
    if (!mockUserMotorcycles.find((m) => m.id === id)) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json({ created: 0 })
  }),

  http.get('*/api/v1/tickets', ({ request }) => {
    const url = new URL(request.url)
    const userMotorcycleId = Number(url.searchParams.get('userMotorcycleId'))
    return HttpResponse.json(mockTickets.filter((t) => t.userMotorcycleId === userMotorcycleId))
  }),

  http.post('*/api/v1/tickets', async ({ request }) => {
    const body = (await request.json()) as CreateTicketPayload
    const ticket = {
      id: nextId(),
      userMotorcycleId: body.userMotorcycleId,
      intervalId: body.intervalId ?? null,
      operation: body.operation,
      status: 'todo' as TicketStatus,
      targetKm: body.targetKm ?? null,
      targetDate: body.targetDate ?? null,
      doneKm: null,
      doneAt: null,
      customKm: null,
      customDays: null,
    }
    mockTickets.push(ticket)
    return HttpResponse.json(ticket, { status: 201 })
  }),

  http.patch('*/api/v1/tickets/:id/status', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as { status: TicketStatus }
    const ticket = mockTickets.find((t) => t.id === id)
    if (!ticket) return new HttpResponse(null, { status: 404 })

    ticket.status = body.status

    if (body.status === 'done') {
      const moto = mockUserMotorcycles.find((m) => m.id === ticket.userMotorcycleId)
      ticket.doneKm = moto?.currentKm ?? null
      ticket.doneAt = new Date().toISOString()

      if (ticket.intervalId !== null && ticket.doneKm !== null) {
        const interval = mockIntervals[ticket.intervalId]
        if (interval) {
          const nextTargetKm = interval.intervalKm !== null ? ticket.doneKm + interval.intervalKm : null
          const nextTargetDate =
            interval.intervalDays !== null
              ? new Date(Date.now() + interval.intervalDays * 24 * 60 * 60 * 1000).toISOString()
              : null
          mockTickets.push({
            id: nextId(),
            userMotorcycleId: ticket.userMotorcycleId,
            intervalId: ticket.intervalId,
            operation: ticket.operation,
            status: 'todo',
            targetKm: nextTargetKm,
            targetDate: nextTargetDate,
            doneKm: null,
            doneAt: null,
            customKm: null,
            customDays: null,
          })
        }
      }
    }

    return HttpResponse.json(ticket)
  }),

  http.patch('*/api/v1/tickets/:id/interval', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as UpdateTicketIntervalPayload
    const ticket = mockTickets.find((t) => t.id === id)
    if (!ticket) return new HttpResponse(null, { status: 404 })
    ticket.customKm = body.customKm ?? null
    ticket.customDays = body.customDays ?? null
    return HttpResponse.json(ticket)
  }),

  http.patch('*/api/v1/tickets/:id', async ({ params, request }) => {
    const id = Number(params.id)
    const body = (await request.json()) as UpdateTicketPayload
    const ticket = mockTickets.find((t) => t.id === id)
    if (!ticket) return new HttpResponse(null, { status: 404 })
    if (body.operation !== undefined) ticket.operation = body.operation
    if (body.targetKm !== undefined) ticket.targetKm = body.targetKm
    return HttpResponse.json(ticket)
  }),

  http.delete('*/api/v1/tickets/:id', ({ params }) => {
    const id = Number(params.id)
    const idx = mockTickets.findIndex((t) => t.id === id)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    mockParts.splice(0, mockParts.length, ...mockParts.filter((p) => p.ticketId !== id))
    mockTickets.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('*/api/v1/tickets/:id/parts', ({ params }) => {
    const ticketId = Number(params.id)
    if (!mockTickets.find((t) => t.id === ticketId)) {
      return new HttpResponse(null, { status: 404 })
    }
    return HttpResponse.json(mockParts.filter((p) => p.ticketId === ticketId))
  }),

  http.post('*/api/v1/tickets/:id/parts', async ({ params, request }) => {
    const ticketId = Number(params.id)
    if (!mockTickets.find((t) => t.id === ticketId)) {
      return new HttpResponse(null, { status: 404 })
    }
    const body = (await request.json()) as CreatePartPayload
    const part = {
      id: nextMockPartId(),
      ticketId,
      name: body.name,
      brand: body.brand ?? null,
      reference: body.reference ?? null,
      quantity: body.quantity ?? 1,
      url: body.url ?? null,
    }
    mockParts.push(part)
    return HttpResponse.json(part, { status: 201 })
  }),

  http.delete('*/api/v1/tickets/:id/parts/:partId', ({ params }) => {
    const ticketId = Number(params.id)
    const partId = Number(params.partId)
    const idx = mockParts.findIndex((p) => p.id === partId && p.ticketId === ticketId)
    if (idx === -1) return new HttpResponse(null, { status: 404 })
    mockParts.splice(idx, 1)
    return new HttpResponse(null, { status: 204 })
  }),
]
