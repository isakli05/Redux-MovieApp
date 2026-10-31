/**
 * Person404 — bilinmeyen /person/* yolları için Türkçe 404 sayfası.
 */

import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Person404 from '@pages/Persons/Person404'

function renderPerson404() {
  return render(
    <MemoryRouter initialEntries={['/person/olmayan-kisi']}>
      <Routes>
        <Route path="/person/*" element={<Person404 />} />
        <Route path="/person" element={<div>Popüler Kişiler</div>} />
        <Route path="/" element={<div>Ana Sayfa</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Person404', () => {
  it('Türkçe 404 mesajı gösterir', () => {
    renderPerson404()

    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByText('Kişi bulunamadı')).toBeInTheDocument()
    expect(screen.getByText(/taşınmış ya da hiç var olmamış olabilir/i)).toBeInTheDocument()
  })

  it('kit düğmeleriyle Popüler Kişiler ve Ana Sayfa çıkışları verir', () => {
    renderPerson404()

    expect(screen.getByRole('link', { name: 'Popüler Kişiler' })).toHaveAttribute('href', '/person')
    expect(screen.getByRole('link', { name: 'Ana Sayfa' })).toHaveAttribute('href', '/')
  })

  it('sayfa başlığını SEO için ayarlar', () => {
    renderPerson404()
    expect(document.title).toBe('Kişi Bulunamadı · LMDB')
  })
})
