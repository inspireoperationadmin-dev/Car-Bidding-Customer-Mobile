import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { theme } from '../../theme';
import { StatusBadge } from './StatusBadge';
import type {RequestDto} from '../../types/api';

interface RequestCardProps {
  request: RequestDto;
  onPress: () => void;
}

/* ---------------- COMPONENT ---------------- */
export const RequestCard: React.FC<RequestCardProps> = ({
  request,
  onPress,
}) => {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.id}>{request.carBrand} {request.carModel}</Text>
        <StatusBadge status={request.status} />
      </View>

      {/* Car details */}
      <Text style={styles.car}>
        {request.carBrand} {request.carModel} ({request.carYear})
      </Text>

      {/* Date */}
      <Text style={styles.date}>
        Created: {new Date(request.createdAt).toLocaleDateString()}
      </Text>

      {/* Action */}
      <Text style={styles.action}>View details →</Text>
    </TouchableOpacity>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.md,

    // Shadow (Android + iOS)
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  id: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  car: {
    marginTop: 8,
    fontSize: 15,
    fontWeight: '600',
  },
  date: {
    marginTop: 4,
    fontSize: 13,
    color: '#6b7280',
  },
  action: {
    marginTop: 8,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});
