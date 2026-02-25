import { appSchema, tableSchema } from '@nozbe/watermelondb'

export const schema = appSchema({
  version: 1,
  tables: [
    tableSchema({
      name: 'tasks',
      columns: [
        { name: 'title', type: 'string' },
        { name: 'description', type: 'string', isOptional: true },
        { name: 'duration_minutes', type: 'number' },
        { name: 'task_type', type: 'string' },
        { name: 'tags', type: 'string' }, // Stringified array
        { name: 'is_completed', type: 'boolean' },
        { name: 'due_at', type: 'string', isOptional: true },
        { name: 'timezone_mode', type: 'string' },
        { name: 'timezone', type: 'string' },
        { name: 'hlc_timestamp', type: 'string', isIndexed: true },
        { name: 'created_at', type: 'number' },
        { name: 'updated_at', type: 'number' },
        { name: 'deleted_at', type: 'number', isOptional: true },
      ],
    }),
  ],
})
