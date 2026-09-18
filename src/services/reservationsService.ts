import type { Reservation, ReservationGuest, ReservationInput } from '../types/event'

const STORAGE_KEY = 'vivacg:reservations'
const MAX_SPOTS = 4

export class ExistingReservationError extends Error {
  constructor(public reservation: Reservation) {
    super('Já existe uma reserva ativa neste evento para o e-mail informado.')
    this.name = 'ExistingReservationError'
  }
}

function saveReservations(reservations: Reservation[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reservations))
}

function normalizeReservation(reservation: Reservation): Reservation {
  return {
    ...reservation,
    email: reservation.email.trim().toLowerCase(),
    status: reservation.status ?? 'confirmed',
    guests: Array.isArray(reservation.guests)
      ? reservation.guests
      : Array.from({ length: Math.max(0, reservation.quantity - 1) }, () => ({ id: crypto.randomUUID() })),
    updatedAt: reservation.updatedAt ?? reservation.createdAt,
  }
}

export function getReservations(): Reservation[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []
  try {
    const parsed = JSON.parse(saved)
    if (!Array.isArray(parsed)) return []
    const normalized = parsed.map(normalizeReservation)
    const needsMigration = parsed.some((reservation) =>
      !Array.isArray(reservation.guests)
      || !reservation.updatedAt
      || reservation.email !== reservation.email.trim().toLowerCase(),
    )
    if (needsMigration) saveReservations(normalized)
    return normalized
  } catch {
    return []
  }
}

export function getReservedSpots(eventId: string): number {
  return getReservations()
    .filter((reservation) => reservation.eventId === eventId && reservation.status === 'confirmed')
    .reduce((total, reservation) => total + reservation.quantity, 0)
}

function validateInput(input: ReservationInput) {
  if (input.name.trim().length < 3 || input.name.trim().length > 80) throw new Error('Nome inválido.')
  if (!/^\S+@\S+\.\S+$/.test(input.email) || input.email.length > 120) throw new Error('E-mail inválido.')
  if (!Number.isInteger(input.quantity) || input.quantity < 1 || input.quantity > MAX_SPOTS) throw new Error('Quantidade de vagas inválida.')
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
  const reservation: Reservation = {
    ...input,
    name: input.name.trim(),
    email,
    id: existing?.id ?? crypto.randomUUID(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: waitlist ? 'waitlist' : 'confirmed',
    guests: Array.from({ length: Math.max(0, input.quantity - 1) }, () => ({ id: crypto.randomUUID() })),
  }

  if (existingIndex >= 0) reservations[existingIndex] = reservation
  else reservations.push(reservation)
  saveReservations(reservations)
  return reservation
}

export async function addSpotToReservation(reservationId: string, availableSpots: number, guestName?: string): Promise<Reservation> {
  const reservations = getReservations()
  const index = reservations.findIndex((item) => item.id === reservationId)
  const current = reservations[index]
  if (!current || current.status !== 'confirmed') throw new Error('Esta reserva não pode receber novas vagas.')
  if (current.quantity >= MAX_SPOTS) throw new Error(`O limite é de ${MAX_SPOTS} vagas por reserva.`)
  if (availableSpots < 1) throw new Error('Não existem novas vagas disponíveis.')

  const guest: ReservationGuest = { id: crypto.randomUUID() }
  const safeName = guestName?.trim()
  if (safeName) guest.name = safeName.slice(0, 80)
  const updated = { ...current, quantity: current.quantity + 1, guests: [...current.guests, guest], updatedAt: new Date().toISOString() }
  reservations[index] = updated
  saveReservations(reservations)
  return updated
}

export function removeSpotFromReservation(reservationId: string, guestId: string): Reservation {
  const reservations = getReservations()
  const index = reservations.findIndex((item) => item.id === reservationId)
  const current = reservations[index]
  if (!current || current.status !== 'confirmed' || current.quantity <= 1) throw new Error('Não é possível remover esta vaga.')
  if (!current.guests.some((guest) => guest.id === guestId)) throw new Error('Vaga adicional não encontrada.')
  const updated = { ...current, quantity: current.quantity - 1, guests: current.guests.filter((guest) => guest.id !== guestId), updatedAt: new Date().toISOString() }
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
  const updated: Reservation = { ...current, status: 'cancelled', cancelledAt: now, updatedAt: now }
  reservations[index] = updated
  saveReservations(reservations)
  return updated
}
