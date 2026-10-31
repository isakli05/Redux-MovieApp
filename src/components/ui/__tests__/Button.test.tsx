import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { Button } from '../Button'

describe('Button', () => {
  it('renders the primary variant by default', () => {
    render(<Button>Detaylar</Button>)
    const button = screen.getByRole('button', { name: 'Detaylar' })
    expect(button).toHaveClass('bg-accent', 'text-accent-ink')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('renders ghost and outline variants', () => {
    const { rerender } = render(<Button variant="ghost">Vazgeç</Button>)
    expect(screen.getByRole('button', { name: 'Vazgeç' })).toHaveClass('text-secondary')

    rerender(<Button variant="outline">Fragman</Button>)
    expect(screen.getByRole('button', { name: 'Fragman' })).toHaveClass('border-line-strong')
  })

  it('renders sizes', () => {
    const { rerender } = render(<Button size="sm">Küçük</Button>)
    expect(screen.getByRole('button', { name: 'Küçük' })).toHaveClass('h-8')

    rerender(<Button size="lg">Büyük</Button>)
    expect(screen.getByRole('button', { name: 'Büyük' })).toHaveClass('h-12')
  })

  it('shows a spinner and disables interaction while loading', () => {
    render(<Button loading>Kaydet</Button>)
    const button = screen.getByRole('button', { name: 'Kaydet' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelector('svg[data-testid="button-spinner"]')).toBeInTheDocument()
  })

  it('respects an explicit disabled state', () => {
    render(<Button disabled>Kapalı</Button>)
    expect(screen.getByRole('button', { name: 'Kapalı' })).toBeDisabled()
  })

  it('fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<Button onClick={onClick}>Tıkla</Button>)
    await user.click(screen.getByRole('button', { name: 'Tıkla' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a router link when to is provided', () => {
    render(
      <MemoryRouter>
        <Button to="/movies">Filmler</Button>
      </MemoryRouter>
    )
    const link = screen.getByRole('link', { name: 'Filmler' })
    expect(link).toHaveAttribute('href', '/movies')
    expect(link).toHaveClass('bg-accent')
  })
})
