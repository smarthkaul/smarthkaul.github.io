import { describe, it, expect } from 'vitest'
import { PROJECTS, getProject } from './projects'

describe('PROJECTS', () => {
  it('lists the three flagship projects in display order', () => {
    expect(PROJECTS.map((p) => p.slug)).toEqual([
      'march-madness',
      'energy-forecasting',
      'this-site',
    ])
  })

  it('gives every project the fields the list card and detail page need', () => {
    for (const p of PROJECTS) {
      expect(p).toEqual(
        expect.objectContaining({
          slug: expect.any(String),
          title: expect.any(String),
          hero: expect.any(String),
          heroLabel: expect.any(String),
          description: expect.any(String),
          tech: expect.any(Array),
          detail: expect.any(Object),
        })
      )
      expect(p.tech.length).toBeGreaterThan(0)
      expect(p.detail.broadcast).toEqual(expect.any(String))
      expect(p.detail.sections.length).toBeGreaterThan(0)
    }
  })

  it('uses unique, URL-safe slugs', () => {
    const slugs = PROJECTS.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s).toMatch(/^[a-z0-9-]+$/)
  })

  it('gives every detail section exactly one of body or items', () => {
    for (const p of PROJECTS) {
      for (const s of p.detail.sections) {
        expect(s.heading).toEqual(expect.any(String))
        expect(Boolean(s.body) !== Boolean(s.items)).toBe(true)
      }
    }
  })

  it('gives every chart the full set of fields ChartFrame needs', () => {
    // ChartFrame spreads detail.chart straight into an <img>. React drops
    // undefined attributes silently, so a missing field degrades the page
    // with no error — alt text vanishes, or the image stops reserving space.
    for (const p of PROJECTS) {
      if (!p.detail.chart) continue
      const { src, alt, caption, width, height } = p.detail.chart
      expect(src).toEqual(expect.any(String))
      expect(caption).toEqual(expect.any(String))
      expect(alt).toEqual(expect.any(String))
      expect(alt.length).toBeGreaterThan(0)
      expect(width).toEqual(expect.any(Number))
      expect(height).toEqual(expect.any(Number))
    }
  })

  it('types codeUrl as a URL or null, never undefined', () => {
    for (const p of PROJECTS) {
      expect(p.codeUrl === null || typeof p.codeUrl === 'string').toBe(true)
    }
  })

  it('credits the team on the collaborative projects', () => {
    // Both course projects have co-authors; the site is solo.
    expect(getProject('march-madness').team).toEqual(expect.any(String))
    expect(getProject('energy-forecasting').team).toEqual(expect.any(String))
    expect(getProject('this-site').team).toBeUndefined()
  })
})

describe('getProject', () => {
  it('finds a project by slug', () => {
    expect(getProject('this-site')).toBe(PROJECTS[2])
  })

  it('returns null for an unknown slug', () => {
    expect(getProject('nope')).toBeNull()
    expect(getProject('')).toBeNull()
  })
})
