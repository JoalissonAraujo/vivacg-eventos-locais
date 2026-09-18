import { Heart, Search, SlidersHorizontal, X } from 'lucide-react'
import type { EventCategory } from '../types/event'

export type CategoryFilter = 'Todos' | EventCategory
export type DateFilter = 'Todas' | '15dias' | 'Este mês' | 'Próximo mês'
export type AvailabilityFilter = 'Qualquer' | 'Com vagas' | 'Gratuitos' | 'Lista de interesse'

interface FiltersProps {
  query: string
  category: CategoryFilter
  date: DateFilter
  availability: AvailabilityFilter
  onlyFavorites: boolean
  onQueryChange: (value: string) => void
  onCategoryChange: (value: CategoryFilter) => void
  onDateChange: (value: DateFilter) => void
  onAvailabilityChange: (value: AvailabilityFilter) => void
  onOnlyFavoritesChange: (value: boolean) => void
  onClear: () => void
}

const categories: CategoryFilter[] = ['Todos', 'Música', 'Gastronomia', 'Cultura', 'Tecnologia']

export function Filters({ query, category, date, availability, onlyFavorites, onQueryChange, onCategoryChange, onDateChange, onAvailabilityChange, onOnlyFavoritesChange, onClear }: FiltersProps) {
  const hasFilters = query.length > 0 || category !== 'Todos' || date !== 'Todas' || availability !== 'Qualquer' || onlyFavorites

  return (
    <section className="filters" aria-labelledby="events-title">
      <label className="search-field">
        <span className="sr-only">Pesquisar eventos</span>
        <Search size={20} aria-hidden="true" />
        <input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Busque por evento ou local" />
      </label>
      <div className="category-filters" aria-label="Filtrar por categoria">
        <SlidersHorizontal size={19} aria-hidden="true" />
        {categories.map((item) => (
          <button
            type="button"
            key={item}
            className={category === item ? 'filter-chip active' : 'filter-chip'}
            aria-pressed={category === item}
            onClick={() => onCategoryChange(item)}
          >
            {item}
          </button>
        ))}
        {hasFilters && <button className="clear-button" type="button" onClick={onClear}><X size={16} /> Limpar</button>}
      </div>
      <div className="select-filters">
        <label><span>Data</span>
          <select value={date} onChange={(event) => onDateChange(event.target.value as DateFilter)}>
            <option>Todas</option><option value="15dias">Próximos 15 dias</option><option>Este mês</option><option>Próximo mês</option>
          </select>
        </label>
        <label><span>Disponibilidade</span>
          <select value={availability} onChange={(event) => onAvailabilityChange(event.target.value as AvailabilityFilter)}>
            <option>Qualquer</option><option>Com vagas</option><option>Gratuitos</option><option>Lista de interesse</option>
          </select>
        </label>
        <button className={onlyFavorites ? 'favorites-filter active' : 'favorites-filter'} type="button" aria-pressed={onlyFavorites} onClick={() => onOnlyFavoritesChange(!onlyFavorites)}><Heart size={17} fill={onlyFavorites ? 'currentColor' : 'none'} /> Somente favoritos</button>
      </div>
    </section>
  )
}
