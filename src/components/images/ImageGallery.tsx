import React, { useState } from 'react';
import {
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Text,
  ActivityIndicator,
} from 'react-native';
import { theme } from '../../theme';

/* ---------------- TYPES ---------------- */
interface ImageGalleryProps {
  images: string[];
}

/* ---------------- COMPONENT ---------------- */
export const ImageGallery: React.FC<ImageGalleryProps> = ({ images }) => {
  const [visible, setVisible] = useState(false);
  const [activeImage, setActiveImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const openImage = (uri: string) => {
    setActiveImage(uri);
    setVisible(true);
    setLoading(true);
    setError(false);
  };

  const closeImage = () => {
    setVisible(false);
    setActiveImage(null);
  };

  if (!images || images.length === 0) {
    return null;
  }

  return (
    <>
      {/* -------- GRID -------- */}
      <View style={styles.grid}>
        {images.map((uri, index) => (
          <TouchableOpacity
            key={index}
            style={styles.imageWrapper}
            onPress={() => openImage(uri)}
            activeOpacity={0.8}
          >
            <Image
              source={{ uri }}
              style={styles.thumbnail}
              resizeMode="cover"
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* -------- FULL SIZE MODAL -------- */}
      <Modal visible={visible} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <TouchableOpacity style={styles.closeBtn} onPress={closeImage}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {loading && !error && (
            <ActivityIndicator size="large" color="#fff" />
          )}

          {activeImage && !error && (
            <Image
              source={{ uri: activeImage }}
              style={styles.fullImage}
              resizeMode="contain"
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setError(true);
                setLoading(false);
              }}
            />
          )}

          {error && (
            <Text style={styles.errorText}>
              Failed to load image
            </Text>
          )}
        </View>
      </Modal>
    </>
  );
};

/* ---------------- STYLES ---------------- */
const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  imageWrapper: {
    width: '48%',
    aspectRatio: 1,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#e5e7eb',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeBtn: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
  },
  closeText: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});
