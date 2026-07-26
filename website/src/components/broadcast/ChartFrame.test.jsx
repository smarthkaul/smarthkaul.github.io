import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChartFrame from './ChartFrame'

const props = {
  src: '/charts/calibration.png',
  alt: 'Calibration curve showing predicted vs observed win rates',
  caption: 'Fig 1 — Calibration',
  width: 1600,
  height: 900,
}

describe('ChartFrame', () => {
  it('renders the image by its alt text', () => {
    render(<ChartFrame {...props} />)
    expect(screen.getByRole('img', { name: props.alt })).toBeInTheDocument()
  })

  it('renders the caption', () => {
    render(<ChartFrame {...props} />)
    expect(screen.getByText('Fig 1 — Calibration')).toBeInTheDocument()
  })

  it('reserves layout space and defers loading', () => {
    render(<ChartFrame {...props} />)
    const img = screen.getByRole('img', { name: props.alt })
    expect(img).toHaveAttribute('width', '1600')
    expect(img).toHaveAttribute('height', '900')
    expect(img).toHaveAttribute('loading', 'lazy')
  })

  it('omits the caption bar entirely when no caption is given', () => {
    const { container } = render(<ChartFrame {...props} caption={undefined} />)
    // Assert the element is gone, not just its text — an always-rendered
    // empty <figcaption> would leave a stray bordered strip above the image.
    expect(container.querySelector('figcaption')).toBeNull()
    expect(screen.getByRole('img', { name: props.alt })).toBeInTheDocument()
  })
})
