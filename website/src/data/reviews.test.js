import { describe, it, expect } from 'vitest'
import { CATEGORIES, RATING_VALUES, getCategory, isValidRating, validateReview, ratingLabel } from './reviews'

describe('review data', () => {
  it('has the five fixed categories', () => {
    expect(CATEGORIES.map((c) => c.label)).toEqual(['Movies', 'Live events', 'Food and drinks', 'Sports', 'Music'])
  })

  it('rates in half stars from 0.5 to 4', () => {
    expect(RATING_VALUES).toEqual([0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4])
    expect(isValidRating(0)).toBe(false)
    expect(isValidRating(4.5)).toBe(false)
    expect(isValidRating(1.25)).toBe(false)
  })

  it('looks up categories by id', () => {
    expect(getCategory('music').label).toBe('Music')
    expect(getCategory('books')).toBeNull()
  })

  it('accepts a complete review and trims it', () => {
    const { review, errors } = validateReview({ title: '  Challengers ', category: 'movies', rating: 3.5, body: ' Great score. ' })
    expect(errors).toEqual({})
    expect(review).toEqual({ title: 'Challengers', category: 'movies', rating: 3.5, body: 'Great score.' })
  })

  it('flags every missing field', () => {
    const { errors } = validateReview({ title: ' ', category: '', rating: null, body: '' })
    expect(Object.keys(errors).sort()).toEqual(['body', 'category', 'rating', 'title'])
  })

  it('rejects an unknown category and an off-scale rating', () => {
    const { errors } = validateReview({ title: 'x', category: 'books', rating: 5, body: 'y' })
    expect(Object.keys(errors).sort()).toEqual(['category', 'rating'])
  })

  it('labels ratings for screen readers', () => {
    expect(ratingLabel(2.5)).toBe('2.5 out of 4 stars')
  })
})
