import { Calendar, MapPin, TicketCheck, Trash2, UserRound, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { events } from '../data/events'
import { formatDate } from '../lib/formatters'
import { cancelReservation, getReservations, removeSpotFromReservation } from '../services/reservationsService'
import type { Reservation } from '../types/event'

type PendingAction =
  | { type: 'cancel'; reservation: Reservation }
  | { type: 'remove'; reservation: Reservation; guestId: string; guestName?: string }
  | null

interface Props {
  onClose: () => void
  onChanged: () => void
}

export function MyReservationsModal({ onClose, onChanged }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [reservations, setReservations] = useState(() => getReservations().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState('')

  useEffect(() => {
    dialogRef.current?.focus()
    const handleKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const refresh = () => {
    setReservations(getReservations().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
    setPendingAction(null)
    setActionError('')
    onChanged()
  }

  const confirmAction = () => {
    if (!pendingAction) return
    try {
      if (pendingAction.type === 'cancel') cancelReservation(pendingAction.reservation.id)
      else removeSpotFromReservation(pendingAction.reservation.id, pendingAction.guestId)
      refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível concluir a ação.')
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="reservations-modal" role="dialog" aria-modal="true" aria-labelledby="reservations-title" tabIndex={-1}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Fechar minhas reservas"><X /></button>
        <p className="eyebrow">Seu histórico neste dispositivo</p>
        <h2 id="reservations-title">Minhas reservas</h2>
        <p className="reservations-intro">Gerencie suas vagas sem perder o histórico das solicitações.</p>
        {reservations.length === 0 ? (
          <div className="mini-empty"><TicketCheck size={40} /><h3>Nenhuma reserva ainda</h3><p>Escolha um evento e confirme sua participação.</p></div>
        ) : (
          <div className="reservations-list">
            {reservations.map((reservation) => {
              const event = events.find((item) => item.id === reservation.eventId)
              if (!event) return null
              const statusLabel = reservation.status === 'cancelled' ? 'Cancelada' : reservation.status === 'waitlist' ? 'Lista de interesse' : 'Confirmada'
              return (
                <article key={reservation.id} className={`reservation-item ${reservation.status === 'cancelled' ? 'cancelled' : ''}`}>
                  <div className="reservation-item-heading"><span className={`status ${reservation.status}`}>{statusLabel}</span><code>{reservation.id.slice(0, 8).toUpperCase()}</code></div>
                  <h3>{event.title}</h3>
                  <p><Calendar size={16} /> {formatDate(event.startsAt)}</p>
                  <p><MapPin size={16} /> {event.venue}</p>
                  <div className="participants">
                    <div><UserRound size={15} /><span><strong>Responsável:</strong> {reservation.name}</span></div>
                    {reservation.guests.map((guest, index) => (
                      <div key={guest.id}><UserRound size={15} /><span><strong>Vaga {index + 2}:</strong> {guest.name || 'Convidado sem nome'}</span>{reservation.status === 'confirmed' && <button type="button" onClick={() => setPendingAction({ type: 'remove', reservation, guestId: guest.id, guestName: guest.name })} aria-label={`Remover vaga ${guest.name || index + 2}`}><Trash2 size={15} /></button>}</div>
                    ))}
                  </div>
                  <small>{reservation.quantity} {reservation.quantity === 1 ? 'vaga' : 'vagas'} · {reservation.email}</small>
                  {reservation.status !== 'cancelled' && <button className="danger-link" type="button" onClick={() => setPendingAction({ type: 'cancel', reservation })}>{reservation.status === 'waitlist' ? 'Sair da lista de interesse' : 'Cancelar reserva completa'}</button>}
                </article>
              )
            })}
          </div>
        )}
        {pendingAction && (
          <div className="confirmation-box" role="alertdialog" aria-labelledby="confirmation-title">
            <h3 id="confirmation-title">{pendingAction.type === 'cancel' ? (pendingAction.reservation.status === 'waitlist' ? 'Sair da lista?' : 'Cancelar reserva?') : 'Remover esta vaga?'}</h3>
            <p>{pendingAction.type === 'cancel' ? `A solicitação com ${pendingAction.reservation.quantity} ${pendingAction.reservation.quantity === 1 ? 'vaga' : 'vagas'} será cancelada e permanecerá no histórico.` : `A vaga de ${pendingAction.guestName || 'convidado sem nome'} voltará a ficar disponível.`}</p>
            {actionError && <div className="form-error">{actionError}</div>}
            <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setPendingAction(null)}>Manter</button><button className="danger-button" type="button" onClick={confirmAction}>Confirmar</button></div>
          </div>
        )}
        <button className="primary-button" type="button" onClick={onClose}>Continuar explorando</button>
      </div>
    </div>
  )
}
