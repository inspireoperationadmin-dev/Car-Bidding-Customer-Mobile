import React, { useState, forwardRef } from 'react';
import {
  TextInput,
  View,
  Text,
  StyleSheet,
  TextInputProps,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { theme } from '../theme';

export interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
}

const Input = forwardRef<TextInput, InputProps>(
  (
    {
      label,
      error,
      style,
      containerStyle,
      multiline,
      onFocus,
      onBlur,
      ...props
    },
    ref,
  ) => {
    const [isFocused, setIsFocused] = useState(false);

    // Separate layout/wrapper styles from text styles
    const flattenedStyle = (StyleSheet.flatten(style) || {}) as Record<string, any>;
    const {
      height,
      minHeight,
      maxHeight,
      marginTop,
      marginBottom,
      marginVertical,
      marginHorizontal,
      marginLeft,
      marginRight,
      flex,
      width,
      alignSelf,
      ...textInputStyle
    } = flattenedStyle;

    const wrapperLayoutStyle: ViewStyle = {
      ...(height !== undefined && { height }),
      ...(minHeight !== undefined && { minHeight }),
      ...(maxHeight !== undefined && { maxHeight }),
      ...(marginTop !== undefined && { marginTop }),
      ...(marginBottom !== undefined && { marginBottom }),
      ...(marginVertical !== undefined && { marginVertical }),
      ...(marginHorizontal !== undefined && { marginHorizontal }),
      ...(marginLeft !== undefined && { marginLeft }),
      ...(marginRight !== undefined && { marginRight }),
      ...(flex !== undefined && { flex }),
      ...(width !== undefined && { width }),
      ...(alignSelf !== undefined && { alignSelf }),
    };

    return (
      <View style={[styles.container, containerStyle]}>
        {label && <Text style={styles.label}>{label}</Text>}

        <View
          style={[
            styles.inputWrapper,
            multiline && styles.inputWrapperMultiline,
            isFocused && styles.inputWrapperFocused,
            error ? styles.inputWrapperError : null,
            wrapperLayoutStyle,
          ]}>
          <TextInput
            ref={ref}
            multiline={multiline}
            placeholderTextColor={theme.colors.mutedText}
            underlineColorAndroid="transparent"
            selectionColor={theme.colors.primary}
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              multiline && styles.inputMultiline,
              textInputStyle,
            ]}
            {...props}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </View>
    );
  },
);

Input.displayName = 'Input';

export default Input;

const styles = StyleSheet.create({
  container: {
    marginBottom: theme.spacing.lg,
  },

  label: {
    marginBottom: theme.spacing.xs,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },

  inputWrapper: {
    borderWidth: 1.2,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 16,
    minHeight: 52,
    justifyContent: 'center',
  },

  inputWrapperMultiline: {
    minHeight: 110,
    paddingVertical: 12,
    justifyContent: 'flex-start',
  },

  inputWrapperFocused: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.surface,
  },

  inputWrapperError: {
    borderColor: theme.colors.error,
    backgroundColor: theme.colors.errorSoft,
  },

  input: {
    fontSize: theme.fontSizes.md,
    color: theme.colors.text,
    backgroundColor: 'transparent',
    paddingVertical: Platform.OS === 'android' ? 6 : 8,
    paddingHorizontal: 0,
    margin: 0,
  },

  inputMultiline: {
    textAlignVertical: 'top',
    height: '100%',
  },

  error: {
    color: theme.colors.error,
    marginTop: theme.spacing.xs,
    fontSize: theme.fontSizes.sm,
    fontWeight: '500',
  },
});
