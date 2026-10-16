import React, { useState, useMemo } from 'react';
import {View, Text, StyleSheet, TouchableOpacity, FlatList} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';
import StarRating from '../common/StarRating'; // Make sure this exists

/* ---------------- TYPES ---------------- */
export interface BidDto {
  id: number;
  mechanicName: string;
  price: number;
  estimatedDurationDays: number;
  estimatedDurationHours: number;
  mechanicRating?: number;
}

interface BidComparisonViewProps {
  bids: BidDto[];
  onSelect: (bidId: number) => void;
}

/* ---------------- COMPONENT ---------------- */
export const BidComparisonView: React.FC<BidComparisonViewProps> = ({
  bids,
  onSelect,
}) => {
  const [sortBy, setSortBy] = useState<'price' | 'duration' | 'rating'>('price');

  /* ---------------- SORT BIDS ---------------- */
  const sortedBids = useMemo(() => {
    return [...bids].sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'duration') {
        const aHours = a.estimatedDurationDays * 24 + a.estimatedDurationHours;
        const bHours = b.estimatedDurationDays * 24 + b.estimatedDurationHours;
        return aHours - bHours;
      }
      // rating
      return (b.mechanicRating || 0) - (a.mechanicRating || 0);
    });
  }, [bids, sortBy]);

  /* ---------------- HIGHLIGHTS ---------------- */
  const lowestPrice = Math.min(...bids.map(b => b.price));
  const shortestDuration = Math.min(
    ...bids.map(b => b.estimatedDurationDays * 24 + b.estimatedDurationHours)
  );

  return (
    <View style={styles.container}>
      {/* -------- SORT OPTIONS -------- */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'price' && styles.activeSort]}
          onPress={() => setSortBy('price')}
        >
          <Text style={styles.sortText}>Price</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'duration' && styles.activeSort]}
          onPress={() => setSortBy('duration')}
        >
          <Text style={styles.sortText}>Duration</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.activeSort]}
          onPress={() => setSortBy('rating')}
        >
          <Text style={styles.sortText}>Rating</Text>
        </TouchableOpacity>
      </View>

      {/* -------- BID LIST -------- */}
      {sortedBids.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>No bids available</Text>
        </View>
      ) : (
        <FlatList
          data={sortedBids}
          keyExtractor={item => item.id.toString()}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const durationHours = item.estimatedDurationDays * 24 + item.estimatedDurationHours;
            return (
              <View
                style={[
                  styles.bidCard,
                  item.price === lowestPrice && styles.highlightPrice,
                  durationHours === shortestDuration && styles.highlightDuration,
                ]}
              >
                <Text style={styles.mechanicName}>{item.mechanicName}</Text>

                <View style={styles.row}>
                  <Text style={styles.label}>Price:</Text>
                  <Text style={styles.value}>€{item.price.toFixed(2)}</Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Duration:</Text>
                  <Text style={styles.value}>
                    {item.estimatedDurationDays}d {item.estimatedDurationHours}h
                  </Text>
                </View>

                <View style={styles.row}>
                  <Text style={styles.label}>Rating:</Text>
                  <StarRating rating={item.mechanicRating || 0} />
                </View>

                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => onSelect(item.id)}
                >
                  <Text style={styles.selectText}>Select</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      )}
    </View>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },

  sortContainer: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  sortButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.surfaceMuted,
  },
  activeSort: { backgroundColor: theme.colors.primary },
  sortText: { fontWeight: '600', color: theme.colors.textSubtle },

  listContent: { paddingBottom: 20 },

  bidCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },

  highlightPrice: { borderWidth: 2, borderColor: theme.colors.successStrong }, // green for lowest price
  highlightDuration: { borderWidth: 2, borderColor: theme.colors.info }, // blue for shortest duration

  mechanicName: { fontWeight: '700', fontSize: 16, marginBottom: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontWeight: '600', color: theme.colors.muted },
  value: { fontWeight: '600', color: theme.colors.textStrong },

  selectButton: {
    marginTop: 10,
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  selectText: { color: theme.colors.white, fontWeight: '700', fontSize: 14 },

  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 50 },
  emptyText: { fontSize: 16, color: theme.colors.muted, fontWeight: '600' },
});
