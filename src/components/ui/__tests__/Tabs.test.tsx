import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Tabs } from '../Tabs'
import type { TabItem } from '../Tabs'

const tabs: TabItem[] = [
  { id: 'cast', label: 'Kadro' },
  { id: 'trailers', label: 'Fragmanlar' },
  { id: 'recommendations', label: 'Öneriler' },
]

function renderTabs(activeId = 'cast', onChange = vi.fn()) {
  render(
    <Tabs tabs={tabs} activeId={activeId} onChange={onChange} aria-label="Detay sekmeleri">
      <div>panel-content-{activeId}</div>
    </Tabs>
  )
  return { onChange }
}

describe('Tabs', () => {
  it('renders tablist semantics and links tabs to their panel', () => {
    renderTabs()
    const list = screen.getByRole('tablist')
    expect(list).toHaveAttribute('aria-label', 'Detay sekmeleri')

    const active = screen.getByRole('tab', { name: 'Kadro', selected: true })
    expect(active).toHaveAttribute('aria-controls', 'tabpanel-cast')

    const panel = screen.getByRole('tabpanel')
    expect(panel).toHaveAttribute('aria-labelledby', 'tab-cast')
    expect(panel).toHaveTextContent('panel-content-cast')
  })

  it('uses a roving tabindex — only the selected tab is tabbable', () => {
    renderTabs('trailers')
    expect(screen.getByRole('tab', { name: 'Kadro' })).toHaveAttribute('tabindex', '-1')
    expect(screen.getByRole('tab', { name: 'Fragmanlar' })).toHaveAttribute('tabindex', '0')
    expect(screen.getByRole('tab', { name: 'Öneriler' })).toHaveAttribute('tabindex', '-1')
  })

  it('selects a tab on click', async () => {
    const user = userEvent.setup()
    const { onChange } = renderTabs()
    await user.click(screen.getByRole('tab', { name: 'Öneriler' }))
    expect(onChange).toHaveBeenCalledWith('recommendations')
  })

  it('moves selection and focus with ArrowRight and ArrowLeft', async () => {
    const user = userEvent.setup()
    const { onChange } = renderTabs()

    screen.getByRole('tab', { name: 'Kadro' }).focus()
    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('trailers')
    expect(screen.getByRole('tab', { name: 'Fragmanlar' })).toHaveFocus()

    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith('cast')
    expect(screen.getByRole('tab', { name: 'Kadro' })).toHaveFocus()
  })

  it('wraps arrow navigation at the edges', async () => {
    const user = userEvent.setup()
    const { onChange } = renderTabs()

    screen.getByRole('tab', { name: 'Kadro' }).focus()
    await user.keyboard('{ArrowLeft}')
    expect(onChange).toHaveBeenCalledWith('recommendations')
    expect(screen.getByRole('tab', { name: 'Öneriler' })).toHaveFocus()

    await user.keyboard('{ArrowRight}')
    expect(onChange).toHaveBeenCalledWith('cast')
  })

  it('supports Home and End keys', async () => {
    const user = userEvent.setup()
    const { onChange } = renderTabs()

    screen.getByRole('tab', { name: 'Kadro' }).focus()
    await user.keyboard('{End}')
    expect(onChange).toHaveBeenCalledWith('recommendations')

    await user.keyboard('{Home}')
    expect(onChange).toHaveBeenCalledWith('cast')
  })
})
