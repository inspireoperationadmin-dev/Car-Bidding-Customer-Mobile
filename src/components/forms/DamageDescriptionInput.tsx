// src/components/forms/DamageDescriptionInput.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
} from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { theme } from '../../theme';

interface DamageDescriptionInputProps {
  control: Control<any>;
  name: string;
}

export const DamageDescriptionInput: React.FC<DamageDescriptionInputProps> = ({
  control,
  name,
}) => {
  const [charCount, setCharCount] = useState(0);

  return (
    <Controller
      name={name}
      control={control}
      rules={{
        required: 'Damage description is required',
        minLength: {
          value: 50,
          message: 'Minimum 50 characters required',
        },
        maxLength: {
          value: 1000,
          message: 'Maximum 1000 characters allowed',
        },
      }}
      render={({ field, fieldState }) => (
        <View style={styles.container}>
          <Text style={styles.label}>Damage Description</Text>

          <TextInput
            value={field.value}
            onChangeText={(text) => {
              field.onChange(text);
              setCharCount(text.length);
            }}
            placeholder="Describe the car damage in detail..."
            multiline
            numberOfLines={5}
            textAlignVertical="top"
            maxLength={1000}
            style={[
              styles.input,
              fieldState.error && styles.inputError,
            ]}
          />

          <View style={styles.footer}>
            <Text style={styles.counter}>{charCount}/1000</Text>
          </View>

          {fieldState.error && (
            <Text style={styles.errorText}>
              {fieldState.error.message}
            </Text>
          )}
        </View>
      )}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  label: {
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    padding: theme.spacing.md,
    backgroundColor: theme.colors.card,
    minHeight: 120,
    fontSize: theme.fontSizes.md,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
  counter: {
    fontSize: theme.fontSizes.xs,
    color: theme.colors.muted,
  },
  errorText: {
    color: theme.colors.error,
    marginTop: 4,
    fontSize: theme.fontSizes.sm,
  },
});
