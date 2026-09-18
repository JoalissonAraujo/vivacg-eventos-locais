import { beforeEach, describe, expect, it, vi } from 'vitest'
import { addSpotToReservation, cancelReservation, createReservation, getReservations, getReservedSpots, removeSpotFromReservation } from './reservationsService'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
  clear() { this.values.clear() }
}

describe('reservationsService', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', new MemoryStorage())
    vi.stubGlobal('crypto', { randomUUID: () => '12345678-1234-1234-1234-123456789abc' })
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

  it('adiciona e remove uma vaga mantendo uma única reserva', async () => {
    const reservation = await createReservation({ eventId: 'evento-4', name: 'Lia da Silva', email: 'lia@example.com', quantity: 1 })
    const expanded = await addSpotToReservation(reservation.id, 3, 'Convidado')
    expect(expanded.quantity).toBe(2)
    expect(expanded.guests[0].name).toBe('Convidado')

    const reduced = removeSpotFromReservation(reservation.id, expanded.guests[0].id)
    expect(reduced.quantity).toBe(1)
    expect(reduced.guests).toHaveLength(0)
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

  it('migra reservas antigas e persiste os identificadores dos convidados', () => {
    localStorage.setItem('vivacg:reservations', JSON.stringify([{
      id: 'antiga', eventId: 'evento-7', name: 'Sol da Silva', email: 'SOL@example.com', quantity: 2,
      status: 'confirmed', createdAt: '2026-09-18T10:00:00.000Z',
    }]))

    const firstRead = getReservations()[0]
    const secondRead = getReservations()[0]
    expect(firstRead.email).toBe('sol@example.com')
    expect(firstRead.guests).toHaveLength(1)
    expect(secondRead.guests[0].id).toBe(firstRead.guests[0].id)
  })
})
