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

  it('handles unspecified duration', () => {
    const { title, duration } = parseDuration('Buy milk')
    expect(title).toBe('Buy milk')
    expect(duration).toBe(15)
  })

  it('handles multiple durations (takes the first one)', () => {
    const { title, duration } = parseDuration('Buy milk (15m) (30m)')
    expect(title).toBe('Buy milk (30m)')
    expect(duration).toBe(15)
  })

  it('handles weird units', () => {
    expect(parseDuration('Task (2h)').duration).toBe(120)
    expect(parseDuration('Task (1 hr)').duration).toBe(60)
    expect(parseDuration('Task (90 min)').duration).toBe(90)
    expect(parseDuration('Task (10 minutes)').duration).toBe(10)
  })

  it('handles empty input', () => {
    const result = parseTaskString('', 'UTC')
    expect(result.title).toBe('Untitled Task')
    expect(result.duration_minutes).toBe(15)
  })

  it('handles only duration in input', () => {
    const result = parseTaskString('(45m)', 'UTC')
    expect(result.title).toBe('Untitled Task')
    expect(result.duration_minutes).toBe(45)
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
      fc.property(
        fc.integer({ min: 0, max: 999999999999999 }), // wallTime (up to 15 digits)
        fc.integer({ min: 0, max: 999999 }),          // counter (within 7-digit padding)
        fc.string({ minLength: 1, maxLength: 20 }), // nodeId
        (wallTime, counter, nodeIdRaw) => {
          // Ensure nodeId doesn't contain underscores to avoid splitting issues in the test
          const nodeId = nodeIdRaw.replace(/_/g, '-') || 'node-default'
          const hlc = new HLC('node-local')
          const remote = HLC.toString({ wallTime, counter, nodeId })
          const local = hlc.receive(remote)
          
          expect(HLC.compare(local, remote)).toBeGreaterThanOrEqual(0)
          
          const localParsed = HLC.fromString(local)
          expect(localParsed.wallTime).toBeGreaterThanOrEqual(wallTime)
        }
      )
    )
  })

  it('handles counter overflow', () => {
    const hlc = new HLC('node-1')
    // Force a state where counter is high
    const remote = HLC.toString({ wallTime: 2000000000000, counter: 999999, nodeId: 'node-2' })
    const local = hlc.receive(remote)
    const localParsed = HLC.fromString(local)
    expect(localParsed.counter).toBe(1000000)
    expect(HLC.toString(localParsed)).toContain('_1000000_')
  })

  it('receive handles remote wallTime <, ==, > local wallTime', () => {
    const now = 1740000000000
    const hlc = new HLC('node-1')
    
    // Mock Date.now() to have predictable behavior
    const originalDateNow = Date.now
    Date.now = () => now
    
    try {
      // Initialize local state
      hlc.tick() // wallTime = now, counter = 0
      
      // Remote < Local
      const t1 = hlc.receive(HLC.toString({ wallTime: now - 1000, counter: 5, nodeId: 'node-2' }))
      const p1 = HLC.fromString(t1)
      expect(p1.wallTime).toBe(now)
      expect(p1.counter).toBe(1) // lastCounter was 0, now 1

      // Remote == Local
      const t2 = hlc.receive(HLC.toString({ wallTime: now, counter: 10, nodeId: 'node-3' }))
      const p2 = HLC.fromString(t2)
      expect(p2.wallTime).toBe(now)
      expect(p2.counter).toBe(11) // max(1, 10) + 1

      // Remote > Local
      const t3 = hlc.receive(HLC.toString({ wallTime: now + 1000, counter: 50, nodeId: 'node-4' }))
      const p3 = HLC.fromString(t3)
      expect(p3.wallTime).toBe(now + 1000)
      expect(p3.counter).toBe(51) // remote.counter + 1
    } finally {
      Date.now = originalDateNow
    }
  })

  it('fromString throws on invalid format', () => {
    expect(() => HLC.fromString('invalid')).toThrow('Invalid HLC timestamp')
    expect(() => HLC.fromString('1_2_3_4')).toThrow('Invalid HLC timestamp')
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

  it('filters out completed and deleted tasks', () => {
    const tasks = [
      { id: '1', title: 'Task 1', duration_minutes: 10, is_completed: true, hlc_timestamp: 'x' } as any,
      { id: '2', title: 'Task 2', duration_minutes: 10, is_completed: false, deleted_at: '2023-01-01T00:00:00Z', hlc_timestamp: 'x' } as any,
    ]
    const fitting = findFittingTasks(tasks, 15)
    expect(fitting).toHaveLength(0)
  })

  it('sorts by due_at then duration', () => {
    const tasks = [
      { id: '1', title: 'Task 1', duration_minutes: 10, is_completed: false, hlc_timestamp: 'x' } as any,
      { id: '2', title: 'Task 2', duration_minutes: 20, is_completed: false, hlc_timestamp: 'x', due_at: '2026-01-01T12:00:00Z' } as any,
      { id: '3', title: 'Task 3', duration_minutes: 5, is_completed: false, hlc_timestamp: 'x', due_at: '2026-01-01T10:00:00Z' } as any,
    ]
    const fitting = findFittingTasks(tasks, 30)
    expect(fitting[0].id).toBe('3') // earliest due_at
    expect(fitting[1].id).toBe('2') // next due_at
    expect(fitting[2].id).toBe('1') // no due_at
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

  it('handles quiet hours start == end', () => {
    const user = { 
      quiet_hours_start: '08:00', 
      quiet_hours_end: '08:00', 
      timezone: 'UTC' 
    } as any
    
    const timeAt = DateTime.fromFormat('08:00', 'HH:mm', { zone: 'UTC' })
    const timeOther = DateTime.fromFormat('09:00', 'HH:mm', { zone: 'UTC' })
    
    expect(isInQuietHours(user, timeAt)).toBe(true)
    expect(isInQuietHours(user, timeOther)).toBe(false)
  })

  it('handles task exactly at quiet hours boundary', () => {
    const user = { 
      quiet_hours_start: '22:00', 
      quiet_hours_end: '08:00', 
      timezone: 'UTC' 
    } as any
    
    const startBoundary = DateTime.fromFormat('22:00', 'HH:mm', { zone: 'UTC' })
    const endBoundary = DateTime.fromFormat('08:00', 'HH:mm', { zone: 'UTC' })
    
    expect(isInQuietHours(user, startBoundary)).toBe(true)
    expect(isInQuietHours(user, endBoundary)).toBe(true)
  })

  it('uses current time if not provided', () => {
    const user = { 
      quiet_hours_start: '00:00', 
      quiet_hours_end: '23:59', 
      timezone: 'UTC' 
    } as any
    // This will use Date.now()
    expect(isInQuietHours(user)).toBe(true)
  })
})
