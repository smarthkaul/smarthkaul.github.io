import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import App from '../App'

// jsdom does not implement window.matchMedia. usePrefersReducedMotion (used by
// CourtStage and Hud) calls it unconditionally in an effect, and framer-motion
// independently probes it (via the legacy addListener/removeListener API) the
// first time any motion component mounts. Without a stub, mounting the real
// App throws outside a real browser — the same gap setup.js already papers
// over for IntersectionObserver. This mock supplies a missing jsdom browser
// API; it does not touch or weaken app behavior.
function mockMatchMedia(matches = false) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
  }))
}

// jsdom also doesn't implement window.scrollTo, which CourtStage calls on
// every navigation. It's a no-op stub for the same reason as matchMedia above.
window.scrollTo = vi.fn()

// App renders <BrowserRouter>, which reads its initial location from
// window.location — so the URL has to be set before render, not passed as a
// prop the way MemoryRouter's initialEntries would be.
function renderAppAt(path) {
  window.history.pushState({}, '', path)
  return render(<App />)
}

describe('App route table (the real routes, not a local test harness)', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  it('renders the detail page heading at /projects/:slug', () => {
    renderAppAt('/projects/this-site')
    expect(
      screen.getByRole('heading', { name: /This Site/i, level: 2 })
    ).toBeInTheDocument()
  })

  it('renders the card list at /projects', () => {
    renderAppAt('/projects')
    expect(
      screen.getByRole('heading', { name: /March Madness/i })
    ).toBeInTheDocument()
  })

  it('redirects an unknown slug to the project list rather than the 404 page', () => {
    renderAppAt('/projects/does-not-exist')
    // The list, not the 404 route, should have rendered.
    expect(
      screen.getByRole('heading', { name: /March Madness/i })
    ).toBeInTheDocument()
    expect(screen.queryByText(/page not found/i)).not.toBeInTheDocument()
  })
})
