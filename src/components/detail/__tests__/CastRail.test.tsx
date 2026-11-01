import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CastRail } from '../CastRail'
import type { CastCardModel } from '../detail.types'

const cast: CastCardModel[] = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `Oyuncu ${i + 1}`,
  character: `Karakter ${i + 1}`,
  profilePath: null
}))

function renderRail() {
  return render(
    <MemoryRouter>
      <CastRail cast={cast} detailPath="/movie/550" />
    </MemoryRouter>
  )
}

describe('CastRail', () => {
  it('görünür "Tümünü Gör" başlık bağlantısı tam kadro sayfasına gider', () => {
    renderRail()
    const links = screen.getAllByRole('link', { name: /tümünü gör/i })
    expect(links.length).toBeGreaterThanOrEqual(2) // başlık + ray sonu kartı
    expect(links[0]).toHaveAttribute('href', '/movie/550/cast')
  })

  it('kadro sayısını gösterir ve kaydırma oklarını içerir', () => {
    renderRail()
    expect(screen.getAllByText('12').length).toBeGreaterThan(0)
    expect(screen.getByRole('button', { name: 'Önceki' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sonraki' })).toBeInTheDocument()
  })

  it('kişi kartları /person/:id bağlantısı verir', () => {
    renderRail()
    expect(screen.getByRole('link', { name: 'Oyuncu 1 Karakter 1' })).toHaveAttribute('href', '/person/1')
  })
})
