import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface StarRatingProps {
  rating: number; // 0-5
}

const StarRating: React.FC<StarRatingProps> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const halfStar = rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);

  return (
    <View style={styles.container}>
      {Array(fullStars)
        .fill(0)
        .map((_, i) => (
          <Icon key={`full-${i}`} name="star" size={14} color="#FFD700" />
        ))}

      {halfStar && <Icon name="star-half" size={14} color="#FFD700" />}

      {Array(emptyStars)
        .fill(0)
        .map((_, i) => (
          <Icon key={`empty-${i}`} name="star-o" size={14} color="#FFD700" />
        ))}
    </View>
  );
};

export default StarRating;

const styles = StyleSheet.create({
  container: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
});
