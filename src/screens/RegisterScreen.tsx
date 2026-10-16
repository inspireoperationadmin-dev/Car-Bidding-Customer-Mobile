import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation} from '@react-navigation/native';

// --- Imports ---
import {registerSchema, RegisterFormInputs} from '../utils/validation';
import {sendOtp} from '../store/slices/authSlice';
import {useAppDispatch} from '../store/hooks';
import {theme} from '../theme';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {AuthStackParamList} from '../navigation/types';
import {LabeledIconInputProps} from '../types/components';

// ---------------------------------------------------------
// REUSABLE CUSTOM INPUT COMPONENT (Same as Login)
// ---------------------------------------------------------
const CustomInput: React.FC<LabeledIconInputProps> = ({
  label,
  iconName,
  error,
  isPassword,
  style,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.inputContainer, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.primary
              : theme.colors.border,
            backgroundColor: isFocused ? theme.colors.infoSoft : theme.colors.surfaceSoft,
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}>
        <Icon
          name={iconName}
          size={18}
          color={isFocused ? theme.colors.primary : theme.colors.muted}
          style={styles.inputIcon}
        />
        <TextInput
          style={styles.textInput}
          placeholderTextColor={theme.colors.mutedText}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          {...props}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye' : 'eye-off'}
              size={18}
              color={theme.colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

// ---------------------------------------------------------
// REGISTER SCREEN
// ---------------------------------------------------------
const RegisterScreen: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList>>();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormInputs) => {
    setLoading(true);
    setApiError('');

    try {
      const result = await dispatch(
        sendOtp({email: data.email}),
      ).unwrap();

      navigation.navigate('OtpVerification', {
        formData: data,
        otp: result.otp,
        email: data.email.trim().toLowerCase(),
      });
    } catch (err: any) {
      setApiError(err || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={theme.gradients.header}
      style={styles.mainContainer}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={theme.colors.gradHeaderStart}
      />

      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.headerContainer}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}>
                <Icon name="arrow-left" size={24} color={theme.colors.title} />
              </TouchableOpacity>
              <Text style={styles.pageTitle}>Create Account</Text>
              <Text style={styles.pageSubtitle}>Sign up to start bidding</Text>
            </View>

            {/* FLOATING WHITE CARD */}
            <View style={styles.card}>
              {apiError ? (
                <View style={styles.apiErrorBox}>
                  <Icon
                    name="alert-triangle"
                    size={16}
                    color={theme.colors.error}
                  />
                  <Text style={styles.apiErrorText}>{apiError}</Text>
                </View>
              ) : null}

              {/* Row for First Name & Last Name */}
              <View style={styles.row}>
                <View style={[styles.halfInput, {marginRight: 8}]}>
                  <Controller
                    control={control}
                    name="firstName"
                    render={({field: {value, onChange}}) => (
                      <CustomInput
                        label="First Name"
                        iconName="user"
                        placeholder="John"
                        value={value}
                        onChangeText={onChange}
                        error={errors.firstName?.message}
                      />
                    )}
                  />
                </View>
                <View style={[styles.halfInput, {marginLeft: 8}]}>
                  <Controller
                    control={control}
                    name="lastName"
                    render={({field: {value, onChange}}) => (
                      <CustomInput
                        label="Last Name"
                        iconName="user"
                        placeholder="Doe"
                        value={value}
                        onChangeText={onChange}
                        error={errors.lastName?.message}
                      />
                    )}
                  />
                </View>
              </View>

              <Controller
                control={control}
                name="email"
                render={({field: {value, onChange}}) => (
                  <CustomInput
                    label="Email"
                    iconName="mail"
                    placeholder="john.doe@example.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                render={({field: {value, onChange}}) => (
                  <CustomInput
                    label="Password"
                    iconName="lock"
                    isPassword
                    placeholder="Create a password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />

              <Controller
                control={control}
                name="confirmPassword"
                render={({field: {value, onChange}}) => (
                  <CustomInput
                    label="Confirm Password"
                    iconName="check-circle"
                    isPassword
                    placeholder="Re-enter password"
                    value={value}
                    onChangeText={onChange}
                    error={errors.confirmPassword?.message}
                  />
                )}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
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
                  <Text style={styles.buttonText}>Continue</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {/* Bottom Login Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.loginLink}>Login Here</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  headerContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 0,
    padding: 8,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.title,
    marginBottom: 4,
  },
  pageSubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  // --- CARD STYLE ---
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  // ------------------
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 1,
  },
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorSoft,
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  apiErrorText: {
    color: theme.colors.error,
    marginLeft: 8,
    fontSize: 13,
    flex: 1,
  },
  // Custom Input Styles
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
    height: '100%',
  },
  errorText: {
    fontSize: 11,
    color: theme.colors.error,
    marginTop: 4,
    marginLeft: 4,
  },
  // Button Styles
  buttonShadow: {
    marginTop: 20,
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
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.white,
    letterSpacing: 0.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 20,
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.slateText,
  },
  loginLink: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.title,
    textDecorationLine: 'underline',
  },
});

