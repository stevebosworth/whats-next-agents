import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { theme } from '../theme/index.js';
import { Task } from '@packages/core';

interface TaskCardProps {
  task: Task;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const cardStyle = [
    styles.card,
    styles[`${task.task_type}Card` as keyof typeof styles],
  ];

  return (
    <View style={cardStyle}>
      <Text style={styles.title}>{task.title}</Text>
      <View style={styles.footer}>
        <Text style={styles.duration}>{task.duration_minutes}m</Text>
        {task.due_at && (
          <Text style={styles.dueAt}>{new Date(task.due_at).toLocaleTimeString()}</Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.lightGray,
    borderLeftWidth: 8,
    borderLeftColor: theme.colors.gray,
  },
  deep_workCard: {
    borderLeftColor: theme.colors.deepWork,
  },
  adminCard: {
    borderLeftColor: theme.colors.admin,
  },
  quickCard: {
    borderLeftColor: theme.colors.quick,
  },
  title: {
    fontSize: theme.fontSizes.lg,
    fontWeight: '600',
    color: theme.colors.text,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  duration: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
    fontWeight: 'bold',
  },
  dueAt: {
    fontSize: theme.fontSizes.sm,
    color: theme.colors.gray,
  },
});
