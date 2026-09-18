export type EventCategory = 'Música' | 'Gastronomia' | 'Cultura' | 'Tecnologia'

export interface LocalEvent {
  id: string
  title: string
  summary: string
  description: string
  category: EventCategory
  startsAt: string
  venue: string
  address: string
  price: number
  capacity: number
  availableSpots: number
  imageUrl: string
  featured?: boolean
}

export interface ReservationInput {
  eventId: string
  name: string
  email: string
  quantity: number
}

export interface Reservation extends ReservationInput {
  id: string
  createdAt: string
}
