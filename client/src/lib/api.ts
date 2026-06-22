import log from './logger'
import type { AddMotorcyclePayload, CreateTicketPayload, UpdateTicketIntervalPayload, Motorcycle, Ticket, TicketPart, TicketStatus, UserMotorcycle, VelocityResult, CreatePartPayload } from '@/types'

export interface UpdateTicketPayload {
  operation?: string
  targetKm?: number | null
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly statusText: string,
    public readonly body: unknown = null,
  ) {
    super(`${status} ${statusText}`)
    this.name = 'ApiError'
  }
}

const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    log.error(`[api] ${init?.method ?? 'GET'} ${path} → ${res.status} ${res.statusText}`, body)
    throw new ApiError(res.status, res.statusText, body)
  }
  return res.json() as Promise<T>
}

export const api = {
  getMotorcycles: () =>
    request<Motorcycle[]>('/api/v1/motorcycles'),

  getUserMotorcycles: () =>
    request<UserMotorcycle[]>('/api/v1/user-motorcycles'),

  addMotorcycle: (data: AddMotorcyclePayload) =>
    request<UserMotorcycle>('/api/v1/user-motorcycles', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getTickets: (userMotorcycleId: number) =>
    request<Ticket[]>(`/api/v1/tickets?userMotorcycleId=${userMotorcycleId}`),

  createTicket: (data: CreateTicketPayload) =>
    request<Ticket>('/api/v1/tickets', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  patchTicketStatus: (id: number, status: TicketStatus) =>
    request<Ticket>(`/api/v1/tickets/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  getVelocity: (userMotorcycleId: number) =>
    request<VelocityResult | null>(`/api/v1/user-motorcycles/${userMotorcycleId}/velocity`),

  importIntervals: (userMotorcycleId: number) =>
    request<{ created: number }>(`/api/v1/user-motorcycles/${userMotorcycleId}/import-intervals`, {
      method: 'POST',
    }),

  updateKm: (userMotorcycleId: number, km: number) =>
    request<{ id: number; currentKm: number }>(`/api/v1/user-motorcycles/${userMotorcycleId}/km`, {
      method: 'PATCH',
      body: JSON.stringify({ km }),
    }),

  patchTicketInterval: (id: number, data: UpdateTicketIntervalPayload) =>
    request<Ticket>(`/api/v1/tickets/${id}/interval`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  updateTicket: (id: number, data: UpdateTicketPayload) =>
    request<Ticket>(`/api/v1/tickets/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  deleteTicket: (id: number) =>
    request<void>(`/api/v1/tickets/${id}`, { method: 'DELETE' }),

  deleteMotorcycle: (userMotorcycleId: number) =>
    request<void>(`/api/v1/user-motorcycles/${userMotorcycleId}`, { method: 'DELETE' }),

  getTicketParts: (ticketId: number) =>
    request<TicketPart[]>(`/api/v1/tickets/${ticketId}/parts`),

  addTicketPart: (ticketId: number, data: CreatePartPayload) =>
    request<TicketPart>(`/api/v1/tickets/${ticketId}/parts`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteTicketPart: (ticketId: number, partId: number) =>
    request<void>(`/api/v1/tickets/${ticketId}/parts/${partId}`, { method: 'DELETE' }),
}
