import { Search, SlidersHorizontal, X } from 'lucide-react'
import type { EventCategory } from '../types/event'

export type CategoryFilter = 'Todos' | EventCategory

interface FiltersProps {
  query: string
  category: CategoryFilter
  onQueryChange: (value: string) => void
  onCategoryChange: (value: CategoryFilter) => void
  onClear: () => void
}

const categories: CategoryFilter[] = ['Todos', 'Música', 'Gastronomia', 'Cultura', 'Tecnologia']

export function Filters({ query, category, onQueryChange, onCategoryChange, onClear }: FiltersProps) {
  const hasFilters = query.length > 0 || category !== 'Todos'

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
    </section>
  )
}
