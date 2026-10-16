import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  TextInput,
  Platform,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchProfile,
  updateProfile,
  selectProfile,
  selectProfileLoading,
  selectUpdateLoading,
  selectUpdateError,
} from '../store/slices/profileSlice';
import type { SafeAreaView } from 'react-native-safe-area-context';

const PersonalInfoScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectProfileLoading);
  const updateLoading = useAppSelector(selectUpdateLoading);
  const updateError = useAppSelector(selectUpdateError);

  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNo, setPhoneNo] = useState('');
  const [address, setAddress] = useState('');
  const [preferredContactMethod, setPreferredContactMethod] = useState('');

  // Sync form with profile data
  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNo(profile.phoneNo || '');
      setAddress(profile.address || '');
      setPreferredContactMethod(profile.preferredContactMethod || '');
    }
  }, [profile]);

  // Fetch profile if not loaded
  useEffect(() => {
    if (!profile) {
      dispatch(fetchProfile());
    }
  }, [dispatch, profile]);

  const handleSave = async () => {
    const result = await dispatch(
      updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNo: phoneNo.trim(),
        address: address.trim(),
        preferredContactMethod: preferredContactMethod.trim(),
      }),
    );

    if (updateProfile.fulfilled.match(result)) {
      setIsEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } else {
      Alert.alert('Error', updateError || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    // Reset form to profile values
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
      setPhoneNo(profile.phoneNo || '');
      setAddress(profile.address || '');
      setPreferredContactMethod(profile.preferredContactMethod || '');
    }
    setIsEditing(false);
  };

  const contactMethods = ['Email', 'Phone', 'SMS'];

  const renderField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    icon: string,
    options?: {
      editable?: boolean;
      placeholder?: string;
      keyboardType?: 'default' | 'phone-pad' | 'email-address';
      multiline?: boolean;
    },
  ) => {
    const editable = options?.editable !== false && isEditing;
    return (
      <View style={styles.fieldContainer}>
        <Text style={styles.fieldLabel}>{label}</Text>
        <View
          style={[
            styles.fieldInputRow,
            editable && styles.fieldInputRowEditing,
            options?.editable === false && styles.fieldInputRowDisabled,
          ]}>
          <Icon
            name={icon}
            size={18}
            color={editable ? theme.colors.primary : theme.colors.muted}
            style={styles.fieldIcon}
          />
          <TextInput
            style={[
              styles.fieldInput,
              options?.editable === false && styles.fieldInputDisabled,
              options?.multiline && { minHeight: 60, textAlignVertical: 'top' },
            ]}
            value={value}
            onChangeText={onChangeText}
            editable={editable}
            placeholder={options?.placeholder || `Enter ${label.toLowerCase()}`}
            placeholderTextColor={theme.colors.muted}
            keyboardType={options?.keyboardType || 'default'}
            multiline={options?.multiline}
          />
        </View>
      </View>
    );
  };

  if (loading && !profile) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER */}
      <LinearGradient colors={theme.gradients.header} style={styles.header}>
        <View style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Personal Info</Text>
            {!isEditing ? (
              <TouchableOpacity onPress={() => setIsEditing(true)}>
                <Icon name="edit-2" size={20} color={theme.colors.primary} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 22 }} />
            )}
          </View>
        </View>
      </LinearGradient>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled">
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <LinearGradient
              colors={theme.gradients.primaryButton}
              style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(firstName?.[0] || 'U').toUpperCase()}
              </Text>
            </LinearGradient>
            <Text style={styles.nameText}>
              {firstName && lastName
                ? `${firstName} ${lastName}`
                : profile?.email || 'User'}
            </Text>
          </View>

          {/* FORM FIELDS */}
          <View style={styles.formCard}>
            {renderField('First Name', firstName, setFirstName, 'user', {
              placeholder: 'Enter first name',
            })}

            {renderField('Last Name', lastName, setLastName, 'user', {
              placeholder: 'Enter last name',
            })}

            {renderField('Email', profile?.email || '', () => {}, 'mail', {
              editable: false,
              keyboardType: 'email-address',
            })}

            {renderField('Phone Number', phoneNo, setPhoneNo, 'phone', {
              placeholder: 'Enter phone number',
              keyboardType: 'phone-pad',
            })}

            {renderField('Address', address, setAddress, 'map-pin', {
              placeholder: 'Enter your address',
              multiline: true,
            })}

            {/* Preferred Contact Method */}
            <View style={styles.fieldContainer}>
              <Text style={styles.fieldLabel}>Preferred Contact</Text>
              <View style={styles.contactMethodRow}>
                {contactMethods.map(method => (
                  <TouchableOpacity
                    key={method}
                    style={[
                      styles.contactMethodChip,
                      preferredContactMethod.toLowerCase() ===
                        method.toLowerCase() && styles.contactMethodChipActive,
                    ]}
                    disabled={!isEditing}
                    onPress={() => setPreferredContactMethod(method)}>
                    <Text
                      style={[
                        styles.contactMethodText,
                        preferredContactMethod.toLowerCase() ===
                          method.toLowerCase() &&
                          styles.contactMethodTextActive,
                      ]}>
                      {method}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* ACTION BUTTONS */}
          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancel}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSave}
                disabled={updateLoading}>
                <LinearGradient
                  colors={theme.gradients.primaryButton}
                  style={styles.saveButtonGradient}>
                  {updateLoading ? (
                    <ActivityIndicator size="small" color={theme.colors.white} />
                  ) : (
                    <Text style={styles.saveButtonText}>Save Changes</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default PersonalInfoScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
    marginTop: -24,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: theme.colors.white,
  },
  nameText: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  formCard: {
    backgroundColor: theme.colors.overlayWhite90,
    borderRadius: 24,
    padding: 20,
    shadowColor: theme.colors.primaryLegacy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  fieldContainer: {
    marginBottom: 18,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
    marginBottom: 6,
    marginLeft: 4,
  },
  fieldInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  fieldInputRowEditing: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.white,
  },
  fieldInputRowDisabled: {
    backgroundColor: theme.colors.neutralInputGray,
  },
  fieldIcon: {
    marginRight: 10,
  },
  fieldInput: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.text,
    padding: 0,
  },
  fieldInputDisabled: {
    color: theme.colors.muted,
  },
  contactMethodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactMethodChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: theme.colors.background,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  contactMethodChipActive: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.neutralSoftBlue,
  },
  contactMethodText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.muted,
  },
  contactMethodTextActive: {
    color: theme.colors.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: theme.colors.overlayWhite90,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: theme.colors.border,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  saveButtonGradient: {
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 16,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.white,
  },
});

