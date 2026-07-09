import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook } from '@testing-library/react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

function mockMatchMedia(matches) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
}

describe('usePrefersReducedMotion', () => {
  beforeEach(() => vi.restoreAllMocks())

  it('returns true when the user prefers reduced motion', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(true)
  })

  it('returns false otherwise', () => {
    mockMatchMedia(false)
    const { result } = renderHook(() => usePrefersReducedMotion())
    expect(result.current).toBe(false)
  })

  it('subscribes and unsubscribes to media-query changes', () => {
    const add = vi.fn()
    const remove = vi.fn()
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      addEventListener: add,
      removeEventListener: remove,
    }))
    const { unmount } = renderHook(() => usePrefersReducedMotion())
    expect(add).toHaveBeenCalledWith('change', expect.any(Function))
    unmount()
    expect(remove).toHaveBeenCalledWith('change', expect.any(Function))
  })
})
