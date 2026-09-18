import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addSpotToReservation, cancelReservation, cancelTicket, createReservation, getActiveTickets, getReservations, getReservedSpots } from './reservationsService'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  clear() { this.values.clear() }
}

describe('reservationsService', () => {
  beforeEach(() => {
    let sequence = 0
    vi.stubGlobal('localStorage', new MemoryStorage())
    vi.stubGlobal('crypto', { randomUUID: () => `${String(sequence++).padStart(8, '0')}-1234-1234-1234-123456789abc` })
  })

  it('salva a reserva e contabiliza as vagas confirmadas', async () => {
    await createReservation({ eventId: 'evento-1', name: 'Maria da Silva', email: 'maria@example.com', quantity: 2 })

    expect(getReservations()).toHaveLength(1)
    expect(getReservedSpots('evento-1')).toBe(2)
  })

  it('não desconta vagas de registros na lista de interesse', async () => {
    await createReservation({ eventId: 'evento-2', name: 'João da Silva', email: 'joao@example.com', quantity: 1 }, true)

    expect(getReservedSpots('evento-2')).toBe(0)
    expect(getReservations()[0].status).toBe('waitlist')
  })

  it('impede o mesmo e-mail de reservar duas vezes o mesmo evento', async () => {
    const input = { eventId: 'evento-3', name: 'Ana da Silva', email: 'ana@example.com', quantity: 1 }
    await createReservation(input)

    await expect(createReservation(input)).rejects.toThrow('Já existe uma reserva')
  })

  it('adiciona e cancela um ingresso mantendo uma única reserva', async () => {
    const reservation = await createReservation({ eventId: 'evento-4', name: 'Lia da Silva', email: 'lia@example.com', quantity: 1 })
    const expanded = await addSpotToReservation(reservation.id, 3, 'Convidado')
    expect(expanded.quantity).toBe(2)
    const guestTicket = expanded.tickets.find((ticket) => !ticket.isPrimary && ticket.status === 'active')!
    expect(guestTicket.holderName).toBe('Convidado')
    expect(guestTicket.code).toMatch(/^VCG-I-/)

    const reduced = cancelTicket(reservation.id, guestTicket.id)
    expect(reduced.quantity).toBe(1)
    expect(reduced.tickets.find((ticket) => ticket.id === guestTicket.id)?.status).toBe('cancelled')
  })

  it('cancela sem apagar o histórico e devolve as vagas', async () => {
    const reservation = await createReservation({ eventId: 'evento-5', name: 'Bia da Silva', email: 'bia@example.com', quantity: 2 })
    const cancelled = cancelReservation(reservation.id)

    expect(cancelled.status).toBe('cancelled')
    expect(cancelled.cancelledAt).toBeDefined()
    expect(getReservations()).toHaveLength(1)
    expect(getReservedSpots('evento-5')).toBe(0)
  })

  it('reativa o mesmo registro após um cancelamento', async () => {
    const first = await createReservation({ eventId: 'evento-6', name: 'Eva da Silva', email: 'EVA@example.com', quantity: 1 })
    cancelReservation(first.id)
    const reactivated = await createReservation({ eventId: 'evento-6', name: 'Eva da Silva', email: 'eva@example.com', quantity: 1 })

    expect(reactivated.id).toBe(first.id)
    expect(reactivated.status).toBe('confirmed')
    expect(getReservations()).toHaveLength(1)
  })

  it('migra reservas antigas e persiste códigos individuais', () => {
    localStorage.setItem('vivacg:reservations', JSON.stringify([{
      id: 'antiga', eventId: 'evento-7', name: 'Sol da Silva', email: 'SOL@example.com', quantity: 2,
      status: 'confirmed', createdAt: '2026-09-18T10:00:00.000Z',
    }]))

    const firstRead = getReservations()[0]
    const secondRead = getReservations()[0]
    expect(firstRead.email).toBe('sol@example.com')
    expect(firstRead.code).toMatch(/^VCG-R-/)
    expect(firstRead.tickets).toHaveLength(2)
    expect(getActiveTickets(firstRead)).toHaveLength(2)
    expect(secondRead.tickets[0].code).toBe(firstRead.tickets[0].code)
  })

  it('não permite cancelar individualmente o ingresso principal', async () => {
    const reservation = await createReservation({ eventId: 'evento-8', name: 'Ivo da Silva', email: 'ivo@example.com', quantity: 1 })
    const primary = reservation.tickets.find((ticket) => ticket.isPrimary)!
    expect(() => cancelTicket(reservation.id, primary.id)).toThrow('ingresso principal')
  })

  it('gera códigos diferentes para a reserva e cada ingresso', async () => {
    const reservation = await createReservation({ eventId: 'evento-9', name: 'Nina da Silva', email: 'nina@example.com', quantity: 3 })
    const codes = [reservation.code, ...reservation.tickets.map((ticket) => ticket.code)]
    expect(new Set(codes).size).toBe(4)
  })
})
