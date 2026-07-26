import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import ProjectDetail from './ProjectDetail'

const renderDetail = (slug) =>
  render(
    <MemoryRouter initialEntries={[`/projects/${slug}`]}>
      <Routes>
        <Route path="/projects" element={<p>projects list</p>} />
        <Route path="/projects/:slug" element={<ProjectDetail slug={slug} />} />
      </Routes>
    </MemoryRouter>
  )

describe('ProjectDetail', () => {
  it('renders the project title as the section heading', () => {
    renderDetail('this-site')
    expect(
      screen.getByRole('heading', { name: /This Site/i, level: 2 })
    ).toBeInTheDocument()
  })

  it('renders every detail section heading and its prose', () => {
    renderDetail('this-site')
    expect(screen.getByRole('heading', { name: 'The serve' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Accessibility' })).toBeInTheDocument()
    expect(screen.getByText(/slingshot, not a steering wheel/)).toBeInTheDocument()
  })

  it('renders list-style sections as an ordered list', () => {
    renderDetail('march-madness')
    // march-madness has two `items` sections; "Feature engineering" is the first.
    expect(
      screen.getByRole('heading', { name: 'Feature engineering' })
    ).toBeInTheDocument()
    expect(screen.getAllByRole('listitem').length).toBeGreaterThanOrEqual(3)
  })

  it('renders the results stat line and its note', () => {
    renderDetail('march-madness')
    expect(screen.getByText('Logistic regression')).toBeInTheDocument()
    expect(screen.getByText('0.1252')).toBeInTheDocument()
    expect(screen.getByText('Top Kaggle score')).toBeInTheDocument()
    expect(screen.getByText('0.09588')).toBeInTheDocument()
    // "0.1250" is both the hero badge and a results value, so it appears twice.
    expect(screen.getAllByText('0.1250')).toHaveLength(2)
    // "lower-is-better" now also appears in the "What actually won" section
    // body, so match the resultsNote's own wording to keep this scoped to it.
    expect(screen.getByText(/lower-is-better, so the leaderboard/)).toBeInTheDocument()
  })

  it('credits the team when the project has co-authors', () => {
    renderDetail('march-madness')
    expect(screen.getByText(/Three-person course project/)).toBeInTheDocument()
  })

  it('shows no team credit on a solo project', () => {
    renderDetail('this-site')
    expect(screen.queryByText(/course project/i)).not.toBeInTheDocument()
  })

  it('links to the code when a code url is present', () => {
    renderDetail('this-site')
    const link = screen.getByRole('link', { name: /view the code/i })
    expect(link).toHaveAttribute('href', 'https://github.com/smarthkaul/smarthkaul.github.io')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  // The codeUrl-is-null case moved to ProjectDetail.chart.test.jsx: every real
  // project now publishes code, so it can only be exercised against a stub.

  it('renders the march-madness figure beside the section it supports', () => {
    const { container } = renderDetail('march-madness')
    expect(
      screen.getByRole('img', { name: /highest-importance features in the XGBoost model/i })
    ).toBeInTheDocument()
    // The importance chart is evidence for "Selection and tuning", so it must
    // follow that heading and precede "What actually won" — not sit up by the
    // problem statement, where the reader has not met the features yet.
    const nodes = [...container.querySelectorAll('h3, figure')]
    const figureAt = nodes.findIndex((n) => n.tagName === 'FIGURE')
    expect(nodes[figureAt - 1].textContent).toBe('Selection and tuning')
    expect(nodes[figureAt + 1].textContent).toBe('What actually won')
  })

  it('renders the energy forecast figure beside the model comparison', () => {
    const { container } = renderDetail('energy-forecasting')
    expect(screen.getByRole('img', { name: /two-year forecast/i })).toBeInTheDocument()
    const nodes = [...container.querySelectorAll('h3, figure')]
    const figureAt = nodes.findIndex((n) => n.tagName === 'FIGURE')
    expect(nodes[figureAt - 1].textContent).toBe('SARIMA versus VAR')
  })

  it('always offers a way back to the project list', () => {
    renderDetail('this-site')
    expect(screen.getByRole('link', { name: /all projects/i })).toHaveAttribute(
      'href',
      '/projects'
    )
  })

  it('renders no figure when the project has no chart', () => {
    renderDetail('this-site')
    expect(screen.queryByRole('img')).not.toBeInTheDocument()
  })

  it('redirects an unknown slug to the project list', () => {
    renderDetail('does-not-exist')
    expect(screen.getByText('projects list')).toBeInTheDocument()
  })
})
