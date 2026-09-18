import { beforeEach, describe, expect, it, vi } from 'vitest'
import { getFavorites, toggleFavorite } from './favoritesService'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

describe('favoritesService', () => {
  beforeEach(() => vi.stubGlobal('localStorage', new MemoryStorage()))

  it('adiciona e remove um evento dos favoritos', () => {
    expect(toggleFavorite('evento-1')).toEqual(['evento-1'])
    expect(getFavorites()).toEqual(['evento-1'])
    expect(toggleFavorite('evento-1')).toEqual([])
  })

  it('se recupera de dados locais inválidos', () => {
    localStorage.setItem('vivacg:favorites', '{inválido')
    expect(getFavorites()).toEqual([])
  })
})
