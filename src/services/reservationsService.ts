import type { Reservation, ReservationInput } from '../types/event'

const STORAGE_KEY = 'vivacg:reservations'

function getReservations(): Reservation[] {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) return []

  try {
    return JSON.parse(saved) as Reservation[]
  } catch {
    return []
  }
}

export async function createReservation(input: ReservationInput): Promise<Reservation> {
  await new Promise((resolve) => setTimeout(resolve, 650))
  const reservations = getReservations()
  const duplicated = reservations.some(
    (reservation) => reservation.eventId === input.eventId && reservation.email.toLowerCase() === input.email.toLowerCase(),
  )

  if (duplicated) {
    throw new Error('Já existe uma reserva neste evento para o e-mail informado.')
  }

  const reservation: Reservation = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify([...reservations, reservation]))
  return reservation
}
