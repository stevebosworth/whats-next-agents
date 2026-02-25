import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TextInput, StyleSheet } from 'react-native';
import { database } from './db/index.js';
import TaskModel from './db/models/Task.js';
import { Task, parseTaskString, HLC, findFittingTasks, isInQuietHours, User } from '@packages/core';
import { TaskCard, Button, theme } from '@packages/ui';
import withObservables from '@nozbe/with-observables';

const MOCK_USER: User = {
  id: '00000000-0000-0000-0000-000000000000',
  email: 'test@example.com',
  name: 'Steve',
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  timezone: 'UTC',
};

const TaskList = ({ tasks, availableTime }: { tasks: TaskModel[], availableTime: number | null }) => {
  // Convert WatermelonDB models to plain Task objects for the shared UI component
  const plainTasks: Task[] = tasks.map(t => ({
    id: t.id,
    title: t.title,
    duration_minutes: t.durationMinutes,
    due_at: t.dueAt,
    timezone: t.timezone,
    task_type: t.taskType as any,
    is_completed: t.isCompleted,
    tags: JSON.parse(t.tags || '[]'),
    hlc_timestamp: t.hlcTimestamp,
    created_at: new Date(t.createdAt).toISOString(),
    updated_at: new Date(t.updatedAt).toISOString(),
    timezone_mode: t.timezoneMode as any,
  }));

  const filteredTasks = availableTime 
    ? findFittingTasks(plainTasks, availableTime)
    : plainTasks;

  return (
    <View style={styles.list}>
      {filteredTasks.map(task => (
        <TaskCard key={task.id} task={task} />
      ))}
    </View>
  );
};

const EnhancedTaskList = withObservables([], () => ({
  tasks: database.get<TaskModel>('tasks').query().observe(),
}))(TaskList);

export default function App() {
  const [inputText, setInputText] = useState('');
  const [availableTime, setAvailableTime] = useState<number | null>(null);
  const [hlc] = useState(new HLC('ios-client'));

  const handleAddTask = async () => {
    if (!inputText.trim()) return;

    const parsed = parseTaskString(inputText, MOCK_USER.timezone);
    
    await database.write(async () => {
      await database.get<TaskModel>('tasks').create(task => {
        task.title = parsed.title;
        task.durationMinutes = parsed.duration_minutes;
        task.dueAt = parsed.due_at || undefined;
        task.timezone = parsed.timezone;
        task.taskType = 'admin';
        task.isCompleted = false;
        task.tags = '[]';
        task.hlcTimestamp = hlc.tick();
        task.timezoneMode = 'floating';
      });
    });

    setInputText('');
  };

  const isQuiet = isInQuietHours(MOCK_USER);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.welcome}>Hi, {MOCK_USER.name}</Text>
          <Text style={styles.title}>What's Next?</Text>
          {isQuiet && <Text style={styles.quietBadge}>Quiet Hours Active</Text>}
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Add a task..."
            value={inputText}
            onChangeText={setInputText}
          />
          <Button title="Add" onPress={handleAddTask} />
        </View>

        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>I have:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[15, 30, 45, 60].map(mins => (
              <Button
                key={mins}
                title={`${mins}m`}
                variant={availableTime === mins ? 'primary' : 'secondary'}
                onPress={() => setAvailableTime(availableTime === mins ? null : mins)}
              />
            ))}
          </ScrollView>
        </View>

        <EnhancedTaskList availableTime={availableTime} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    padding: theme.spacing.lg,
  },
  header: {
    marginBottom: theme.spacing.xl,
  },
  welcome: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.gray,
  },
  title: {
    fontSize: theme.fontSizes.xl,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  quietBadge: {
    marginTop: theme.spacing.xs,
    color: theme.colors.secondary,
    fontWeight: 'bold',
  },
  inputContainer: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.lightGray,
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
  },
  filterContainer: {
    marginBottom: theme.spacing.lg,
  },
  filterLabel: {
    marginBottom: theme.spacing.sm,
    fontWeight: 'bold',
  },
  list: {
    gap: theme.spacing.md,
  },
});
