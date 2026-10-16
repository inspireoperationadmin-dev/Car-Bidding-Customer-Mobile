import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { theme } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean; 
}

const Button: React.FC<ButtonProps> = ({ title, onPress, loading = false, disabled = false }) => {
  const isDisabled = loading || disabled;

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabledButton]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? <ActivityIndicator color={theme.colors.white} /> : <Text style={styles.text}>{title}</Text>}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  button: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius,
    alignItems: 'center',
    marginTop: theme.spacing.md,
  },
  disabledButton: {
    opacity: 0.6,
  },
  text: { color: theme.colors.white, fontSize: theme.fontSizes.md, fontWeight: 'bold' },
});
