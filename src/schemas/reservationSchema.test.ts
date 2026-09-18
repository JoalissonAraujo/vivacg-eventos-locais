import { describe, expect, it } from 'vitest'
import { reservationSchema } from './reservationSchema'

describe('reservationSchema', () => {
  it('aceita uma reserva válida', () => {
    const result = reservationSchema.safeParse({
      name: 'Maria da Silva',
      email: 'maria@example.com',
      quantity: 2,
    })

    expect(result.success).toBe(true)
  })

  it('recusa e-mail inválido e quantidade acima do limite', () => {
    const result = reservationSchema.safeParse({
      name: 'Maria da Silva',
      email: 'email-invalido',
      quantity: 5,
    })

    expect(result.success).toBe(false)
  })
})
