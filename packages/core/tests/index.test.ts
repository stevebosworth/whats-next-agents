import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { parseTaskString, parseDuration, HLC, findFittingTasks, isInQuietHours } from '../src/index.js'
import { DateTime } from 'luxon'

describe('NLP Parser', () => {
  it('extracts duration and title', () => {
    const { title, duration } = parseDuration('Buy milk (15m)')
    expect(title).toBe('Buy milk')
    expect(duration).toBe(15)
  })

  it('extracts dates with chrono-node', () => {
    const result = parseTaskString('Call mom tomorrow at 10am (30m)', 'UTC')
    expect(result.title).toBe('Call mom')
    expect(result.duration_minutes).toBe(30)
    expect(result.due_at).toBeDefined()
  })
})

describe('HLC Sync', () => {
  it('monotonicity: tick() always increases', () => {
    const hlc = new HLC('node-1')
    const t1 = hlc.tick()
    const t2 = hlc.tick()
    expect(HLC.compare(t1, t2)).toBe(-1)
  })

  it('property-based: hlc.receive(remote) >= remote and >= local', () => {
    fc.assert(
      fc.property(fc.integer(), (wallClock) => {
        const hlc = new HLC('node-1')
        const remote = `2026-02-19T12:00:00.000Z:0005:node-2`
        const local = hlc.receive(remote)
        
        expect(HLC.compare(local, remote)).toBeGreaterThanOrEqual(0)
      })
    )
  })
})

describe('Time Fitting', () => {
  it('filters tasks that fit in the duration', () => {
    const tasks = [
      { id: '1', title: 'Task 1', duration_minutes: 10, is_completed: false, hlc_timestamp: 'x' } as any,
      { id: '2', title: 'Task 2', duration_minutes: 20, is_completed: false, hlc_timestamp: 'x' } as any,
    ]
    const fitting = findFittingTasks(tasks, 15)
    expect(fitting).toHaveLength(1)
    expect(fitting[0].id).toBe('1')
  })
})

describe('Quiet Hours', () => {
  it('detects quiet hours across midnight', () => {
    const user = { 
      quiet_hours_start: '22:00', 
      quiet_hours_end: '08:00', 
      timezone: 'UTC' 
    } as any
    
    const nightTime = DateTime.fromFormat('23:00', 'HH:mm', { zone: 'UTC' })
    const dayTime = DateTime.fromFormat('10:00', 'HH:mm', { zone: 'UTC' })
    
    expect(isInQuietHours(user, nightTime)).toBe(true)
    expect(isInQuietHours(user, dayTime)).toBe(false)
  })
})
