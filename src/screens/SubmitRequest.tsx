import React, { useState, useCallback, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Asset } from 'react-native-image-picker';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

import {
  submitRequestSchema,
  SubmitRequestInputs,
} from '../utils/requestValidation';
import apiClient from '../api/apiClient';
import Input from '../components/Input';
import Button from '../components/Button';
import { theme } from '../theme';
import { pickImages, takePhoto } from '../utils/imagePicker';
import { ImagePreview } from '../components/images/ImagePreview';
import MapboxAddressPicker, { AddressData } from '../components/address/MapboxAddressPicker';
import SuccessModal from '../components/common/SuccessModal';
import { useAppSelector } from '../store/hooks';

const MAX_IMAGES = 10;
const MIN_IMAGES = 3;

const SubmitRequest: React.FC<any> = ({ navigation }) => {
  const profile = useAppSelector(state => state.profile?.profile);
  const [images, setImages] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [addressData, setAddressData] = useState<AddressData>({
    address: '',
    postalCode: '',
    coordinates: undefined,
  });
  const [addressError, setAddressError] = useState('');
  const [platePhoto, setPlatePhoto] = useState<Asset | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<SubmitRequestInputs>({
    resolver: zodResolver(submitRequestSchema),
    defaultValues: {
      transmission: 'Automatic',
      preferredContactMethod: (profile?.preferredContactMethod as any) || 'Email',
    },
  });

  useEffect(() => {
    if (profile?.preferredContactMethod) {
      setValue('preferredContactMethod', profile.preferredContactMethod as any);
    }
  }, [profile?.preferredContactMethod, setValue]);

  const handleAddressChange = useCallback((data: AddressData) => {
    setAddressData(data);
    if (data.address.trim().length >= 5) {
      setAddressError('');
    }
  }, []);

  /* ---------------- NUMBER PLATE CAMERA + OCR ---------------- */
  const handleTakePlatePhoto = async () => {
    try {
      const photo = await takePhoto();
      setPlatePhoto(photo);

      if (!photo.uri) return;

      setOcrLoading(true);
      const formData = new FormData();
      formData.append('image', {
        uri: photo.uri,
        type: photo.type || 'image/jpeg',
        name: photo.fileName || 'plate.jpg',
      } as any);

      const response = await apiClient.post('/api/ocr/extract-plate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (response.data?.text) {
        setValue('numberPlate', response.data.text, { shouldValidate: true });
      }
    } catch (err: any) {
      if (err.message !== 'User cancelled camera') {
        Alert.alert('OCR Error', 'Could not extract text from image. Please enter the number plate manually.');
      }
    } finally {
      setOcrLoading(false);
    }
  };

  /* ---------------- IMAGE PICKER ---------------- */
  const handlePickImages = async () => {
    try {
      const selected = await pickImages(MAX_IMAGES - images.length);
      setImages(prev => [...prev, ...selected]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  /* ---------------- SUBMIT ---------------- */
  const onSubmit = async (data: SubmitRequestInputs) => {
    // Validate address separately
    const addressTrimmed = addressData.address.trim();
    if (!addressTrimmed || addressTrimmed.length < 5) {
      setAddressError('Address must be at least 5 characters');
      return;
    }
    setAddressError('');

    if (images.length < MIN_IMAGES) {
      setApiError(`Please upload at least ${MIN_IMAGES} images`);
      return;
    }

    setLoading(true);
    setApiError('');

    const fullLocation = addressData.postalCode.trim()
      ? `${addressTrimmed}, ${addressData.postalCode.trim()}`
      : addressTrimmed;

    try {
      const formData = new FormData();

      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, String(value));
      });

      formData.append('location', fullLocation);

      images.forEach((img, index) => {
        if (!img.uri) return;
        formData.append('images', {
          uri: img.uri,
          type: img.type || 'image/jpeg',
          name: img.fileName || `image_${index}.jpg`,
        } as any);
      });

      await apiClient.post('/api/requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      setShowSuccessModal(true);
      reset({
        transmission: 'Automatic',
        preferredContactMethod: (profile?.preferredContactMethod as any) || 'Email',
      });
      setImages([]);
      setPlatePhoto(null);
    } catch (err: any) {
      setApiError(
        err?.response?.data?.message || 'Request submission failed'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ---------------- UI ---------------- */
  return (
    <View style={styles.container}>
      {/* HEADER */}
      <LinearGradient colors={theme.gradients.header} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerRow}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Icon name="arrow-left" size={20} color={theme.colors.text} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Submit Request</Text>

            <View style={{ width: 60 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ERROR */}
          {apiError ? <Text style={styles.error}>{apiError}</Text> : null}

          {/* FORM CARD */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Car Details</Text>

            <Controller
              control={control}
              name="carBrand"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Car Brand"
                  error={errors.carBrand?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="carModel"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Car Model"
                  error={errors.carModel?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="carYear"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Car Year (YYYY)"
                  error={errors.carYear?.message}
                />
              )}
            />

            <Text style={styles.inputLabel}>Transmission *</Text>
            <Controller
              control={control}
              name="transmission"
              render={({ field }) => (
                <View style={styles.selectorRow}>
                  {(['Automatic', 'Manual'] as const).map(type => {
                    const isSelected = (field.value || 'Automatic') === type;
                    return (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.selectorBtn,
                          isSelected && styles.selectorBtnActive,
                        ]}
                        onPress={() => field.onChange(type)}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={type === 'Automatic' ? 'cpu' : 'sliders'}
                          size={16}
                          color={isSelected ? '#FFFFFF' : theme.colors.primary}
                          style={{ marginRight: 8 }}
                        />
                        <Text
                          style={[
                            styles.selectorBtnText,
                            isSelected && styles.selectorBtnTextActive,
                          ]}
                        >
                          {type}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />

            <Controller
              control={control}
              name="vin"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={val => field.onChange(val.toUpperCase())}
                  placeholder="VIN (17 characters, optional)"
                  maxLength={17}
                  autoCapitalize="characters"
                />
              )}
            />
          </View>

          {/* NUMBER PLATE */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Number Plate *</Text>

            <Controller
              control={control}
              name="numberPlate"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Enter number plate (e.g. AB-123-CD)"
                  error={errors.numberPlate?.message}
                />
              )}
            />

            {platePhoto?.uri && (
              <Image
                source={{ uri: platePhoto.uri }}
                style={styles.platePreview}
                resizeMode="cover"
              />
            )}

            <TouchableOpacity
              style={styles.imageBtn}
              onPress={handleTakePlatePhoto}
              activeOpacity={0.8}
              disabled={ocrLoading}
            >
              {ocrLoading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} style={{ marginRight: 8 }} />
              ) : (
                <Icon
                  name="camera"
                  size={18}
                  color={theme.colors.primary}
                  style={{ marginRight: 8 }}
                />
              )}
              <Text style={styles.imageBtnText}>
                {ocrLoading ? 'Extracting...' : 'Take Photo of Number Plate'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* PREFERRED CONTACT METHOD */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Preferred Contact Method *</Text>
            <Text style={styles.sectionSubtitle}>
              Select how mechanics and the platform should contact you about bids and updates.
            </Text>

            <Controller
              control={control}
              name="preferredContactMethod"
              render={({ field }) => (
                <View style={styles.selectorRow}>
                  {(['Email', 'Phone', 'SMS'] as const).map(method => {
                    const isSelected = (field.value || 'Email') === method;
                    const iconName =
                      method === 'Email' ? 'mail' : method === 'Phone' ? 'phone' : 'message-square';
                    return (
                      <TouchableOpacity
                        key={method}
                        style={[
                          styles.selectorBtn,
                          isSelected && styles.selectorBtnActive,
                        ]}
                        onPress={() => field.onChange(method)}
                        activeOpacity={0.8}
                      >
                        <Icon
                          name={iconName}
                          size={16}
                          color={isSelected ? '#FFFFFF' : theme.colors.primary}
                          style={{ marginRight: 6 }}
                        />
                        <Text
                          style={[
                            styles.selectorBtnText,
                            isSelected && styles.selectorBtnTextActive,
                          ]}
                        >
                          {method}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* LOCATION WITH MAP */}
          <View style={styles.addressSection}>
            <MapboxAddressPicker
              value={addressData}
              onChange={handleAddressChange}
              disabled={loading}
            />
            {!!addressError && (
              <View style={styles.addressErrorBox}>
                <Icon name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.addressErrorText}>{addressError}</Text>
              </View>
            )}
          </View>

          {/* DESCRIPTION */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Damage Description</Text>

            <Controller
              control={control}
              name="description"
              render={({ field }) => (
                <Input
                  value={field.value}
                  onChangeText={field.onChange}
                  placeholder="Describe the damage in detail"
                  error={errors.description?.message}
                  multiline
                  style={{ height: 120, textAlignVertical: 'top' }}
                />
              )}
            />
          </View>

          {/* IMAGES */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Upload Images (3-10)</Text>

            <ImagePreview
              images={
                images.map(img => img.uri).filter(Boolean) as string[]
              }
              onRemove={removeImage}
              onImagePress={uri => Alert.alert('Image tapped', uri)}
            />

            <TouchableOpacity
              style={styles.imageBtn}
              onPress={handlePickImages}
              activeOpacity={0.8}
            >
              <Icon
                name="image"
                size={18}
                color={theme.colors.primary}
                style={{ marginRight: 8 }}
              />
              <Text style={styles.imageBtnText}>Add Images</Text>
            </TouchableOpacity>
          </View>

          {/* SUBMIT */}
          <Button
            title="Submit Request"
            onPress={handleSubmit(onSubmit)}
            loading={loading}
          />

          <View style={{ height: 80 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* SUCCESS MODAL */}
      <SuccessModal
        visible={showSuccessModal}
        title="Request Submitted!"
        message="Your request has been broadcasted to verified mechanics in your area. Quotes will start arriving soon."
        infoBadgeText="Average first quote arrives in ~15 mins"
        primaryButtonText="View My Requests"
        secondaryButtonText="Back to Home"
        onPrimaryPress={() => {
          setShowSuccessModal(false);
          navigation.navigate('Requests');
        }}
        onSecondaryPress={() => {
          setShowSuccessModal(false);
          navigation.navigate('Home');
        }}
        onClose={() => {
          setShowSuccessModal(false);
          navigation.navigate('Requests');
        }}
      />
    </View>
  );
};

export default SubmitRequest;

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  /* HEADER */
  header: {
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    paddingBottom: 32,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },

  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayWhite60,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },

  backText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },

  /* CONTENT */
  scroll: {
    padding: 20,
    marginTop: -24,
  },

  /* CARD */
  card: {
    backgroundColor: theme.colors.overlayWhite90,
    borderRadius: 24,
    padding: 18,
    marginBottom: 16,
    shadowColor: theme.colors.primaryLegacy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 8,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 10,
  },

  error: {
    color: theme.colors.error,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  /* ADDRESS */
  addressSection: {
    marginBottom: 16,
  },
  addressErrorBox: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: theme.colors.errorSoft,
    borderWidth: 1,
    borderColor: theme.colors.borderSoftDanger,
    borderRadius: 12,
    padding: 10,
  },
  addressErrorText: {
    flex: 1,
    color: theme.colors.error,
    fontWeight: '700',
    fontSize: 12,
  },

  platePreview: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginTop: 10,
  },

  imageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    paddingVertical: 14,
    backgroundColor: theme.colors.primaryTint08Legacy,
    borderRadius: 16,
  },

  imageBtnText: {
    fontWeight: '700',
    color: theme.colors.primary,
  },

  /* SELECTOR & LABELS */
  inputLabel: {
    marginBottom: 8,
    color: theme.colors.text,
    fontSize: theme.fontSizes.sm,
    fontWeight: '600',
  },
  sectionSubtitle: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 14,
    lineHeight: 18,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  selectorBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 10,
    borderRadius: 14,
    backgroundColor: theme.colors.inputBackground,
    borderWidth: 1.2,
    borderColor: theme.colors.border,
  },
  selectorBtnActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  selectorBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  selectorBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});

