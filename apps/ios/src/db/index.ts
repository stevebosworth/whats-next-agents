import { Database } from '@nozbe/watermelondb'
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite'

import { schema } from './schema.js'
import Task from './models/Task.js'

const adapter = new SQLiteAdapter({
  schema,
  // (Optional) Database name
  dbName: 'WhatsNextDB',
  // (Recommended) JavaScript core performs much better with this
  jsi: true,
  onSetUpError: error => {
    // Database failed to load -- provide the UI for this
    console.error('Database failed to set up', error)
  }
})

export const database = new Database({
  adapter,
  modelClasses: [Task],
})
