import { http, HttpResponse } from 'msw'
import type { CreateTicketPayload, TicketStatus } from '@/types'
import { mockUserMotorcycles, mockTickets, mockVelocity, mockIntervals, nextId } from './data'

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
          })
        }
      }
    }

    return HttpResponse.json(ticket)
  }),
]
