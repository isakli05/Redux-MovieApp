import { describe, expect, it, vi, beforeEach } from 'vitest'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'

// Mocked auth state shared with the hoisted module factory below.
const { authState } = vi.hoisted(() => ({
  authState: {
    user: null as { id: number; username: string; name: string; session_id: string } | null,
    isLoading: false,
    isAuthenticated: false,
    login: vi.fn(),
    logout: vi.fn(),
  },
}))

vi.mock('../hooks/useAuth', () => ({
  useAuth: () => authState,
}))

// SearchBar pulls the whole RTK Query API slice — stub it with its prop contract.
vi.mock('../components/Search/SearchBar', () => ({
  default: ({ onClose }: { onClose?: () => void }) => (
    <div data-testid="search-bar-mock">
      <input aria-label="Arama sorgusu" />
      <button type="button" onClick={onClose}>
        Kapat
      </button>
    </div>
  ),
}))

import Navbar from '../components/Navbar'

function renderNavbar() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Navbar />
    </MemoryRouter>
  )
}

describe('Navbar', () => {
  beforeEach(() => {
    authState.user = null
    authState.isAuthenticated = false
    authState.login = vi.fn()
    authState.logout = vi.fn()
  })

  it('renders the LMDB wordmark and all main navigation links', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'LMDB — ana sayfa' })).toHaveAttribute('href', '/')
    for (const label of ['Keşfet', 'Filmler', 'Diziler', 'İnsanlar']) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('link', { name: 'Keşfet' })).toHaveAttribute('href', '/kesfet')
    expect(screen.getByRole('link', { name: 'İnsanlar' })).toHaveAttribute('href', '/person')
  })

  it('shows a search trigger with the Cmd/Ctrl+K hint that opens the search dialog', async () => {
    const user = userEvent.setup()
    renderNavbar()
    // Both the desktop pill and the compact mobile icon button carry the same
    // label; the desktop one is identified by its shortcut hint.
    const [trigger] = screen
      .getAllByRole('button', { name: 'Ara (arama aç)' })
      .filter((button) => /[⌘K]|Ctrl K/.test(button.textContent ?? ''))
    expect(trigger).toBeDefined()

    await user.click(trigger)
    expect(await screen.findByTestId('search-bar-mock')).toBeInTheDocument()
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Kapat' }))
    // The dialog animates out (150ms leave) before unmounting.
    await waitFor(
      () => expect(screen.queryByTestId('search-bar-mock')).not.toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('opens the search dialog via the global Cmd+K shortcut', async () => {
    const user = userEvent.setup()
    renderNavbar()
    await user.keyboard('{Meta>}k{/Meta}')
    expect(await screen.findByTestId('search-bar-mock')).toBeInTheDocument()
  })

  it('opens the mobile drawer from the hamburger button and closes it with Escape', async () => {
    const user = userEvent.setup()
    // Mobile viewport mock — the hamburger is the mobile menu control.
    Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true, writable: true })
    renderNavbar()

    await user.click(screen.getByRole('button', { name: 'Menüyü aç' }))
    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    // Drawer repeats the primary navigation plus lists.
    expect(screen.getAllByRole('link', { name: 'Keşfet' }).length).toBeGreaterThan(1)
    expect(screen.getByRole('link', { name: 'Listelerim' })).toBeInTheDocument()

    await user.keyboard('{Escape}')
    // The drawer animates out (150ms leave) before unmounting.
    await waitFor(
      () => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(),
      { timeout: 2000 }
    )
  })

  it('shows "Giriş Yap" when unauthenticated and calls login on click', async () => {
    const user = userEvent.setup()
    renderNavbar()
    const loginButton = screen.getByRole('button', { name: 'Giriş Yap' })
    await user.click(loginButton)
    expect(authState.login).toHaveBeenCalledOnce()
  })

  it('shows the account menu with the user name and logout when authenticated', async () => {
    const user = userEvent.setup()
    authState.user = { id: 1, username: 'isakli', name: 'İsa', session_id: 'abc' }
    authState.isAuthenticated = true
    renderNavbar()

    const accountButton = screen.getByRole('button', { name: /Hesap menüsü — İsa/ })
    await user.click(accountButton)
    expect(await screen.findByText('İsa')).toBeInTheDocument()
    expect(screen.getByText('TMDB hesabı')).toBeInTheDocument()

    await user.click(screen.getByRole('menuitem', { name: 'Çıkış Yap' }))
    expect(authState.logout).toHaveBeenCalledOnce()
  })

  it('turns into a glass bar after scrolling past 8px', () => {
    renderNavbar()
    const header = screen.getByRole('banner')
    expect(header).not.toHaveClass('glass-bar')

    act(() => {
      Object.defineProperty(window, 'scrollY', { value: 20, configurable: true, writable: true })
      window.dispatchEvent(new Event('scroll'))
    })
    expect(header).toHaveClass('glass-bar')
  })
})
