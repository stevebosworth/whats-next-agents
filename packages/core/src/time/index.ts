import { DateTime } from 'luxon'
import { Task, User } from '../schemas/index.js'

export const isInQuietHours = (user: User, time: DateTime = DateTime.now()): boolean => {
  const currentTime = time.setZone(user.timezone)

  const start = DateTime.fromFormat(user.quiet_hours_start, 'HH:mm', { zone: user.timezone }).set({
    year: currentTime.year,
    month: currentTime.month,
    day: currentTime.day,
  })

  let end = DateTime.fromFormat(user.quiet_hours_end, 'HH:mm', { zone: user.timezone }).set({
    year: currentTime.year,
    month: currentTime.month,
    day: currentTime.day,
  })

  if (start > end) {
    // Quiet hours cross midnight (e.g., 22:00 to 08:00)
    if (currentTime >= start) {
      return true
    }
    if (currentTime <= end) {
      return true
    }
    return false
  }

  return currentTime >= start && currentTime <= end
}

export const findFittingTasks = (tasks: Task[], availableMinutes: number): Task[] => {
  return tasks
    .filter(task => !task.is_completed && !task.deleted_at && task.duration_minutes <= availableMinutes)
    .sort((a, b) => {
      // Sort by due date (nearest first), then by duration (longest first to fill gap)
      if (a.due_at && b.due_at) {
        return DateTime.fromISO(a.due_at).diff(DateTime.fromISO(b.due_at)).as('milliseconds')
      }
      if (a.due_at) return -1
      if (b.due_at) return 1
      return b.duration_minutes - a.duration_minutes
    })
}
