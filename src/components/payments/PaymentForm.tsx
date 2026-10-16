import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CardField, useStripe } from '@stripe/stripe-react-native';

type PaymentMethodType = 'CARD' | 'PAYPAL';

interface PaymentFormProps {
  amount: number;
  onPaymentMethodCreated: (paymentMethodId: string) => void;
  onError: (error: string) => void;
}

export const PaymentForm: React.FC<PaymentFormProps> = ({
  amount,
  onPaymentMethodCreated,
  onError,
}) => {
  const { createPaymentMethod } = useStripe();

  const [selectedMethod, setSelectedMethod] =
    useState<PaymentMethodType>('CARD');
  const [cardComplete, setCardComplete] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (selectedMethod !== 'CARD') {
      onError('This payment method is not supported yet');
      return;
    }

    if (!cardComplete) {
      onError('Please complete card details');
      return;
    }

    try {
      setLoading(true);

      const result = await createPaymentMethod({
        paymentMethodType: 'Card',
      });

      if (result.error || !result.paymentMethod) {
        onError(result.error?.message || 'Failed to create payment method');
        return;
      }

      onPaymentMethodCreated(result.paymentMethod.id);
    } catch {
      onError('Payment failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Amount */}
      <Text style={styles.amount}>Amount: €{amount.toFixed(2)}</Text>

      {/* Payment Method Selector */}
      <View style={styles.methods}>
        <TouchableOpacity
          style={[
            styles.methodButton,
            selectedMethod === 'CARD' && styles.methodSelected,
          ]}
          onPress={() => setSelectedMethod('CARD')}>
          <Text style={styles.methodText}>Card</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.methodButtonDisabled}
          disabled>
          <Text style={styles.methodDisabledText}>PayPal (Soon)</Text>
        </TouchableOpacity>
      </View>

      {/* Card Input */}
      {selectedMethod === 'CARD' && (
        <View style={styles.cardContainer}>
          <Text style={styles.label}>Card Details</Text>
          <CardField
            postalCodeEnabled
            style={styles.cardField}
            cardStyle={{
              backgroundColor: '#FFFFFF',
              textColor: '#000000',
            }}
            onCardChange={details => {
              setCardComplete(details.complete);
            }}
          />
        </View>
      )}

      {/* Submit */}
      <TouchableOpacity
        style={[styles.payButton, loading && styles.disabled]}
        onPress={handleSubmit}
        disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFF" />
        ) : (
          <Text style={styles.payText}>Pay €{amount.toFixed(2)}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
  },
  methods: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
    marginRight: 8,
  },
  methodSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#EAF3FF',
  },
  methodButtonDisabled: {
    flex: 1,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#EEE',
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
  },
  methodText: {
    fontSize: 15,
    fontWeight: '600',
  },
  methodDisabledText: {
    fontSize: 15,
    color: '#AAA',
  },
  cardContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    marginBottom: 8,
    fontWeight: '500',
  },
  cardField: {
    height: 50,
  },
  payButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabled: {
    opacity: 0.6,
  },
  payText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
