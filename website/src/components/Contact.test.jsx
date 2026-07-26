import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import Contact from './Contact'

describe('Contact', () => {
  it('sends the CTA to the mail client without navigating this page away', () => {
    render(<Contact />)
    const cta = screen.getByRole('link', { name: /return serve/i })
    expect(cta).toHaveAttribute('href', 'mailto:kaul.smarth02@gmail.com')
    expect(cta).toHaveAttribute('target', '_blank')
    expect(cta).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
