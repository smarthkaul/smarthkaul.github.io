import { describe, it, expect } from 'vitest'
import { render, within } from '@testing-library/react'
import StatList from './StatList'

const items = [
  { k: 'Ensemble', v: '0.1250' },
  { k: 'Top Kaggle score', v: '0.09588' },
]

describe('StatList', () => {
  it('renders each pair as a term and definition', () => {
    const { container } = render(<StatList items={items} />)
    expect(within(container).getByText('Ensemble')).toBeInTheDocument()
    expect(within(container).getByText('0.1250')).toBeInTheDocument()
    expect(within(container).getByText('Top Kaggle score')).toBeInTheDocument()
    expect(within(container).getByText('0.09588')).toBeInTheDocument()
  })

  it('uses a definition list for semantics', () => {
    const { container } = render(<StatList items={items} />)
    expect(container.querySelector('dl')).toBeInTheDocument()
    expect(container.querySelectorAll('dt')).toHaveLength(2)
    expect(container.querySelectorAll('dd')).toHaveLength(2)
  })

  it('appends a caller-supplied className to the list', () => {
    const { container } = render(<StatList items={items} className="mb-4" />)
    expect(container.querySelector('dl')).toHaveClass('mb-4')
  })

  it('renders an empty list without crashing', () => {
    const { container } = render(<StatList items={[]} />)
    expect(container.querySelectorAll('dt')).toHaveLength(0)
  })
})
