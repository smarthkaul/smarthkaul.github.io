import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import ActionLink from './ActionLink'

const renderIn = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('ActionLink', () => {
  it('routes internally when given `to`, without opening a new tab', () => {
    renderIn(<ActionLink to="/projects">All projects</ActionLink>)
    const link = screen.getByRole('link', { name: 'All projects' })
    expect(link).toHaveAttribute('href', '/projects')
    expect(link).not.toHaveAttribute('target')
  })

  it('always pairs target with rel on an external `href`', () => {
    // The whole reason this component exists: a bare target="_blank" without
    // rel="noopener" hands the opened page a reference back to this one.
    renderIn(<ActionLink href="https://example.com/repo">View the code</ActionLink>)
    const link = screen.getByRole('link', { name: 'View the code' })
    expect(link).toHaveAttribute('href', 'https://example.com/repo')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('prefers the external form when both props are passed', () => {
    renderIn(
      <ActionLink to="/projects" href="https://example.com">
        Ambiguous
      </ActionLink>
    )
    expect(screen.getByRole('link', { name: 'Ambiguous' })).toHaveAttribute(
      'href',
      'https://example.com'
    )
  })
})
