import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../navigation/types';
import {theme} from '../theme';

const PaymentConfirmation: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'PaymentConfirmation'>>();
  const {paymentStatus, requestId, paymentId, amount, transactionId, errorMessage} =
    route.params;

  const isSuccess = useMemo(() => paymentStatus === 'success', [paymentStatus]);

  const title = isSuccess ? 'Payment Successful' : 'Payment Failed';
  const message = isSuccess
    ? 'Your payment has been completed successfully.'
    : errorMessage || 'Something went wrong with your payment.';

  const requestIdNumber = useMemo(() => {
    const n = Number(requestId);
    return Number.isFinite(n) ? n : 0;
  }, [requestId]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.iconCircle, isSuccess ? styles.successBg : styles.failureBg]}>
          <Text style={[styles.iconText, !isSuccess && styles.iconTextFail]}>
            {isSuccess ? '✓' : '✕'}
          </Text>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.detailsBox}>
          {amount !== undefined ? (
            <Text style={styles.detailText}>Amount: €{amount.toFixed(2)}</Text>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.primaryButton, isSuccess ? styles.successBtn : styles.failureBtn]}
          onPress={() => {
            if (isSuccess) {
              // ✅ replace so back button won't go to Payment again
              navigation.replace('Bids', {requestId: requestIdNumber});
            } else {
              navigation.replace('Payment', {requestId, amount: amount ?? 0});
            }
          }}
          activeOpacity={0.9}>
          <Text style={styles.primaryButtonText}>{isSuccess ? 'View Bids' : 'Try Again'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default PaymentConfirmation;

const styles = StyleSheet.create({
  safeArea: {flex: 1, backgroundColor: theme.colors.appBackgroundGray},
  container: {flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center'},

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successBg: {backgroundColor: theme.colors.successSurface},
  failureBg: {backgroundColor: theme.colors.failureSurface},
  iconText: {fontSize: 40, fontWeight: '700', color: theme.colors.successForest},
  iconTextFail: {color: theme.colors.failureRed},

  title: {fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center'},
  message: {fontSize: 15, color: theme.colors.textBody, textAlign: 'center', marginBottom: 20},

  detailsBox: {backgroundColor: theme.colors.white, padding: 16, borderRadius: 12, width: '100%', marginBottom: 16},
  detailText: {fontSize: 14, color: theme.colors.textDark, marginBottom: 6},

  primaryButton: {width: '100%', paddingVertical: 16, borderRadius: 12, alignItems: 'center'},
  successBtn: {backgroundColor: theme.colors.successForest},
  failureBtn: {backgroundColor: theme.colors.failureRed},
  primaryButtonText: {color: theme.colors.white, fontSize: 16, fontWeight: '600'},
});

