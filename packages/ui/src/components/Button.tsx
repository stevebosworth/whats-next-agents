import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { theme } from '../theme/index.js';

interface ButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'accent';
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ onPress, title, variant = 'primary', disabled = false }) => {
  const buttonStyle: ViewStyle[] = [
    styles.button,
    styles[`${variant}Button` as keyof typeof styles],
    disabled && styles.disabledButton,
  ];

  return (
    <TouchableOpacity onPress={onPress} style={buttonStyle} disabled={disabled}>
      <Text style={styles.buttonText}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: theme.colors.primary,
  },
  secondaryButton: {
    backgroundColor: theme.colors.secondary,
  },
  accentButton: {
    backgroundColor: theme.colors.accent,
  },
  disabledButton: {
    backgroundColor: theme.colors.gray,
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: theme.fontSizes.md,
    fontWeight: 'bold',
  },
});
