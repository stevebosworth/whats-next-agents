import { Model } from '@nozbe/watermelondb'
import { field, text, date, readonly } from '@nozbe/watermelondb/decorators'

export default class Task extends Model {
  static table = 'tasks'

  @text('title') title!: string
  @text('description') description?: string
  @field('duration_minutes') durationMinutes!: number
  @text('task_type') taskType!: string
  @text('tags') tags!: string
  @field('is_completed') isCompleted!: boolean
  @text('due_at') dueAt?: string
  @text('timezone_mode') timezoneMode!: string
  @text('timezone') timezone!: string
  @text('hlc_timestamp') hlcTimestamp!: string
  
  @readonly @date('created_at') createdAt!: number
  @readonly @date('updated_at') updatedAt!: number
  @date('deleted_at') deletedAt?: number
}
