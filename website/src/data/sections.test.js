import { describe, it, expect } from 'vitest'
import { SECTIONS, COURT, BOXES, resolveActiveSection } from './sections'

describe('SECTIONS', () => {
  it('has the four sections in nav order with required fields', () => {
    expect(SECTIONS.map((s) => s.id)).toEqual(['about', 'experience', 'projects', 'contact'])
    for (const s of SECTIONS) {
      expect(s).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          label: expect.any(String),
          broadcast: expect.any(String),
          box: expect.any(String),
        })
      )
      expect(BOXES[s.box]).toBeDefined()
    }
  })

  it('maps each section to a distinct service box', () => {
    const boxes = SECTIONS.map((s) => s.box)
    expect(new Set(boxes).size).toBe(4)
  })
})

describe('BOXES geometry', () => {
  it('every box lies within the court bounds', () => {
    for (const b of Object.values(BOXES)) {
      expect(b.x).toBeGreaterThanOrEqual(0)
      expect(b.y).toBeGreaterThanOrEqual(0)
      expect(b.x + b.w).toBeLessThanOrEqual(COURT.width)
      expect(b.y + b.h).toBeLessThanOrEqual(COURT.height)
      expect(b.cx).toBeCloseTo(b.x + b.w / 2)
      expect(b.cy).toBeCloseTo(b.y + b.h / 2)
    }
  })
})

describe('resolveActiveSection', () => {
  it('resolves a known section path', () => {
    expect(resolveActiveSection('/about')).toBe(SECTIONS[0])
    expect(resolveActiveSection('/contact')).toBe(SECTIONS[3])
  })
  it('returns null for the root and unknown paths', () => {
    expect(resolveActiveSection('/')).toBeNull()
    expect(resolveActiveSection('/nonsense')).toBeNull()
    expect(resolveActiveSection('')).toBeNull()
  })
  it('tolerates trailing slashes', () => {
    expect(resolveActiveSection('/about/')).toBe(SECTIONS[0])
  })
})
