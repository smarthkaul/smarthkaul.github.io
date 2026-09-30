import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ReviewForm from './ReviewForm'

const fill = () => {
  fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Joe\'s Pizza' } })
  fireEvent.change(screen.getByLabelText('Category'), { target: { value: 'food-and-drinks' } })
  fireEvent.click(screen.getByRole('radio', { name: '4 out of 4 stars' }))
  fireEvent.change(screen.getByLabelText('Review'), { target: { value: 'Best slice in the city.' } })
}

describe('ReviewForm', () => {
  it('shows errors and does not save an empty review', () => {
    const onSave = vi.fn()
    render(<ReviewForm heading="New review" onSave={onSave} onCancel={() => {}} />)
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }))
    expect(screen.getByText('Give it a title.')).toBeInTheDocument()
    expect(screen.getByText('Pick a rating.')).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  it('saves a complete review', async () => {
    const onSave = vi.fn().mockResolvedValue()
    render(<ReviewForm heading="New review" onSave={onSave} onCancel={() => {}} />)
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }))
    await waitFor(() =>
      expect(onSave).toHaveBeenCalledWith({
        title: "Joe's Pizza",
        category: 'food-and-drinks',
        rating: 4,
        body: 'Best slice in the city.',
      })
    )
  })

  it('shows an error when the save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('offline'))
    render(<ReviewForm heading="New review" onSave={onSave} onCancel={() => {}} />)
    fill()
    fireEvent.click(screen.getByRole('button', { name: 'Save review' }))
    expect(await screen.findByRole('alert')).toHaveTextContent("Couldn't save the review")
  })
})
