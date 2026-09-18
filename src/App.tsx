import { ArrowDown, CalendarCheck2, MapPinned, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { EventCard } from './components/EventCard'
import { EventModal } from './components/EventModal'
import { Filters, type AvailabilityFilter, type CategoryFilter, type DateFilter } from './components/Filters'
import { Header } from './components/Header'
import { MyReservationsModal } from './components/MyReservationsModal'
import { events } from './data/events'
import { getFavorites, toggleFavorite } from './services/favoritesService'
import { getReservations, getReservedSpots } from './services/reservationsService'
import type { LocalEvent } from './types/event'

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Todos')
  const [date, setDate] = useState<DateFilter>('Todas')
  const [availability, setAvailability] = useState<AvailabilityFilter>('Qualquer')
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null)
  const [showReservations, setShowReservations] = useState(false)
  const [reservationRevision, setReservationRevision] = useState(0)
  const [favorites, setFavorites] = useState(() => getFavorites())
  const [onlyFavorites, setOnlyFavorites] = useState(false)

  const eventsWithAvailability = useMemo(() => {
    // A revisão muda sempre que uma reserva é criada e força o recálculo das vagas locais.
    void reservationRevision
    return events.map((event) => ({
      ...event,
      availableSpots: Math.max(0, event.availableSpots - getReservedSpots(event.id)),
    }))
  }, [reservationRevision])

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const inFifteenDays = new Date(today)
    inFifteenDays.setDate(today.getDate() + 15)

    return eventsWithAvailability.filter((event) => {
      const eventDate = new Date(event.startsAt)
      const matchesQuery = !normalizedQuery || `${event.title} ${event.venue}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      const matchesCategory = category === 'Todos' || event.category === category
      const matchesDate = date === 'Todas'
        || (date === '15dias' && eventDate >= today && eventDate <= inFifteenDays)
        || (date === 'Este mês' && eventDate.getMonth() === today.getMonth() && eventDate.getFullYear() === today.getFullYear())
        || (date === 'Próximo mês' && eventDate.getMonth() === (today.getMonth() + 1) % 12 && eventDate.getFullYear() === today.getFullYear() + (today.getMonth() === 11 ? 1 : 0))
      const matchesAvailability = availability === 'Qualquer'
        || (availability === 'Com vagas' && event.availableSpots > 0)
        || (availability === 'Gratuitos' && event.price === 0)
        || (availability === 'Lista de interesse' && event.availableSpots === 0)
      const matchesFavorite = !onlyFavorites || favorites.includes(event.id)
      return matchesQuery && matchesCategory && matchesDate && matchesAvailability && matchesFavorite
    })
  }, [availability, category, date, eventsWithAvailability, favorites, onlyFavorites, query])

  const clearFilters = () => {
    setQuery('')
    setCategory('Todos')
    setDate('Todas')
    setAvailability('Qualquer')
    setOnlyFavorites(false)
  }

  return (
    <>
      <Header reservationCount={getReservations().length} onOpenReservations={() => setShowReservations(true)} />
      <main id="inicio">
        <section className="hero">
          <div className="container hero-content">
            <div>
              <span className="hero-pill"><Sparkles size={16} /> O melhor da cidade, perto de você</span>
              <h1>Viva mais.<br /><span>Descubra Campina.</span></h1>
              <p>Encontre experiências, conheça pessoas e reserve seu lugar nos eventos que movimentam nossa cidade.</p>
              <a className="primary-button hero-button" href="#eventos">Explorar eventos <ArrowDown size={18} /></a>
            </div>
            <div className="hero-stats" aria-label="Resumo da plataforma">
              <div><CalendarCheck2 aria-hidden="true" /><strong>{eventsWithAvailability.length}</strong><span>eventos disponíveis</span></div>
              <div><MapPinned aria-hidden="true" /><strong>100%</strong><span>experiências locais</span></div>
            </div>
          </div>
        </section>

        <section id="eventos" className="events-section container">
          <div className="section-heading">
            <div><p className="eyebrow">Próximos encontros</p><h2 id="events-title">Escolha seu próximo rolê</h2></div>
            <p>De música a tecnologia: sempre há algo acontecendo por aqui.</p>
          </div>
          <Filters query={query} category={category} date={date} availability={availability} onlyFavorites={onlyFavorites} onQueryChange={setQuery} onCategoryChange={setCategory} onDateChange={setDate} onAvailabilityChange={setAvailability} onOnlyFavoritesChange={setOnlyFavorites} onClear={clearFilters} />
          <p className="results-count" aria-live="polite">{filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}</p>
          {filteredEvents.length > 0 ? (
            <div className="events-grid">{filteredEvents.map((event) => <EventCard key={event.id} event={event} onSelect={setSelectedEvent} isFavorite={favorites.includes(event.id)} onToggleFavorite={(eventId) => setFavorites(toggleFavorite(eventId))} />)}</div>
          ) : <EmptyState onClear={clearFilters} />}
        </section>
      </main>
      <footer><div className="container"><strong>Viva<span>CG</span></strong><p>Conectando pessoas ao que acontece em Campina Grande.</p><small>Projeto demonstrativo · Dados fictícios</small></div></footer>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} onReserved={() => setReservationRevision((value) => value + 1)} />}
      {showReservations && <MyReservationsModal onClose={() => setShowReservations(false)} onChanged={() => setReservationRevision((value) => value + 1)} />}
    </>
  )
}
