import { CalendarDays, MapPin } from 'lucide-react'

export function Header() {
  return (
    <header className="site-header">
      <div className="container header-content">
        <a className="brand" href="#inicio" aria-label="VivaCG, página inicial">
          <span className="brand-mark" aria-hidden="true"><CalendarDays size={22} /></span>
          <span>Viva<span>CG</span></span>
        </a>
        <div className="location"><MapPin size={17} aria-hidden="true" /> Campina Grande, PB</div>
      </div>
    </header>
  )
}
