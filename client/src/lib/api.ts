import log from './logger'
import type { AddMotorcyclePayload, CreateTicketPayload, Motorcycle, Ticket, TicketStatus, UserMotorcycle, VelocityResult } from '@/types'

const BASE = import.meta.env.VITE_API_URL ?? ''

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  })
  if (!res.ok) {
    log.error(`[api] ${init?.method ?? 'GET'} ${path} → ${res.status} ${res.statusText}`)
    throw new Error(`${res.status} ${res.statusText}`)
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

  updateKm: (userMotorcycleId: number, km: number) =>
    request<{ id: number; currentKm: number }>(`/api/v1/user-motorcycles/${userMotorcycleId}/km`, {
      method: 'PATCH',
      body: JSON.stringify({ km }),
    }),
}
