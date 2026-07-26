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

  it('omits the caption bar when no caption is given', () => {
    render(<ChartFrame {...props} caption={undefined} />)
    expect(screen.queryByText('Fig 1 — Calibration')).not.toBeInTheDocument()
    expect(screen.getByRole('img', { name: props.alt })).toBeInTheDocument()
  })
})
