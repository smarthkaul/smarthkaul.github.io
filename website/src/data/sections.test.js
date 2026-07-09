import { describe, it, expect } from 'vitest'
import {
  SECTIONS, COURT, BOXES, resolveActiveSection,
  SERVE_ORIGIN, serveControl, servePathD, bezierPoint,
  landingFromPull, pointInRect, classifyLanding,
} from './sections'

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

describe('serve trajectory', () => {
  const O = SERVE_ORIGIN
  const T = { x: 120, y: 202.5 } // far-left box centre

  it('SERVE_ORIGIN is the near-baseline centre within the court', () => {
    expect(SERVE_ORIGIN).toEqual({ x: 180, y: 520 })
    expect(SERVE_ORIGIN.x).toBeLessThanOrEqual(COURT.width)
    expect(SERVE_ORIGIN.y).toBeLessThanOrEqual(COURT.height)
  })

  it('serveControl apex sits above the higher of origin/target', () => {
    const c = serveControl(O, T)
    expect(c.x).toBeCloseTo((O.x + T.x) / 2)
    expect(c.y).toBeLessThan(Math.min(O.y, T.y)) // smaller y = higher on screen
  })

  it('bezierPoint returns the endpoints at t=0 and t=1', () => {
    const c = serveControl(O, T)
    expect(bezierPoint(O, c, T, 0)).toEqual(O)
    const end = bezierPoint(O, c, T, 1)
    expect(end.x).toBeCloseTo(T.x)
    expect(end.y).toBeCloseTo(T.y)
  })

  it('bezierPoint midpoint is pulled toward the control point (arcs upward)', () => {
    const c = serveControl(O, T)
    const mid = bezierPoint(O, c, T, 0.5)
    const straightMidY = (O.y + T.y) / 2
    expect(mid.y).toBeLessThan(straightMidY) // the arc rises above the straight line
  })

  it('servePathD emits a quadratic path string through the control point', () => {
    const c = serveControl(O, T)
    expect(servePathD(O, c, T)).toBe(`M ${O.x} ${O.y} Q ${c.x} ${c.y} ${T.x} ${T.y}`)
  })
})

describe('aim & landing', () => {
  it('landingFromPull mirrors and scales the pull vector', () => {
    // pulling DOWN (positive y) should send the ball UP the court (smaller y)
    const p = landingFromPull(SERVE_ORIGIN, { x: 0, y: 40 }, { power: 2, maxReach: 1000 })
    expect(p.x).toBeCloseTo(SERVE_ORIGIN.x)          // no horizontal pull → straight
    expect(p.y).toBeCloseTo(SERVE_ORIGIN.y - 80)     // -pull.y * power = -80
  })

  it('landingFromPull clamps to maxReach', () => {
    const p = landingFromPull(SERVE_ORIGIN, { x: 0, y: 1000 }, { power: 2, maxReach: 100 })
    expect(SERVE_ORIGIN.y - p.y).toBeCloseTo(100)    // clamped to 100, upward
  })

  it('pointInRect is inclusive of edges', () => {
    expect(pointInRect({ x: 60, y: 135 }, BOXES['far-left'])).toBe(true)
    expect(pointInRect({ x: 0, y: 0 }, BOXES['far-left'])).toBe(false)
  })

  it('classifyLanding: hit when inside a service box', () => {
    const far = BOXES['far-left']
    expect(classifyLanding({ x: far.cx, y: far.cy })).toEqual({ type: 'hit', sectionId: 'projects' })
  })

  it('classifyLanding: out when in-bounds but not in a box', () => {
    // near baseline, inside court, below all service boxes (y between 405 and 520)
    expect(classifyLanding({ x: 180, y: 460 })).toEqual({ type: 'out' })
  })

  it('classifyLanding: beyond when outside the court bounds', () => {
    expect(classifyLanding({ x: 180, y: -40 })).toEqual({ type: 'beyond' })  // past far baseline
    expect(classifyLanding({ x: 500, y: 200 })).toEqual({ type: 'beyond' })  // past sideline
  })
})
