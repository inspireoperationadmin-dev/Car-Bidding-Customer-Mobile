import React, {useState, useRef, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute, RouteProp} from '@react-navigation/native';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

import {registerUser, sendOtp} from '../store/slices/authSlice';
import {useAppDispatch} from '../store/hooks';
import {theme} from '../theme';
import type {AuthStackParamList} from '../navigation/types';

const OTP_LENGTH = 6;
const COOLDOWN_SECONDS = 60;

const OtpVerificationScreen: React.FC = () => {
  const route = useRoute<RouteProp<AuthStackParamList, 'OtpVerification'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<AuthStackParamList, 'OtpVerification'>>();
  const dispatch = useAppDispatch();

  const {formData, otp: initialOtp, email} = route.params;

  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array(OTP_LENGTH).fill(''),
  );
  const [currentOtp, setCurrentOtp] = useState(initialOtp);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(COOLDOWN_SECONDS);
  const [canResend, setCanResend] = useState(false);
  const [resendCount, setResendCount] = useState(0);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  /* ---------- COOLDOWN TIMER ---------- */
  useEffect(() => {
    setCooldown(COOLDOWN_SECONDS);
    setCanResend(false);

    const interval = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [resendCount]);

  /* ---------- VERIFY ---------- */
  const handleVerify = useCallback(
    async (code?: string) => {
      const enteredCode = code || otpDigits.join('');

      if (enteredCode.length !== OTP_LENGTH) {
        setError('Please enter the complete 6-digit code');
        return;
      }

      if (enteredCode !== currentOtp) {
        setError('Invalid verification code. Please try again.');
        return;
      }

      setLoading(true);
      setError('');

      try {
        await dispatch(
          registerUser({
            ...formData,
            otp: enteredCode,
          }),
        ).unwrap();
        // AppNavigator auto-switches to AppStack when isAuthenticated becomes true
      } catch (err: any) {
        setError(err || 'Registration failed. Please try again.');
      } finally {
        setLoading(false);
      }
    },
    [otpDigits, currentOtp, dispatch, formData],
  );

  /* ---------- DIGIT INPUT ---------- */
  const handleDigitChange = useCallback(
    (text: string, index: number) => {
      const digit = text.replace(/[^0-9]/g, '').slice(-1);

      const newDigits = [...otpDigits];
      newDigits[index] = digit;
      setOtpDigits(newDigits);
      setError('');

      if (digit && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }

      // Auto-submit when last digit filled
      if (digit && index === OTP_LENGTH - 1) {
        const fullCode = newDigits.join('');
        if (fullCode.length === OTP_LENGTH) {
          handleVerify(fullCode);
        }
      }
    },
    [otpDigits, handleVerify],
  );

  const handleKeyPress = useCallback(
    (e: any, index: number) => {
      if (e.nativeEvent.key === 'Backspace' && !otpDigits[index] && index > 0) {
        inputRefs.current[index - 1]?.focus();
        const newDigits = [...otpDigits];
        newDigits[index - 1] = '';
        setOtpDigits(newDigits);
      }
    },
    [otpDigits],
  );

  /* ---------- RESEND ---------- */
  const handleResend = useCallback(async () => {
    if (!canResend || resending) return;

    setResending(true);
    setError('');

    try {
      const result = await dispatch(
        sendOtp({email: formData.email}),
      ).unwrap();

      setCurrentOtp(result.otp);
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setResendCount(prev => prev + 1);
    } catch (err: any) {
      setError(err || 'Failed to resend code');
    } finally {
      setResending(false);
    }
  }, [canResend, resending, dispatch, formData.email]);

  /* ---------- UI ---------- */
  return (
    <LinearGradient colors={theme.gradients.header} style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.gradHeaderStart}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          <View style={styles.content}>
            {/* BACK BUTTON */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.backButton}>
              <Icon name="arrow-left" size={24} color={theme.colors.title} />
            </TouchableOpacity>

            {/* ICON */}
            <View style={styles.iconCircle}>
              <Icon name="mail" size={36} color={theme.colors.primary} />
            </View>

            {/* TITLE */}
            <Text style={styles.title}>Verify Your Email</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit code to
            </Text>
            <Text style={styles.emailText}>{email}</Text>

            {/* OTP CARD */}
            <View style={styles.card}>
              {/* ERROR */}
              {error ? (
                <View style={styles.errorBox}>
                  <Icon
                    name="alert-triangle"
                    size={14}
                    color={theme.colors.error}
                  />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* OTP INPUTS */}
              <View style={styles.otpContainer}>
                {otpDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={ref => {
                      inputRefs.current[index] = ref;
                    }}
                    style={[
                      styles.otpInput,
                      digit ? styles.otpInputFilled : null,
                      error ? styles.otpInputError : null,
                    ]}
                    value={digit}
                    onChangeText={text => handleDigitChange(text, index)}
                    onKeyPress={e => handleKeyPress(e, index)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    editable={!loading}
                  />
                ))}
              </View>

              {/* VERIFY BUTTON */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => handleVerify()}
                disabled={loading}
                style={styles.buttonShadow}>
                <LinearGradient
                  colors={theme.gradients.primaryButton}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 0}}
                  style={styles.gradientButton}>
                  {loading ? (
                    <ActivityIndicator color={theme.colors.white} />
                  ) : (
                    <Text style={styles.buttonText}>
                      Verify & Create Account
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* RESEND SECTION */}
            <View style={styles.resendSection}>
              <Text style={styles.resendLabel}>Didn't receive the code?</Text>
              {resending ? (
                <ActivityIndicator
                  size="small"
                  color={theme.colors.primary}
                  style={{marginTop: 8}}
                />
              ) : canResend ? (
                <TouchableOpacity onPress={handleResend} style={styles.resendBtn}>
                  <Icon
                    name="refresh-cw"
                    size={14}
                    color={theme.colors.primary}
                    style={{marginRight: 6}}
                  />
                  <Text style={styles.resendBtnText}>Resend Code</Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.cooldownText}>
                  Resend in {cooldown}s
                </Text>
              )}
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default OtpVerificationScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 24,
    top: 24,
    padding: 8,
  },

  /* ICON */
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: theme.colors.primaryTint10Legacy,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  /* TITLE */
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: theme.colors.title,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  emailText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 24,
  },

  /* CARD */
  card: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },

  /* ERROR */
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorSoft,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: theme.colors.error,
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },

  /* OTP INPUTS */
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: theme.colors.borderLight,
    backgroundColor: theme.colors.surfaceSoft,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.text,
  },
  otpInputFilled: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.primaryTint06Legacy,
  },
  otpInputError: {
    borderColor: theme.colors.error,
  },

  /* BUTTON */
  buttonShadow: {
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  gradientButton: {
    height: 54,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },

  /* RESEND */
  resendSection: {
    alignItems: 'center',
    marginTop: 28,
  },
  resendLabel: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  resendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  resendBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  cooldownText: {
    fontSize: 14,
    color: theme.colors.mutedText,
    marginTop: 8,
  },
});

