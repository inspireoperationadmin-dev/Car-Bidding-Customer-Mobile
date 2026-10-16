// src/components/forms/CarDetailsForm.tsx
import React from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { z } from 'zod';
import { theme } from '../../theme';

/* =======================
   Zod Validation Schema
======================= */
export const carDetailsSchema = z.object({
  carBrand: z.string().min(1, 'Brand required'),
  carModel: z.string().min(1, 'Model required'),
  carYear: z.string().regex(/^\d{4}$/, 'Invalid year'),
  vin: z.string().length(17, 'VIN must be 17 characters').optional().or(z.literal('')),
  transmission: z.enum(['Automatic', 'Manual']),
});

export type CarDetailsFormValues = z.infer<typeof carDetailsSchema>;

/* =======================
   Props
======================= */
interface Props {
  control: Control<CarDetailsFormValues>;
  errors: FieldErrors<CarDetailsFormValues>;
}

/* =======================
   Helper: Years list
======================= */
const years = Array.from({ length: 2025 - 1900 + 1 }, (_, i) =>
  String(2025 - i)
);

/* =======================
   Component
======================= */
const CarDetailsForm: React.FC<Props> = ({ control, errors }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Car Details</Text>

      {/* Brand */}
      <Controller
        control={control}
        name="carBrand"
        render={({ field: { value, onChange } }) => (
          <>
            <TextInput
              style={[styles.input, errors.carBrand && styles.inputError]}
              placeholder="Car Brand (e.g. Toyota)"
              value={value}
              onChangeText={onChange}
            />
            {errors.carBrand && (
              <Text style={styles.errorText}>{errors.carBrand.message}</Text>
            )}
          </>
        )}
      />

      {/* Model */}
      <Controller
        control={control}
        name="carModel"
        render={({ field: { value, onChange } }) => (
          <>
            <TextInput
              style={[styles.input, errors.carModel && styles.inputError]}
              placeholder="Car Model (e.g. Corolla)"
              value={value}
              onChangeText={onChange}
            />
            {errors.carModel && (
              <Text style={styles.errorText}>{errors.carModel.message}</Text>
            )}
          </>
        )}
      />

      {/* Year */}
      <Controller
        control={control}
        name="carYear"
        render={({ field: { value, onChange } }) => (
          <>
            <View
              style={[
                styles.pickerWrapper,
                errors.carYear && styles.inputError,
              ]}
            >
              <Picker selectedValue={value} onValueChange={onChange}>
                <Picker.Item label="Select Year" value="" />
                {years.map(year => (
                  <Picker.Item key={year} label={year} value={year} />
                ))}
              </Picker>
            </View>
            {errors.carYear && (
              <Text style={styles.errorText}>{errors.carYear.message}</Text>
            )}
          </>
        )}
      />

      {/* Transmission */}
      <Controller
        control={control}
        name="transmission"
        render={({ field: { value, onChange } }) => (
          <>
            <View
              style={[
                styles.pickerWrapper,
                errors.transmission && styles.inputError,
              ]}
            >
              <Picker selectedValue={value} onValueChange={onChange}>
                <Picker.Item label="Select Transmission" value="" />
                <Picker.Item label="Automatic" value="Automatic" />
                <Picker.Item label="Manual" value="Manual" />
              </Picker>
            </View>
            {errors.transmission && (
              <Text style={styles.errorText}>
                {errors.transmission.message}
              </Text>
            )}
          </>
        )}
      />

      {/* VIN (Optional) */}
      <Controller
        control={control}
        name="vin"
        render={({ field: { value, onChange } }) => (
          <>
            <TextInput
              style={[styles.input, errors.vin && styles.inputError]}
              placeholder="VIN (optional)"
              value={value}
              onChangeText={onChange}
              maxLength={17}
              autoCapitalize="characters"
            />
            {errors.vin && (
              <Text style={styles.errorText}>{errors.vin.message}</Text>
            )}
          </>
        )}
      />
    </View>
  );
};

export default CarDetailsForm;

/* =======================
   Styles
======================= */
const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.fontSizes.lg,
    fontWeight: 'bold',
    marginBottom: theme.spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.borderRadius,
    marginBottom: theme.spacing.sm,
    backgroundColor: theme.colors.card,
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  errorText: {
    color: theme.colors.error,
    marginBottom: theme.spacing.sm,
    fontSize: theme.fontSizes.sm,
  },
});
