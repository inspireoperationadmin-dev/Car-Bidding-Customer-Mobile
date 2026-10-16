import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {theme} from '../../theme';

type Mechanic = {
  id: number;
  name: string;
  rating?: number;
  reviewsCount?: number;
  address?: string;
  phone?: string;
};

type Props = {
  bidId: number;
  price: number;
  duration: string;
  notes?: string;
  mechanic: Mechanic;
  onPressMechanic: () => void;
};

export const BidMechanicCard: React.FC<Props> = ({
  price,
  duration,
  notes,
  mechanic,
  onPressMechanic,
}) => {
  return (
    <View style={styles.card}>
      {/* BID SECTION */}
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>Bid Details</Text>
        <Text style={styles.price}>€{price.toFixed(2)}</Text>
      </View>

      <Text style={styles.label}>Duration</Text>
      <Text style={styles.value}>{duration}</Text>

      {notes ? (
        <>
          <Text style={styles.label}>Notes</Text>
          <Text style={styles.value}>{notes}</Text>
        </>
      ) : null}

      {/* MECHANIC SECTION */}
      <TouchableOpacity style={styles.mechanicBox} onPress={onPressMechanic}>
        <Text style={styles.mechanicTitle}>Mechanic</Text>

        <View style={styles.rowBetween}>
          <Text style={styles.mechanicName}>{mechanic.name}</Text>
          <Text style={styles.viewLink}>View →</Text>
        </View>

        <Text style={styles.mechanicSub}>
          ⭐ {mechanic.rating ?? '-'} ({mechanic.reviewsCount ?? 0} reviews)
        </Text>

        {mechanic.address ? (
          <Text style={styles.mechanicSub}>📍 {mechanic.address}</Text>
        ) : null}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  rowBetween: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  sectionTitle: {fontSize: 16, fontWeight: '800'},
  price: {fontSize: 20, fontWeight: '900', color: theme.colors.primary},

  label: {fontSize: 13, color: theme.colors.muted, marginTop: 12},
  value: {fontSize: 14, fontWeight: '600', marginTop: 4},

  mechanicBox: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: theme.colors.borderLight,
  },
  mechanicTitle: {fontSize: 14, fontWeight: '800', marginBottom: 8},
  mechanicName: {fontSize: 15, fontWeight: '800'},
  viewLink: {fontSize: 13, fontWeight: '700', color: theme.colors.primary},
  mechanicSub: {fontSize: 13, color: theme.colors.textMutedDark, marginTop: 6},
});
