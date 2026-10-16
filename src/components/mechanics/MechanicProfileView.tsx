import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { theme } from '../../theme';

/* ---------------- TYPES ---------------- */

export interface PastWork {
  imageUrl: string;
}

export interface MechanicDto {
  id: number;
  name: string;
  rating?: number;
  reviewsCount?: number;
  address?: string;
  phone?: string;
  pastWork?: PastWork[];
}

interface MechanicProfileViewProps {
  mechanic: MechanicDto;
  onViewFullProfile?: () => void;
}

/* ---------------- STAR RATING ---------------- */

const StarRating: React.FC<{ rating?: number }> = ({ rating = 0 }) => {
  const stars = Math.round(rating);

  return (
    <View style={styles.starsRow}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Icon
          key={index}
          name="star"
          size={16}
          color={index < stars ? '#FACC15' : '#E5E7EB'}
        />
      ))}
    </View>
  );
};

/* ---------------- COMPONENT ---------------- */

export const MechanicProfileView: React.FC<
  MechanicProfileViewProps
> = ({ mechanic, onViewFullProfile }) => {
  return (
    <View style={styles.container}>
      {/* -------- HEADER -------- */}
      <Text style={styles.name}>{mechanic.name}</Text>

      {/* -------- RATING -------- */}
      <View style={styles.ratingRow}>
        <StarRating rating={mechanic.rating} />
        <Text style={styles.reviews}>
          ({mechanic.reviewsCount ?? 0} reviews)
        </Text>
      </View>

      {/* -------- LOCATION -------- */}
      {mechanic.address && (
        <View style={styles.infoRow}>
          <Icon name="map-pin" size={14} color={theme.colors.muted} />
          <Text style={styles.infoText}>{mechanic.address}</Text>
        </View>
      )}

      {/* -------- CONTACT -------- */}
      {mechanic.phone && (
        <View style={styles.infoRow}>
          <Icon name="phone" size={14} color={theme.colors.muted} />
          <Text style={styles.infoText}>{mechanic.phone}</Text>
        </View>
      )}

      {/* -------- PAST WORK -------- */}
      {mechanic.pastWork && mechanic.pastWork.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Past Work</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
          >
            {mechanic.pastWork.map((work, index) => (
              <Image
                key={index}
                source={{ uri: work.imageUrl }}
                style={styles.workImage}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* -------- VIEW FULL PROFILE -------- */}
      {onViewFullProfile && (
        <TouchableOpacity
          style={styles.viewProfileBtn}
          onPress={onViewFullProfile}
        >
          <Text style={styles.viewProfileText}>
            View Full Profile
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

/* ---------------- STYLES ---------------- */

const styles = StyleSheet.create({
  container: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.borderRadius,
    padding: theme.spacing.md,
    elevation: 2,
  },

  name: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },

  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },

  starsRow: {
    flexDirection: 'row',
  },

  reviews: {
    marginLeft: 6,
    fontSize: 13,
    color: theme.colors.muted,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },

  infoText: {
    marginLeft: 6,
    fontSize: 14,
    color: theme.colors.muted,
  },

  section: {
    marginTop: 16,
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 8,
    color: theme.colors.text,
  },

  workImage: {
    width: 110,
    height: 80,
    borderRadius: 10,
    marginRight: 10,
    backgroundColor: '#E5E7EB',
  },

  viewProfileBtn: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(108,99,255,0.1)',
    alignItems: 'center',
  },

  viewProfileText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
});
