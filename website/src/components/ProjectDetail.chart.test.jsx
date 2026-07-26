import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// Stubs rather than real projects, so figure placement can be exercised at
// both the default position and an explicit one without depending on the
// section count of whatever content happens to ship.
const stub = (over = {}) => ({
  slug: 'charted',
  title: 'Charted Project',
  hero: '1.0',
  heroLabel: 'metric',
  description: 'stub',
  tech: ['R'],
  codeUrl: null,
  detail: {
    broadcast: 'Match Report',
    sections: [
      { heading: 'First section', body: 'first body' },
      { heading: 'Second section', body: 'second body' },
      { heading: 'Third section', body: 'third body' },
    ],
    chart: {
      src: '/charts/stub.png',
      alt: 'A calibration curve',
      caption: 'Fig 1 — Calibration',
      width: 1600,
      height: 900,
    },
    ...over,
  },
})

vi.mock('../data/projects', () => ({
  PROJECTS: [],
  getProject: (slug) => {
    if (slug === 'charted') return stub()
    if (slug === 'charted-late') return stub({ chartAfter: 1 })
    if (slug === 'charted-out-of-range') return stub({ chartAfter: 99 })
    return null
  },
}))

// Imported after the mock so the component picks up the stubbed module.
const { default: ProjectDetail } = await import('./ProjectDetail')

const renderSlug = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects" element={<p>projects list</p>} />
        <Route path="/projects/:slug" element={<ProjectDetail slug={slug} />} />
      </Routes>
    </MemoryRouter>
  )

const renderCharted = () => renderSlug('charted')

// Section headings and the figure, in the order they appear in the document.
const layoutOf = (container) =>
  [...container.querySelectorAll('h3, figure')].map((n) => n.tagName)

describe('ProjectDetail chart figure', () => {
  it('renders the chart with its alt text and caption', () => {
    renderCharted()
    expect(
      screen.getByRole('img', { name: 'A calibration curve' })
    ).toBeInTheDocument()
    expect(screen.getByText('Fig 1 — Calibration')).toBeInTheDocument()
  })

  it('defaults the figure to just after the opening section', () => {
    const { container } = renderCharted()
    expect(layoutOf(container)).toEqual(['H3', 'FIGURE', 'H3', 'H3'])
  })

  it('honours chartAfter, placing the figure after the named section', () => {
    // chartAfter: 1 — the figure should follow the SECOND section, so a chart
    // can sit beside the section it is evidence for rather than the intro.
    const { container } = renderSlug('charted-late')
    expect(layoutOf(container)).toEqual(['H3', 'H3', 'FIGURE', 'H3'])
  })

  it('drops the figure rather than crashing when chartAfter is out of range', () => {
    // A typo'd index must not take the page down — it just loses the figure.
    const { container } = renderSlug('charted-out-of-range')
    expect(layoutOf(container)).toEqual(['H3', 'H3', 'H3'])
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  // The stub above sets codeUrl: null. Every real project now publishes code,
  // so this branch can only be reached against a fixture — but a project with
  // no code link must still render no link rather than a dead one.
  it('renders no code link when codeUrl is null', () => {
    renderCharted()
    expect(
      screen.queryByRole('link', { name: /view the code/i })
    ).not.toBeInTheDocument()
    // The internal "All projects" link is unaffected.
    expect(screen.getByRole('link', { name: /all projects/i })).toBeInTheDocument()
  })
})
