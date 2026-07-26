import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Vitest runs without `globals: true`, so RTL cannot self-register its cleanup.
// Without this, every render() leaks into document.body and later tests in the
// same file match elements from earlier ones.
afterEach(cleanup)
