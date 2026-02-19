import * as chrono from 'chrono-node'
import { DateTime } from 'luxon'

export interface ParsedTask {
  title: string
  duration_minutes: number
  due_at: string | null
  timezone: string
}

export const parseDuration = (input: string): { title: string; duration: number } => {
  const durationRegex = /\((\d+)\s*(m|min|minutes|h|hr|hours)\)/i
  const match = input.match(durationRegex)

  if (match) {
    let value = parseInt(match[1], 10)
    const unit = match[2].toLowerCase()

    if (unit.startsWith('h')) {
      value *= 60
    }

    const title = input.replace(match[0], '').trim().replace(/\s+/g, ' ')
    return { title, duration: value }
  }

  return { title: input.trim(), duration: 15 } // Default to 15m if unspecified
}

export const parseTaskString = (input: string, userTimezone: string = 'UTC'): ParsedTask => {
  const { title: titleAfterDuration, duration } = parseDuration(input)
  const results = chrono.parse(titleAfterDuration, {
    forwardDate: true,
    timezone: userTimezone,
  })

  let title = titleAfterDuration
  let due_at: string | null = null

  if (results.length > 0) {
    const lastResult = results[results.length - 1]
    const date = lastResult.start.date()
    
    // We only take the date if it's explicitly mentioned
    due_at = DateTime.fromJSDate(date).setZone(userTimezone).toISO()
    
    // Remove the date string from the title
    title = titleAfterDuration.replace(lastResult.text, '').trim().replace(/\s+/g, ' ')
  }

  return {
    title,
    duration_minutes: duration,
    due_at,
    timezone: userTimezone,
  }
}
