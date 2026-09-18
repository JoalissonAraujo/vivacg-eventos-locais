const STORAGE_KEY = 'vivacg:favorites'

export function getFavorites(): string[] {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function toggleFavorite(eventId: string): string[] {
  const favorites = new Set(getFavorites())
  if (favorites.has(eventId)) favorites.delete(eventId)
  else favorites.add(eventId)
  const updated = [...favorites]
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  return updated
}
