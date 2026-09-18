import type { Reservation, ReservationInput, ReservationTicket } from '../types/event'

const STORAGE_KEY = 'vivacg:reservations'
export const MAX_TICKETS_PER_RESERVATION = 4

export class ExistingReservationError extends Error {
  constructor(public reservation: Reservation) {
    super('Já existe uma reserva ativa neste evento para o e-mail informado.')
    this.name = 'ExistingReservationError'
  }
}

function generateCode(prefix: 'R' | 'I') {
  return `VCG-${prefix}-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`
}

function createTicket(holderName: string | undefined, isPrimary: boolean, createdAt = new Date().toISOString()): ReservationTicket {
  return { id: crypto.randomUUID(), code: generateCode('I'), holderName: holderName?.trim().slice(0, 80) || undefined, isPrimary, status: 'active', createdAt }
}

export function getActiveTickets(reservation: Reservation) {
  return reservation.tickets.filter((ticket) => ticket.status === 'active')
}

function saveReservations(reservations: Reservation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations))
}

function normalizeReservation(raw: Record<string, unknown>): Reservation {
  const reservation = raw as unknown as Reservation & { guests?: Array<{ id: string; name?: string }> }
  const createdAt = reservation.createdAt ?? new Date().toISOString()
  let tickets = reservation.tickets
  if (!Array.isArray(tickets)) {
    const legacyGuests = Array.isArray(reservation.guests) ? reservation.guests : []
    tickets = reservation.status === 'waitlist' ? [] : [
      createTicket(reservation.name, true, createdAt),
      ...legacyGuests.map((guest) => createTicket(guest.name, false, createdAt)),
    ]
    while (tickets.length < Math.max(1, reservation.quantity ?? 1) && tickets.length < MAX_TICKETS_PER_RESERVATION) {
      tickets.push(createTicket(undefined, false, createdAt))
    }
  }
  const activeQuantity = tickets.filter((ticket) => ticket.status === 'active').length
  return {
    ...reservation,
    email: reservation.email.trim().toLowerCase(),
    status: reservation.status ?? 'confirmed',
    code: reservation.code ?? generateCode('R'),
    tickets,
    quantity: reservation.status === 'waitlist' ? 1 : activeQuantity,
    updatedAt: reservation.updatedAt ?? createdAt,
  }
}

export function getReservations(): Reservation[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  try {
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    const normalized = parsed.map((item) => normalizeReservation(item as Record<string, unknown>))
    const needsMigration = parsed.some((item) => {
      const reservation = item as Record<string, unknown>
      return !Array.isArray(reservation.tickets) || !reservation.code || !reservation.updatedAt
    })
    if (needsMigration) saveReservations(normalized)
    return normalized
  } catch {
    return []
  }
}

export function getReservedSpots(eventId: string): number {
  return getReservations()
    .filter((reservation) => reservation.eventId === eventId && reservation.status === 'confirmed')
    .reduce((total, reservation) => total + getActiveTickets(reservation).length, 0)
}

function validateInput(input: ReservationInput) {
  if (input.name.trim().length < 3 || input.name.trim().length > 80) throw new Error('Nome inválido.')
  if (!/^\S+@\S+\.\S+$/.test(input.email) || input.email.length > 120) throw new Error('E-mail inválido.')
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_TICKETS_PER_RESERVATION) throw new Error('Quantidade de ingressos inválida.')
}

export async function createReservation(input: ReservationInput, waitlist = false): Promise<Reservation> {
  validateInput(input)
  await new Promise((resolve) => setTimeout(resolve, 450))
  const reservations = getReservations()
  const email = input.email.trim().toLowerCase()
  const existingIndex = reservations.findIndex((reservation) => reservation.eventId === input.eventId && reservation.email === email)
  const existing = reservations[existingIndex]
  if (existing && existing.status !== 'cancelled') throw new ExistingReservationError(existing)

  const now = new Date().toISOString()
  const newTickets = waitlist ? [] : Array.from({ length: input.quantity }, (_, index) => createTicket(index === 0 ? input.name : undefined, index === 0, now))
  const reservation: Reservation = {
    ...input,
    name: input.name.trim(),
    email,
    id: existing?.id ?? crypto.randomUUID(),
    code: existing?.code ?? generateCode('R'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: waitlist ? 'waitlist' : 'confirmed',
    tickets: [...(existing?.tickets ?? []), ...newTickets],
    quantity: waitlist ? 1 : newTickets.length,
  }

  if (existingIndex >= 0) reservations[existingIndex] = reservation
  else reservations.push(reservation)
  saveReservations(reservations)
  return reservation
}

export async function addSpotToReservation(reservationId: string, availableSpots: number, holderName?: string): Promise<Reservation> {
  const reservations = getReservations()
  const index = reservations.findIndex((item) => item.id === reservationId)
  const current = reservations[index]
  if (!current || current.status !== 'confirmed') throw new Error('Esta reserva não pode receber novos ingressos.')
  const activeTickets = getActiveTickets(current)
  if (activeTickets.length >= MAX_TICKETS_PER_RESERVATION) throw new Error(`O limite é de ${MAX_TICKETS_PER_RESERVATION} ingressos por reserva.`)
  if (availableSpots < 1) throw new Error('Não existem novas vagas disponíveis.')
  const updatedTickets = [...current.tickets, createTicket(holderName, false)]
  const updated = { ...current, quantity: activeTickets.length + 1, tickets: updatedTickets, updatedAt: new Date().toISOString() }
  reservations[index] = updated
  saveReservations(reservations)
  return updated
}

export function cancelTicket(reservationId: string, ticketId: string): Reservation {
  const reservations = getReservations()
  const index = reservations.findIndex((item) => item.id === reservationId)
  const current = reservations[index]
  if (!current || current.status !== 'confirmed') throw new Error('Reserva ativa não encontrada.')
  const ticket = current.tickets.find((item) => item.id === ticketId)
  if (!ticket || ticket.status !== 'active') throw new Error('Ingresso ativo não encontrado.')
  if (ticket.isPrimary) throw new Error('O ingresso principal só pode ser cancelado com a reserva completa.')
  const now = new Date().toISOString()
  const tickets = current.tickets.map((item) => item.id === ticketId ? { ...item, status: 'cancelled' as const, cancelledAt: now } : item)
  const updated = { ...current, quantity: tickets.filter((item) => item.status === 'active').length, tickets, updatedAt: now }
  reservations[index] = updated
  saveReservations(reservations)
  return updated
}

export function cancelReservation(reservationId: string): Reservation {
  const reservations = getReservations()
  const index = reservations.findIndex((item) => item.id === reservationId)
  const current = reservations[index]
  if (!current) throw new Error('Reserva não encontrada.')
  if (current.status === 'cancelled') return current
  const now = new Date().toISOString()
  const tickets = current.tickets.map((ticket) => ticket.status === 'active' ? { ...ticket, status: 'cancelled' as const, cancelledAt: now } : ticket)
  const updated: Reservation = { ...current, quantity: 0, tickets, status: 'cancelled', cancelledAt: now, updatedAt: now }
  reservations[index] = updated
  saveReservations(reservations)
  return updated
}
