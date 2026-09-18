import { ArrowLeft, Calendar, Check, Copy, MapPin, TicketCheck, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { events } from '../data/events'
import { formatDate } from '../lib/formatters'
import { cancelReservation, cancelTicket, getActiveTickets, getReservations } from '../services/reservationsService'
import type { Reservation } from '../types/event'

type PendingAction =
  | { type: 'reservation'; reservation: Reservation }
  | { type: 'ticket'; reservation: Reservation; ticketId: string; holderName?: string }
  | null

interface Props { onClose: () => void; onChanged: () => void }

export function MyReservationsModal({ onClose, onChanged }: Props) {
  const dialogRef = useRef<HTMLDivElement>(null)
  const [reservations, setReservations] = useState(() => getReservations().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)))
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionError, setActionError] = useState('')
  const [copiedCode, setCopiedCode] = useState('')
  const selected = reservations.find((item) => item.id === selectedId) ?? null

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
      if (pendingAction.type === 'reservation') cancelReservation(pendingAction.reservation.id)
      else cancelTicket(pendingAction.reservation.id, pendingAction.ticketId)
      refresh()
    } catch (error) {
      setActionError(error instanceof Error ? error.message : 'Não foi possível concluir a ação.')
    }
  }

  const copyCode = async (code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedCode(code)
  }

  const statusLabel = (reservation: Reservation) => reservation.status === 'cancelled' ? 'Cancelada' : reservation.status === 'waitlist' ? 'Lista de interesse' : 'Confirmada'

  return (
    <div className="modal-backdrop" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div ref={dialogRef} className="reservations-modal" role="dialog" aria-modal="true" aria-labelledby="reservations-title" tabIndex={-1}>
        <button className="close-button" type="button" onClick={onClose} aria-label="Fechar minhas reservas"><X /></button>
        {selected ? (
          <ReservationDetails reservation={selected} copiedCode={copiedCode} onCopy={copyCode} onBack={() => { setSelectedId(null); setPendingAction(null) }} onCancelReservation={() => setPendingAction({ type: 'reservation', reservation: selected })} onCancelTicket={(ticketId, holderName) => setPendingAction({ type: 'ticket', reservation: selected, ticketId, holderName })} />
        ) : (
          <>
            <p className="eyebrow">Seu histórico neste dispositivo</p>
            <h2 id="reservations-title">Minhas reservas</h2>
            <p className="reservations-intro">Consulte os ingressos e gerencie suas solicitações.</p>
            {reservations.length === 0 ? <div className="mini-empty"><TicketCheck size={40} /><h3>Nenhuma reserva ainda</h3><p>Escolha um evento e confirme sua participação.</p></div> : (
              <div className="reservations-list">{reservations.map((reservation) => {
                const event = events.find((item) => item.id === reservation.eventId)
                if (!event) return null
                return <article key={reservation.id} className={`reservation-item ${reservation.status === 'cancelled' ? 'cancelled' : ''}`}>
                  <div className="reservation-item-heading"><span className={`status ${reservation.status}`}>{statusLabel(reservation)}</span><code>{reservation.code}</code></div>
                  <h3>{event.title}</h3><p><Calendar size={16} /> {formatDate(event.startsAt)}</p><p><MapPin size={16} /> {event.venue}</p>
                  <small>{reservation.status === 'waitlist' ? 'Aguardando disponibilidade' : `${getActiveTickets(reservation).length} de 4 ingressos ativos`} · {reservation.email}</small>
                  <button className="details-button" type="button" onClick={() => setSelectedId(reservation.id)}>Ver detalhes e ingressos</button>
                </article>
              })}</div>
            )}
          </>
        )}
        {pendingAction && <div className="confirmation-box" role="alertdialog" aria-labelledby="confirmation-title">
          <h3 id="confirmation-title">{pendingAction.type === 'ticket' ? 'Cancelar ingresso?' : pendingAction.reservation.status === 'waitlist' ? 'Sair da lista?' : 'Cancelar reserva completa?'}</h3>
          <p>{pendingAction.type === 'ticket' ? `O ingresso de ${pendingAction.holderName || 'convidado sem nome'} será invalidado e continuará no histórico.` : 'Todos os ingressos ativos serão cancelados e as vagas voltarão ao evento.'}</p>
          {actionError && <div className="form-error">{actionError}</div>}
          <div className="form-actions"><button className="secondary-button" type="button" onClick={() => setPendingAction(null)}>Manter</button><button className="danger-button" type="button" onClick={confirmAction}>Confirmar</button></div>
        </div>}
        {!selected && <button className="primary-button" type="button" onClick={onClose}>Continuar explorando</button>}
      </div>
    </div>
  )
}

interface DetailsProps {
  reservation: Reservation; copiedCode: string; onCopy: (code: string) => void; onBack: () => void
  onCancelReservation: () => void; onCancelTicket: (ticketId: string, holderName?: string) => void
}

function ReservationDetails({ reservation, copiedCode, onCopy, onBack, onCancelReservation, onCancelTicket }: DetailsProps) {
  const event = events.find((item) => item.id === reservation.eventId)
  if (!event) return null
  return <div className="reservation-details">
    <button className="back-button" type="button" onClick={onBack}><ArrowLeft size={17} /> Voltar às reservas</button>
    <p className="eyebrow">Detalhes da reserva</p><h2 id="reservations-title">{event.title}</h2>
    <p className="detail-line"><Calendar size={17} /> {formatDate(event.startsAt)}</p><p className="detail-line"><MapPin size={17} /> {event.venue}</p>
    <div className="group-code"><span>Código da reserva</span><strong>{reservation.code}</strong><button type="button" onClick={() => onCopy(reservation.code)}>{copiedCode === reservation.code ? <Check size={16} /> : <Copy size={16} />} {copiedCode === reservation.code ? 'Copiado' : 'Copiar'}</button></div>
    {reservation.status === 'waitlist' ? <p className="waitlist-note">Você está na lista de interesse. Ingressos serão gerados somente quando houver confirmação de vaga.</p> : <>
      <div className="tickets-heading"><h3>Ingressos</h3><span>{getActiveTickets(reservation).length} de 4 ativos</span></div>
      <div className="ticket-list">{reservation.tickets.map((ticket, index) => <article key={ticket.id} className={`ticket-item ${ticket.status}`}>
        <div><span>Ingresso {index + 1}{ticket.isPrimary ? ' · principal' : ''}</span><strong>{ticket.holderName || 'Convidado sem nome'}</strong></div>
        <code>{ticket.code}</code><button type="button" onClick={() => onCopy(ticket.code)}>{copiedCode === ticket.code ? <Check size={15} /> : <Copy size={15} />} {copiedCode === ticket.code ? 'Copiado' : 'Copiar código'}</button>
        {ticket.status === 'cancelled' ? <span className="ticket-cancelled">Cancelado</span> : !ticket.isPrimary && reservation.status === 'confirmed' && <button className="danger-link" type="button" onClick={() => onCancelTicket(ticket.id, ticket.holderName)}>Cancelar este ingresso</button>}
      </article>)}</div>
    </>}
    {reservation.status !== 'cancelled' && <button className="danger-link cancel-reservation" type="button" onClick={onCancelReservation}>{reservation.status === 'waitlist' ? 'Sair da lista de interesse' : 'Cancelar reserva completa'}</button>}
  </div>
}
