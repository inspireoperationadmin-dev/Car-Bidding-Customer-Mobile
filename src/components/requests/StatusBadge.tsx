import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type {RequestStatus} from '../../types/api';

interface StatusBadgeProps {
  status: RequestStatus;
}

/* ---------------- CONFIG ---------------- */
const statusConfig: Record<
  RequestStatus,
  { color: string; label: string; icon?: string }
> = {
  PENDING: {
    color: '#F59E0B',
    label: 'Pending',
    icon: '⏳',
  },
  APPROVED: {
    color: '#3B82F6',
    label: 'Approved',
    icon: '✅',
  },
  REJECTED: {
    color: '#EF4444',
    label: 'Rejected',
    icon: '❌',
  },
  BIDDING: {
    color: '#8B5CF6',
    label: 'Bidding',
    icon: '💰',
  },
  BIDS_VIEWABLE: {
    color: '#22C55E',
    label: 'Bids Available',
    icon: '👀',
  },
  MECHANIC_SELECTED: {
    color: '#16A34A',
    label: 'Mechanic Selected',
    icon: '🔧',
  },
  COMPLETED: {
    color: '#16A34A',
    label: 'Completed',
    icon: '🏁',
  },
};

/* ---------------- COMPONENT ---------------- */
export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status];

  return (
    <View style={[styles.badge, { backgroundColor: config.color }]}>
      <Text style={styles.text}>
        {config.icon ? `${config.icon} ` : ''}
        {config.label}
      </Text>
    </View>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
