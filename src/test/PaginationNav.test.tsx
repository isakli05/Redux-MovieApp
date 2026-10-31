/**
 * PaginationNav — pencereleme algoritması + etkileşim testleri (defect K).
 */

import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { PaginationNav, pageWindow } from '@components/Discover/PaginationNav';

describe('pageWindow', () => {
  it('tek sayfada boş pencere', () => {
    expect(pageWindow(1, 1)).toEqual([1])
  })

  it('kısa aralıklarda ellipsis olmadan tüm sayfaları verir', () => {
    expect(pageWindow(2, 4)).toEqual([1, 2, 3, 4])
  })

  it('uzun aralıklarda uçlar + aktif çevresi pencere ve ellipsis', () => {
    expect(pageWindow(5, 42)).toEqual([1, '…', 4, 5, 6, '…', 42])
    expect(pageWindow(1, 42)).toEqual([1, 2, '…', 42])
    expect(pageWindow(42, 42)).toEqual([1, '…', 41, 42])
  })

  it('sınırdaki aktif sayfayı kırpar', () => {
    expect(pageWindow(99, 10)).toEqual([1, '…', 9, 10])
  })
})

describe('PaginationNav', () => {
  it('totalPages <= 1 iken hiçbir şey çizmez', () => {
    const { container } = render(<PaginationNav page={1} totalPages={1} onPageChange={() => {}} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('önceki/sonraki düğmeleri ve sayfa numaralarını render eder', () => {
    render(<PaginationNav page={5} totalPages={42} onPageChange={() => {}} />)
    expect(screen.getByRole('navigation', { name: 'Sayfalama' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Önceki sayfa' })).toBeEnabled()
    expect(screen.getByRole('button', { name: 'Sonraki sayfa' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '5' })).toHaveAttribute('aria-current', 'page')
  })

  it('ilk sayfada önceki, son sayfada sonraki devre dışı', () => {
    const { rerender } = render(<PaginationNav page={1} totalPages={9} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Önceki sayfa' })).toBeDisabled()
    rerender(<PaginationNav page={9} totalPages={9} onPageChange={() => {}} />)
    expect(screen.getByRole('button', { name: 'Sonraki sayfa' })).toBeDisabled()
  })

  it('sayfa düğmesi ve sonraki düğmesi doğru sayfayı bildirir', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    render(
      <MemoryRouter>
        <PaginationNav page={5} totalPages={42} onPageChange={onPageChange} />
      </MemoryRouter>,
    )
    await user.click(screen.getByRole('button', { name: '6' }))
    expect(onPageChange).toHaveBeenCalledWith(6)
    await user.click(screen.getByRole('button', { name: 'Sonraki sayfa' }))
    expect(onPageChange).toHaveBeenCalledWith(6)
  })
})
