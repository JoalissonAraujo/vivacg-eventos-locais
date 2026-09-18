import { CalendarX2 } from 'lucide-react'

export function EmptyState({ onClear }: { onClear: () => void }) {
  return (
    <div className="empty-state" role="status">
      <CalendarX2 size={40} aria-hidden="true" />
      <h3>Nenhum evento encontrado</h3>
      <p>Tente mudar a busca ou remover os filtros aplicados.</p>
      <button className="secondary-button" type="button" onClick={onClear}>Limpar filtros</button>
    </div>
  )
}
