import { zodResolver } from '@hookform/resolvers/zod'
import { Calendar, Check, CheckCircle2, Copy, LoaderCircle, MapPin, Ticket, Users, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { formatDate, formatPrice } from '../lib/formatters'
import { reservationSchema, type ReservationFormData } from '../schemas/reservationSchema'
import { addSpotToReservation, createReservation, ExistingReservationError } from '../services/reservationsService'
import type { LocalEvent, Reservation } from '../types/event'

interface EventModalProps {
  event: LocalEvent
  onClose: () => void
  onReserved: () => void
}

export function EventModal({ event, onClose, onReserved }: EventModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [reservation, setReservation] = useState<Reservation | null>(null)
  const [serverError, setServerError] = useState('')
  const [copied, setCopied] = useState(false)
  const [existingReservation, setExistingReservation] = useState<Reservation | null>(null)
  const [spotFor, setSpotFor] = useState<'self' | 'guest'>('self')
  const [guestName, setGuestName] = useState('')
  const [isAddingSpot, setIsAddingSpot] = useState(false)
  const addingSpotLock = useRef(false)
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
      if (!soldOut && data.quantity > event.availableSpots) {
        setServerError(`Restam apenas ${event.availableSpots} vagas para este evento.`)
        return
      }
      const result = await createReservation({ ...data, eventId: event.id }, soldOut)
      setReservation(result)
      onReserved()
    } catch (error) {
      if (error instanceof ExistingReservationError) {
        setExistingReservation(error.reservation)
        return
      }
      setServerError(error instanceof Error ? error.message : 'Não foi possível concluir. Tente novamente.')
    }
  }

  const confirmAdditionalSpot = async () => {
    if (!existingReservation || addingSpotLock.current) return
    addingSpotLock.current = true
    setServerError('')
    setIsAddingSpot(true)
    try {
      const updated = await addSpotToReservation(existingReservation.id, event.availableSpots, spotFor === 'guest' ? guestName : undefined)
      setReservation(updated)
      setExistingReservation(null)
      onReserved()
    } catch (error) {
      setServerError(error instanceof Error ? error.message : 'Não foi possível adicionar a vaga.')
    } finally {
      addingSpotLock.current = false
      setIsAddingSpot(false)
    }
  }

  const copyReceipt = async () => {
    if (!reservation) return
    const receipt = `${event.title}\n${formatDate(event.startsAt)}\n${reservation.quantity} ingresso(s)\nReserva: ${reservation.code}`
    await navigator.clipboard.writeText(receipt)
    setCopied(true)
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
                <div className="receipt-summary"><span>{formatDate(event.startsAt)}</span><span>{reservation.quantity} {reservation.quantity === 1 ? 'vaga' : 'vagas'}</span></div>
                <span className="reservation-code">Reserva {reservation.code}</span>
                <button className="copy-button" type="button" onClick={copyReceipt}>{copied ? <Check size={17} /> : <Copy size={17} />} {copied ? 'Copiado' : 'Copiar comprovante'}</button>
                <button className="primary-button" type="button" onClick={onClose}>Voltar aos eventos</button>
              </div>
            ) : existingReservation ? (
              <div className="existing-reservation" role="status">
                <p className="eyebrow">Reserva encontrada</p>
                <h3>Você já participa deste evento</h3>
                {existingReservation.status === 'waitlist' ? (
                  <>
                    <p>Este e-mail já está na lista de interesse. Não é necessário registrar novamente.</p>
                    <button className="primary-button" type="button" onClick={onClose}>Entendi</button>
                  </>
                ) : existingReservation.quantity >= 4 ? (
                  <>
                    <p>Sua reserva já atingiu o limite de quatro vagas para este evento.</p>
                    <button className="primary-button" type="button" onClick={onClose}>Ver outros eventos</button>
                  </>
                ) : event.availableSpots < 1 ? (
                  <>
                    <p>Sua reserva continua confirmada, mas não existem novas vagas disponíveis.</p>
                    <button className="primary-button" type="button" onClick={onClose}>Entendi</button>
                  </>
                ) : (
                  <>
                    <p>Já existem <strong>{existingReservation.quantity} {existingReservation.quantity === 1 ? 'vaga' : 'vagas'}</strong> neste e-mail. Deseja adicionar mais uma?</p>
                    <div className="radio-group" aria-label="Para quem é a nova vaga?">
                      <label><input type="radio" name="spotFor" checked={spotFor === 'self'} onChange={() => setSpotFor('self')} /> Para mim</label>
                      <label><input type="radio" name="spotFor" checked={spotFor === 'guest'} onChange={() => setSpotFor('guest')} /> Para outra pessoa</label>
                    </div>
                    {spotFor === 'guest' && <label>Nome da pessoa <span>(opcional)</span><input value={guestName} maxLength={80} onChange={(event) => setGuestName(event.target.value)} autoComplete="off" /></label>}
                    <small>A reserva não é nominal. O nome serve somente para sua organização e a vaga pode ser compartilhada.</small>
                    {serverError && <div className="form-error" role="alert">{serverError}</div>}
                    <div className="form-actions">
                      <button className="secondary-button" type="button" onClick={() => setExistingReservation(null)}>Voltar</button>
                      <button className="primary-button" type="button" onClick={confirmAdditionalSpot} disabled={isAddingSpot}>{isAddingSpot ? 'Adicionando...' : 'Adicionar uma vaga'}</button>
                    </div>
                  </>
                )}
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
