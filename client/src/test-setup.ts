import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from './mocks/server'

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  // RTL's auto-cleanup only self-registers when a global `afterEach` exists
  // (vitest.config.ts doesn't set test.globals, so it doesn't) — call it explicitly.
  cleanup()
  server.resetHandlers()
})
afterAll(() => server.close())
