import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';

import { theme } from '../../theme';

/* ---------------- PROPS ---------------- */
interface BidLockedViewProps {
  bidCount: number;
  paymentAmount: number;
  onPayPress: () => void;
}

/* ---------------- COMPONENT ---------------- */
export const BidLockedView: React.FC<BidLockedViewProps> = ({
  bidCount,
  paymentAmount,
  onPayPress,
}) => {
  return (
    <View style={styles.container}>
      {/* Lock Icon */}
      <Icon name="lock" size={64} color={theme.colors.muted} />

      {/* Title */}
      <Text style={styles.title}>Bids Locked</Text>

      {/* Bid Count */}
      <Text style={styles.count}>
        {bidCount} bids have been placed
      </Text>

      {/* Message */}
      <Text style={styles.message}>
        Pay to view all bids and choose the best mechanic for your car.
      </Text>

      {/* Amount */}
      <View style={styles.amountBox}>
        <Text style={styles.amountLabel}>Payment Required</Text>
        <Text style={styles.amount}>
          €{paymentAmount.toFixed(2)}
        </Text>
      </View>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.button}
        activeOpacity={0.85}
        onPress={onPayPress}
      >
        <Text style={styles.buttonText}>Pay to View Bids</Text>
      </TouchableOpacity>
    </View>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  count: {
    fontSize: 16,
    marginTop: 8,
    color: theme.colors.textSubtle,
  },
  message: {
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
    color: theme.colors.muted,
    lineHeight: 20,
  },
  amountBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: theme.colors.muted,
  },
  amount: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginTop: 4,
  },
  button: {
    marginTop: 28,
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
