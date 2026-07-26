import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import Projects from './Projects'

const renderAt = (path) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:slug" element={<Projects />} />
      </Routes>
    </MemoryRouter>
  )

describe('Projects', () => {
  it('renders the card list at /projects', () => {
    renderAt('/projects')
    expect(
      screen.getByRole('heading', { name: /March Madness/i })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /This Site/i })).toBeInTheDocument()
  })

  it('links each card to its detail page', () => {
    renderAt('/projects')
    const links = screen.getAllByRole('link', { name: /match report/i })
    expect(links).toHaveLength(3)
    expect(links.map((a) => a.getAttribute('href'))).toEqual([
      '/projects/march-madness',
      '/projects/energy-forecasting',
      '/projects/this-site',
    ])
  })

  it('gives every card a code link that opens externally', () => {
    renderAt('/projects')
    // All three now publish code: a Colab notebook, a gist, and this repo.
    // The null case (a card rendering no link at all) is covered against a
    // stub in ProjectDetail.chart.test.jsx, since no real project hits it.
    const codeLinks = screen.getAllByRole('link', { name: /view the code/i })
    expect(codeLinks).toHaveLength(3)
    for (const link of codeLinks) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', 'noopener noreferrer')
    }
  })

  it('renders the detail page at /projects/:slug instead of the list', () => {
    renderAt('/projects/this-site')
    expect(
      screen.getByRole('heading', { name: /This Site/i, level: 2 })
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'The serve' })).toBeInTheDocument()
    // The list's other cards must not be on the page.
    expect(
      screen.queryByRole('heading', { name: /March Madness/i })
    ).not.toBeInTheDocument()
  })

  // CourtStage focuses a section's heading on MOUNT. /projects and
  // /projects/:slug resolve to the same active section id, so switching
  // between them re-renders Projects in place rather than remounting it —
  // CourtStage's mount-only focus callback never re-fires for that transition.
  // Projects.jsx compensates with its own effect; these two tests pin down
  // both halves of that behavior: no double-focus on first mount, and a real
  // focus move on a real subsequent navigation.
  it('does not steal focus on initial mount (CourtStage already handled it)', () => {
    renderAt('/projects')
    expect(document.activeElement).toBe(document.body)
  })

  it('moves focus to the detail heading after navigating from the list via a real link click', () => {
    renderAt('/projects')
    const links = screen.getAllByRole('link', { name: /match report/i })
    // Order matches PROJECTS: march-madness, energy-forecasting, this-site.
    const thisSiteLink = links[2]
    expect(thisSiteLink).toHaveAttribute('href', '/projects/this-site')

    fireEvent.click(thisSiteLink)

    const heading = screen.getByRole('heading', { name: /This Site/i, level: 2 })
    expect(document.activeElement).toBe(heading)
  })
})
