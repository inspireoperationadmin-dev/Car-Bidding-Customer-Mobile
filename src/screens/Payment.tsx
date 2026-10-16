import React, {useMemo, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {CardField, useStripe} from '@stripe/stripe-react-native';
import apiClient from '../api/apiClient';
import {AppStackParamList} from '../navigation/types';
import {PaymentInitResponse} from '../types/api';
import {theme} from '../theme';

const Payment: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Payment'>>();
  const {requestId, amount} = route.params;

  const {createPaymentMethod, handleNextAction, retrievePaymentIntent} =
    useStripe();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [cardHolderName, setCardHolderName] = useState('');
  const [cardComplete, setCardComplete] = useState(false);

  const disabled = useMemo(() => {
    if (loading) return true;
    if (!cardComplete) return true;
    if (!cardHolderName.trim()) return true;
    return false;
  }, [loading, cardComplete, cardHolderName]);

  const goConfirmation = (params: any) => {
    navigation.replace('PaymentConfirmation', params);
  };

  const startPayment = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!cardHolderName.trim()) throw new Error('Please enter card holder name');
      if (!cardComplete) throw new Error('Please fill all card details');

      // 1) Create PaymentMethod (client)
      const pmRes = await createPaymentMethod({
        paymentMethodType: 'Card',
        paymentMethodData: {
          billingDetails: {name: cardHolderName.trim()},
        },
      });

      if (pmRes.error || !pmRes.paymentMethod?.id) {
        throw new Error(pmRes.error?.message || 'Failed to create payment method');
      }

      const paymentMethodId = pmRes.paymentMethod.id;

      // 2) Backend creates+confirms PaymentIntent (server-side)
      const initRes = await apiClient.post<PaymentInitResponse>('/api/payments', {
        requestId: Number(requestId),
        amount: Number(amount),
        paymentMethod: 'CARD',
        paymentMethodId,
      });

      const clientSecret = initRes.data?.data?.clientSecret;
      const backendPaymentId = initRes.data?.data?.paymentId;
      const backendStatus = String(initRes.data?.data?.status ?? '').toUpperCase();

      // ✅ If already paid, backend may return no clientSecret
      if (!clientSecret || backendStatus === 'COMPLETED') {
        goConfirmation({
          paymentStatus: 'success',
          requestId: String(requestId),
          paymentId: backendPaymentId ? String(backendPaymentId) : undefined,
          amount,
          transactionId: undefined,
        });
        return;
      }

      // 3) Check PI status
      const first = await retrievePaymentIntent(clientSecret);
      let pi: any = (first as any)?.paymentIntent;
      let status = String(pi?.status ?? '').toLowerCase();

      // 4) Handle 3DS only if required
      if (status === 'requires_action') {
        const next = await handleNextAction(clientSecret);
        if ((next as any)?.error) {
          throw new Error((next as any).error.message || '3DS auth failed');
        }

        const after = await retrievePaymentIntent(clientSecret);
        pi = (after as any)?.paymentIntent;
        status = String(pi?.status ?? '').toLowerCase();
      }

      const isSuccess = status === 'succeeded';
      goConfirmation({
        paymentStatus: isSuccess ? 'success' : 'failure',
        requestId: String(requestId),
        paymentId: backendPaymentId ? String(backendPaymentId) : undefined,
        amount,
        transactionId: pi?.id ? String(pi.id) : undefined,
        errorMessage: isSuccess ? undefined : `Payment status: ${status || 'unknown'}`,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Something went wrong';
      setError(msg);
      Alert.alert('Payment Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
              <Text style={styles.backText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Payment</Text>
            <View style={{width: 52}} />
          </View>

          {/* Amount */}
          <View style={styles.amountBox}>
            <Text style={styles.amountLabel}>Amount to Pay</Text>
            <Text style={styles.amountValue}>€{Number(amount).toFixed(2)}</Text>
            <Text style={styles.amountSubText}>Unlock Bids</Text>
          </View>

          {/* Card Details */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Card Payment</Text>

            <View style={styles.inputBox}>
              <Text style={styles.inputLabel}>Name on card</Text>
              <TextInput
                value={cardHolderName}
                onChangeText={setCardHolderName}
                placeholder="John Doe"
                placeholderTextColor={theme.colors.mutedText}
                style={styles.input}
                editable={!loading}
              />
            </View>

            <View style={styles.cardBox}>
              <Text style={styles.inputLabel}>Card number • Expiry • CVC</Text>
              <CardField
                postalCodeEnabled={false}
                style={styles.cardField}
                onCardChange={(d) => {
                  setCardComplete(!!d?.complete);
                  if (error) setError(null);
                }}
              />

              {!cardComplete ? (
                <Text style={styles.helperText}>Fill all card details (including CVC)</Text>
              ) : (
                <Text style={[styles.helperText, {color: theme.colors.successStrong}]}>
                  Card details complete ✅
                </Text>
              )}
            </View>
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.payButton, disabled && styles.disabledButton]}
            onPress={startPayment}
            disabled={disabled}
            activeOpacity={0.9}>
            {loading ? (
              <ActivityIndicator color={theme.colors.white} />
            ) : (
              <Text style={styles.payButtonText}>
                Pay €{Number(amount).toFixed(2)}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.footerNote}>
            Flow: createPaymentMethod → backend /api/payments (create+confirm PI) → handleNextAction (3DS only) → confirmation
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default Payment;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: theme.colors.appBackgroundGray},
  container: {padding: 16, paddingBottom: 28},

  header: {flexDirection: 'row', alignItems: 'center', marginBottom: 16},
  backBtn: {width: 52},
  backText: {fontSize: 16, color: theme.colors.iosBlue},
  headerTitle: {flex: 1, textAlign: 'center', fontSize: 18, fontWeight: '700', color: theme.colors.textStrong},

  amountBox: {
    backgroundColor: theme.colors.white,
    padding: 18,
    borderRadius: 14,
    marginBottom: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.neutralSoftBlue,
  },
  amountLabel: {fontSize: 13, color: theme.colors.muted},
  amountValue: {fontSize: 30, fontWeight: '800', marginTop: 6, color: theme.colors.textStrong},
  amountSubText: {fontSize: 12, color: theme.colors.mutedText, marginTop: 6},

  section: {marginBottom: 18},
  sectionTitle: {fontSize: 16, fontWeight: '700', marginBottom: 10, color: theme.colors.textStrong},

  inputBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 12,
    marginBottom: 12,
  },
  inputLabel: {fontSize: 12, color: theme.colors.muted, marginBottom: 8, fontWeight: '600'},
  input: {paddingVertical: 6, fontSize: 15, color: theme.colors.textStrong},

  cardBox: {
    backgroundColor: theme.colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    padding: 12,
  },
  cardField: {height: 52, marginTop: 4},
  helperText: {marginTop: 10, fontSize: 12, color: theme.colors.error},

  payButton: {backgroundColor: theme.colors.iosBlue, paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 4},
  disabledButton: {opacity: 0.6},
  payButtonText: {color: theme.colors.white, fontSize: 16, fontWeight: '800'},

  errorText: {color: theme.colors.errorDark, marginBottom: 12, textAlign: 'center', fontWeight: '600'},
  footerNote: {textAlign: 'center', marginTop: 10, fontSize: 11, color: theme.colors.mutedText},
});

