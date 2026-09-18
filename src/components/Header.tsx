import { CalendarDays, MapPin, TicketCheck } from 'lucide-react'

export function Header({ reservationCount, onOpenReservations }: { reservationCount: number; onOpenReservations: () => void }) {
  return (
    <header className="site-header">
      <div className="container header-content">
        <a className="brand" href="#inicio" aria-label="VivaCG, página inicial">
          <span className="brand-mark" aria-hidden="true"><CalendarDays size={22} /></span>
          <span>Viva<span>CG</span></span>
        </a>
        <div className="header-actions">
          <div className="location"><MapPin size={17} aria-hidden="true" /> Campina Grande, PB</div>
          <button className="reservations-button" type="button" onClick={onOpenReservations}>
            <TicketCheck size={18} aria-hidden="true" /> Minhas reservas
            {reservationCount > 0 && <span aria-label={`${reservationCount} reservas`}>{reservationCount}</span>}
          </button>
        </div>
      </div>
    </header>
  )
}
