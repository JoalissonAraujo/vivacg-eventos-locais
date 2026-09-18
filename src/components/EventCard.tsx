import { ArrowUpRight, Calendar, MapPin, Ticket } from 'lucide-react'
import { formatDate, formatPrice } from '../lib/formatters'
import type { LocalEvent } from '../types/event'

interface EventCardProps {
  event: LocalEvent
  onSelect: (event: LocalEvent) => void
}

export function EventCard({ event, onSelect }: EventCardProps) {
  const soldOut = event.availableSpots === 0

  return (
    <article className="event-card">
      <div className="event-image-wrap">
        <img className="event-image" src={event.imageUrl} alt="" loading="lazy" />
        <span className="category-badge">{event.category}</span>
        {soldOut && <span className="sold-out-badge">Lista de interesse</span>}
      </div>
      <div className="event-content">
        <div className="event-meta"><Calendar size={17} aria-hidden="true" /> {formatDate(event.startsAt)}</div>
        <h3>{event.title}</h3>
        <p>{event.summary}</p>
        <div className="event-meta"><MapPin size={17} aria-hidden="true" /> {event.venue}</div>
        <div className="event-footer">
          <span className="price"><Ticket size={17} aria-hidden="true" /> {formatPrice(event.price)}</span>
          <button className="text-button" type="button" onClick={() => onSelect(event)} aria-label={`Ver detalhes de ${event.title}`}>
            Ver detalhes <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
      </div>
    </article>
  )
}
