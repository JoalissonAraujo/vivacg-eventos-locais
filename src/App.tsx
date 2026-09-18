import { ArrowDown, CalendarCheck2, MapPinned, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { EmptyState } from './components/EmptyState'
import { EventCard } from './components/EventCard'
import { EventModal } from './components/EventModal'
import { Filters, type CategoryFilter } from './components/Filters'
import { Header } from './components/Header'
import { events } from './data/events'
import type { LocalEvent } from './types/event'

export default function App() {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('Todos')
  const [selectedEvent, setSelectedEvent] = useState<LocalEvent | null>(null)

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR')
    return events.filter((event) => {
      const matchesQuery = !normalizedQuery || `${event.title} ${event.venue}`.toLocaleLowerCase('pt-BR').includes(normalizedQuery)
      return matchesQuery && (category === 'Todos' || event.category === category)
    })
  }, [category, query])

  const clearFilters = () => {
    setQuery('')
    setCategory('Todos')
  }

  return (
    <>
      <Header />
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
              <div><CalendarCheck2 aria-hidden="true" /><strong>{events.length}</strong><span>eventos disponíveis</span></div>
              <div><MapPinned aria-hidden="true" /><strong>100%</strong><span>experiências locais</span></div>
            </div>
          </div>
        </section>

        <section id="eventos" className="events-section container">
          <div className="section-heading">
            <div><p className="eyebrow">Próximos encontros</p><h2 id="events-title">Escolha seu próximo rolê</h2></div>
            <p>De música a tecnologia: sempre há algo acontecendo por aqui.</p>
          </div>
          <Filters query={query} category={category} onQueryChange={setQuery} onCategoryChange={setCategory} onClear={clearFilters} />
          <p className="results-count" aria-live="polite">{filteredEvents.length} {filteredEvents.length === 1 ? 'evento encontrado' : 'eventos encontrados'}</p>
          {filteredEvents.length > 0 ? (
            <div className="events-grid">{filteredEvents.map((event) => <EventCard key={event.id} event={event} onSelect={setSelectedEvent} />)}</div>
          ) : <EmptyState onClear={clearFilters} />}
        </section>
      </main>
      <footer><div className="container"><strong>Viva<span>CG</span></strong><p>Conectando pessoas ao que acontece em Campina Grande.</p><small>Projeto demonstrativo · Dados fictícios</small></div></footer>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </>
  )
}
