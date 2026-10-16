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
  Dimensions,
  Image,
  SafeAreaView,
} from 'react-native';
import {useForm, Controller} from 'react-hook-form';
import {zodResolver} from '@hookform/resolvers/zod';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather'; // Using Feather Icons

// --- Imports ---
import {loginSchema, LoginFormInputs} from '../utils/validation';
import {loginUser} from '../store/slices/authSlice';
import {useAppDispatch} from '../store/hooks';
import {theme} from '../theme';
import {ENV} from '../config/env';
import {LabeledIconInputProps} from '../types/components';

const {width, height} = Dimensions.get('window');

// ---------------------------------------------------------
// PROFESSIONAL CUSTOM INPUT COMPONENT
// ---------------------------------------------------------
const CustomInput: React.FC<LabeledIconInputProps> = ({
  label,
  iconName,
  error,
  isPassword,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      
      <View
        style={[
          styles.inputWrapper,
          {
            borderColor: error
              ? theme.colors.error
              : isFocused
              ? theme.colors.primary // Focus Color
              : 'transparent', // Default (No Border)
            backgroundColor: isFocused ? theme.colors.infoSoft : theme.colors.inputBackground, // Light Blue tint on focus
            borderWidth: isFocused || error ? 1.5 : 1,
          },
        ]}>
        
        {/* Left Icon */}
        <Icon
          name={iconName}
          size={20}
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

        {/* Password Eye Toggle */}
        {isPassword && (
          <TouchableOpacity 
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon
              name={showPassword ? 'eye' : 'eye-off'}
              size={20}
              color={theme.colors.muted}
            />
          </TouchableOpacity>
        )}
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Icon name="alert-circle" size={14} color={theme.colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
};
// ---------------------------------------------------------

const LoginScreen: React.FC = () => {
  const {
    control,
    handleSubmit,
    formState: {errors},
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const dispatch = useAppDispatch();
  const navigation = useNavigation<any>();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const onSubmit = async (data: LoginFormInputs) => {
    setLoading(true);
    setApiError('');
    try {
      await dispatch(loginUser(data)).unwrap();
    } catch (err: unknown) {
      if (err instanceof Error) setApiError(err.message);
      else if (typeof err === 'string') setApiError(err);
      else setApiError('Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 1. HEADER SECTION */}
      <LinearGradient
        colors={theme.gradients.header}
        style={styles.headerBackground}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.illustrationContainer}>
            <Image
              source={{ uri: ENV.loginImageUrl }}
              style={styles.illustration}
              resizeMode="contain"
            />
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* 2. FORM SECTION */}
      <View style={styles.bottomCard}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{flex: 1}}>
          
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Welcome Back!</Text>
              <Text style={styles.subtitle}>Enter your details to continue</Text>
            </View>

            {apiError ? (
              <View style={styles.apiErrorBox}>
                <Icon name="alert-triangle" size={18} color={theme.colors.error} />
                <Text style={styles.apiErrorText}>{apiError}</Text>
              </View>
            ) : null}

            <View style={styles.formContainer}>
              
              {/* Email Input (Using Custom Component) */}
              <Controller
                control={control}
                name="email"
                render={({field: {value, onChange}}) => (
                  <CustomInput
                    label="Email Address"
                    iconName="mail"
                    placeholder="example@gmail.com"
                    value={value}
                    onChangeText={onChange}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    error={errors.email?.message}
                  />
                )}
              />

              {/* Password Input (Using Custom Component) */}
              <Controller
                control={control}
                name="password"
                render={({field: {value, onChange}}) => (
                  <CustomInput
                    label="Password"
                    iconName="lock"
                    isPassword={true}
                    placeholder="••••••••"
                    value={value}
                    onChangeText={onChange}
                    error={errors.password?.message}
                  />
                )}
              />
              
              <TouchableOpacity 
                onPress={() => navigation.navigate('PasswordReset')}
                style={styles.forgotPassContainer}
              >
                <Text style={styles.forgotPassText}>Forgot Password?</Text>
              </TouchableOpacity>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
              style={styles.buttonShadow}
            >
              <LinearGradient
                colors={theme.gradients.primaryButton}
                start={{x: 0, y: 0}}
                end={{x: 1, y: 0}}
                style={styles.gradientButton}
              >
                {loading ? (
                  <ActivityIndicator color={theme.colors.white} />
                ) : (
                  <>
                    <Text style={styles.buttonText}>Login</Text>
                    <Icon name="arrow-right" size={20} color={theme.colors.white} style={{marginLeft: 8}} />
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>New to Car Bidding? </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signupText}>Create Account</Text>
              </TouchableOpacity>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.gradHeaderStart,
  },
  headerBackground: {
    height: height * 0.32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  illustrationContainer: {
    width: width * 0.7,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  illustration: {
    width: '100%',
    height: '100%',
  },
  bottomCard: {
    flex: 1,
    backgroundColor: theme.colors.card,
    marginTop: -24,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 24,
    paddingTop: 32,
    shadowColor: theme.colors.black,
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  headerTextContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.title,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: theme.colors.muted,
  },
  formContainer: {
    marginBottom: 20,
  },
  // --- CUSTOM INPUT STYLES ---
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56, // Tall professional height
    // Background handled dynamically
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    marginLeft: 4,
  },
  errorText: {
    fontSize: 12,
    color: theme.colors.error,
    marginLeft: 6,
    fontWeight: '500',
  },
  // ---------------------------
  apiErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.errorSoft,
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: theme.colors.borderDangerLight,
  },
  apiErrorText: {
    color: theme.colors.error,
    marginLeft: 10,
    fontSize: 14,
    flex: 1,
  },
  forgotPassContainer: {
    alignSelf: 'flex-end',
    marginTop: -8,
  },
  forgotPassText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.gradBtnEnd,
  },
  buttonShadow: {
    marginTop: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  gradientButton: {
    height: 58,
    borderRadius: 16,
    flexDirection: 'row',
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
  },
  footerText: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  signupText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});

