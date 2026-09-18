import { z } from 'zod'

export const reservationSchema = z.object({
  name: z.string().trim().min(3, 'Informe seu nome completo.').max(80, 'Use no máximo 80 caracteres.'),
  email: z.string().trim().email('Informe um e-mail válido.').max(120, 'Use no máximo 120 caracteres.'),
  quantity: z.number().int().min(1, 'Escolha pelo menos uma vaga.').max(4, 'É possível reservar até 4 vagas.'),
})

export type ReservationFormData = z.infer<typeof reservationSchema>
