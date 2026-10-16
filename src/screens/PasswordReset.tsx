// src/screens/PasswordReset.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '../api/apiClient';
import { useNavigation } from '@react-navigation/native';
import {theme} from '../theme';

/* ---------------- ZOD SCHEMAS ---------------- */

const requestSchema = z.object({
  email: z.string().email('Invalid email address'),
});

const resetSchema = z
  .object({
    token: z.string().min(10, 'Invalid token'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RequestForm = z.infer<typeof requestSchema>;
type ResetForm = z.infer<typeof resetSchema>;

/* ---------------- COMPONENT ---------------- */

const PasswordReset: React.FC = () => {
  const navigation = useNavigation<any>();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [apiError, setApiError] = useState('');

  /* -------- Step 1 Form -------- */
  const {
    control: requestControl,
    handleSubmit: handleRequestSubmit,
    formState: { errors: requestErrors },
  } = useForm<RequestForm>({
    resolver: zodResolver(requestSchema),
  });

  /* -------- Step 2 Form -------- */
  const {
    control: resetControl,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetForm>({
    resolver: zodResolver(resetSchema),
  });

  /* ---------------- HANDLERS ---------------- */

  const requestReset = async (data: RequestForm) => {
    setLoading(true);
    setApiError('');
    setSuccessMsg('');

    try {
      await apiClient.post('/api/auth/password-reset', data);
      setSuccessMsg('Password reset link sent to your email');
      setStep(2);
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Failed to request password reset'
      );
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (data: ResetForm) => {
    setLoading(true);
    setApiError('');

    try {
      await apiClient.post(
        `/api/auth/reset-password/${data.token}`,
        { newPassword: data.password, password: data.password }
      );

      setSuccessMsg('Password reset successful');
      navigation.navigate('Login');
    } catch (err: any) {
      setApiError(
        err.response?.data?.message || 'Password reset failed'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? 'Reset Password' : 'Set New Password'}
        </Text>

        {apiError ? <Text style={styles.error}>{apiError}</Text> : null}
        {successMsg ? <Text style={styles.success}>{successMsg}</Text> : null}

        {step === 1 && (
          <>
            <Controller
              control={requestControl}
              name="email"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {requestErrors.email && (
              <Text style={styles.error}>
                {requestErrors.email.message}
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleRequestSubmit(requestReset)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {step === 2 && (
          <>
            <Controller
              control={resetControl}
              name="token"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Reset Token"
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {resetErrors.token && (
              <Text style={styles.error}>
                {resetErrors.token.message}
              </Text>
            )}

            <Controller
              control={resetControl}
              name="password"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {resetErrors.password && (
              <Text style={styles.error}>
                {resetErrors.password.message}
              </Text>
            )}

            <Controller
              control={resetControl}
              name="confirmPassword"
              render={({ field: { value, onChange } }) => (
                <TextInput
                  style={styles.input}
                  placeholder="Confirm Password"
                  secureTextEntry
                  value={value}
                  onChangeText={onChange}
                />
              )}
            />
            {resetErrors.confirmPassword && (
              <Text style={styles.error}>
                {resetErrors.confirmPassword.message}
              </Text>
            )}

            <TouchableOpacity
              style={styles.button}
              onPress={handleResetSubmit(resetPassword)}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

export default PasswordReset;

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.white,
  },
  content: {
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.borderMuted,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  button: {
    backgroundColor: theme.colors.azure,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: theme.colors.white,
    fontWeight: 'bold',
  },
  error: {
    color: theme.colors.error,
    marginBottom: 8,
    textAlign: 'center',
  },
  success: {
    color: theme.colors.successStrong,
    marginBottom: 12,
    textAlign: 'center',
  },
});
/* ---------------- STYLES ---------------- */
