import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

// No real project defines detail.chart yet, so the figure branch is exercised
// against a stub. This guards both that the chart renders and where it lands.
vi.mock('../data/projects', () => ({
  PROJECTS: [],
  getProject: (slug) =>
    slug === 'charted'
      ? {
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
            ],
            chart: {
              src: '/charts/stub.png',
              alt: 'A calibration curve',
              caption: 'Fig 1 — Calibration',
              width: 1600,
              height: 900,
            },
          },
        }
      : null,
}))

// Imported after the mock so the component picks up the stubbed module.
const { default: ProjectDetail } = await import('./ProjectDetail')

const renderCharted = () =>
  render(
    <MemoryRouter initialEntries={['/projects/charted']}>
      <Routes>
        <Route path="/projects" element={<p>projects list</p>} />
        <Route path="/projects/:slug" element={<ProjectDetail slug="charted" />} />
      </Routes>
    </MemoryRouter>
  )

describe('ProjectDetail chart figure', () => {
  it('renders the chart with its alt text and caption', () => {
    renderCharted()
    expect(
      screen.getByRole('img', { name: 'A calibration curve' })
    ).toBeInTheDocument()
    expect(screen.getByText('Fig 1 — Calibration')).toBeInTheDocument()
  })

  it('places the figure after the first section and before the second', () => {
    const { container } = renderCharted()
    const order = [...container.querySelectorAll('h3, figure')].map(
      (n) => n.tagName
    )
    expect(order).toEqual(['H3', 'FIGURE', 'H3'])
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
