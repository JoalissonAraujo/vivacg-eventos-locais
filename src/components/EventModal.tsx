import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, CheckCircle2, LoaderCircle, MapPin, Ticket, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { formatDate, formatPrice } from '../lib/formatters'
import { reservationSchema, type ReservationFormData } from '../schemas/reservationSchema'
import { createReservation } from '../services/reservationsService'
import type { LocalEvent, Reservation } from '../types/event'

interface EventModalProps {
  event: LocalEvent
  onClose: () => void
}

export function EventModal({ event, onClose }: EventModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [serverError, setServerError] = useState('')
  const soldOut = event.availableSpots === 0
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ReservationFormData>({
    resolver: zodResolver(reservationSchema),
    defaultValues: { quantity: 1 },
  })

  useEffect(() => {
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    dialogRef.current?.focus()
    const handleKey = (keyboardEvent: KeyboardEvent) => keyboardEvent.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKey)
    }
  }, [onClose])

  const onSubmit = async (data: ReservationFormData) => {
    setServerError('')
    try {
      const result = await createReservation({ ...data, eventId: event.id })
      setReservation(result)
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(mouseEvent) => mouseEvent.target === mouseEvent.currentTarget && onClose()}>
      <div ref={dialogRef} className="event-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabIndex={-1}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Fechar detalhes"><X /></button>
        <div className="modal-image-wrap">
          <img src={event.imageUrl} alt="" />
          <span className="category-badge">{event.category}</span>
        </div>
        <div className="modal-body">
          <div className="modal-details">
            <p className="eyebrow">Evento local</p>
            <h2 id="modal-title">{event.title}</h2>
            <p className="event-description">{event.description}</p>
            <dl className="details-list">
              <div><dt><Calendar aria-hidden="true" /></dt><dd><strong>Data e horário</strong>{formatDate(event.startsAt)}</dd></div>
              <div><dt><MapPin aria-hidden="true" /></dt><dd><strong>Local</strong>{event.venue}<small>{event.address}</small></dd></div>
              <div><dt><Ticket aria-hidden="true" /></dt><dd><strong>Entrada</strong>{formatPrice(event.price)}</dd></div>
              <div><dt><Users aria-hidden="true" /></dt><dd><strong>Disponibilidade</strong>{soldOut ? 'Vagas encerradas' : `${event.availableSpots} vagas restantes`}</dd></div>
            </dl>
          </div>

          <div className="reservation-panel">
            {reservation ? (
              <div className="success-state" role="status">
                <CheckCircle2 size={48} aria-hidden="true" />
                <p className="eyebrow">Tudo certo!</p>
                <h3>{soldOut ? 'Interesse registrado' : 'Reserva confirmada'}</h3>
                <p>Enviamos os detalhes para <strong>{reservation.email}</strong>.</p>
                <span className="reservation-code">Código {reservation.id.slice(0, 8).toUpperCase()}</span>
                <button className="primary-button" type="button" onClick={onClose}>Voltar aos eventos</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} noValidate>
                <h3>{soldOut ? 'Entrar na lista de interesse' : 'Reserve sua vaga'}</h3>
                <p>{soldOut ? 'Avise-nos que você tem interesse caso novas vagas apareçam.' : 'Preencha os dados abaixo. Leva menos de um minuto.'}</p>
                <label>Nome completo<input {...register('name')} autoComplete="name" aria-invalid={!!errors.name} /></label>
                {errors.name && <span className="field-error">{errors.name.message}</span>}
                <label>E-mail<input {...register('email')} type="email" autoComplete="email" aria-invalid={!!errors.email} /></label>
                {errors.email && <span className="field-error">{errors.email.message}</span>}
                <label>Quantidade de vagas
                  <select {...register('quantity', { valueAsNumber: true })} disabled={soldOut}>
                    {[1, 2, 3, 4].map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                  </select>
                </label>
                {serverError && <div className="form-error" role="alert">{serverError}</div>}
                <button className="primary-button" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? <><LoaderCircle className="spinner" size={19} /> Confirmando...</> : soldOut ? 'Registrar interesse' : 'Confirmar reserva'}
                </button>
                <small>Seus dados serão usados somente para esta solicitação.</small>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
