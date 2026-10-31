import '@testing-library/jest-dom/vitest'

// jsdom lacks ResizeObserver, which Headless UI (menu/dialog tracking) needs.
if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  } as unknown as typeof ResizeObserver
}

// jsdom lacks window.matchMedia; Home components (reduced-motion hook, rail
// scrolling) call it during render. Static fallback — specific tests can
// override with vi.spyOn(window, 'matchMedia').
if (typeof window !== 'undefined' && typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  })
}
