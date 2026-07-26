import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Vitest runs without `globals: true`, so RTL cannot self-register its cleanup.
// Without this, every render() leaks into document.body and later tests in the
// same file match elements from earlier ones.
afterEach(cleanup)

// jsdom has no IntersectionObserver, but useReveal() constructs one on mount —
// so without this, rendering any section that uses the reveal hook throws.
// Reporting the element as intersecting immediately means revealed content is
// queryable without waiting on an observer that will never fire.
class IntersectionObserverStub {
  constructor(callback) {
    this.callback = callback
  }
  observe(element) {
    this.callback([{ isIntersecting: true, target: element }], this)
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return []
  }
}

globalThis.IntersectionObserver = IntersectionObserverStub
