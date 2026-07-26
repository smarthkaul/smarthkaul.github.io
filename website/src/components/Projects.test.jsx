import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
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
})
