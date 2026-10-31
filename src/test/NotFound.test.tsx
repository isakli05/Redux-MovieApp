import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotFound from '../components/NotFound'

describe('NotFound', () => {
  it('renders a big 404 with Turkish copy', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
    expect(screen.getByText('404')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Sayfa bulunamadı' })).toBeInTheDocument()
    expect(
      screen.getByText(/taşınmış, kaldırılmış ya da hiç var olmamış/)
    ).toBeInTheDocument()
  })

  it('offers a primary button back home and a ghost link to Keşfet', () => {
    render(
      <MemoryRouter>
        <NotFound />
      </MemoryRouter>
    )
    const home = screen.getByRole('link', { name: 'Ana Sayfaya Dön' })
    expect(home).toHaveAttribute('href', '/')
    expect(home).toHaveClass('bg-accent', 'text-accent-ink')

    const discover = screen.getByRole('link', { name: 'Keşfet' })
    expect(discover).toHaveAttribute('href', '/kesfet')
  })
})
