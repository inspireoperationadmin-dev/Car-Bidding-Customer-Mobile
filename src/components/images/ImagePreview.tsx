// src/components/images/ImagePreview.tsx
import React from 'react';
import {
  View,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { theme } from '../../theme';

interface ImagePreviewProps {
  images: string[];
  onRemove: (index: number) => void;
  onImagePress?: (uri: string) => void;
}

const { width } = Dimensions.get('window');
const THUMBNAIL_SIZE = (width - 48) / 2; // 2 columns with 16px padding

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onRemove,
  onImagePress,
}) => {
  return (
    <View style={styles.container}>
      {images.map((uri, index) => (
        <View key={index} style={styles.imageWrapper}>
          <Image source={{ uri }} style={styles.thumbnail} />

          {/* Remove button */}
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => onRemove(index)}
          >
            <Text style={styles.removeText}>×</Text>
          </TouchableOpacity>

          {/* Optional full-screen press */}
          {onImagePress && (
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => onImagePress(uri)}
            />
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  imageWrapper: {
    width: THUMBNAIL_SIZE,
    height: THUMBNAIL_SIZE,
    marginRight: 16,
    marginBottom: 16,
    position: 'relative',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: theme.colors.black,
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 2,
    zIndex: 2,
  },
  removeText: {
    color: theme.colors.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
});
