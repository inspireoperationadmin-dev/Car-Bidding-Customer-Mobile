import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Asset } from 'react-native-image-picker';
import { theme } from '../theme';

interface ImagePreviewProps {
  images: Asset[];
  removeImage: (index: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({ images, removeImage }) => {
  return (
    <View style={styles.grid}>
      {images.map((img, index) => (
        <View key={index} style={styles.wrapper}>
          <Image source={{ uri: img.uri }} style={styles.image} />
          <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(index)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );
};

export default ImagePreview;

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm },
  wrapper: { position: 'relative', marginRight: 8, marginBottom: 8 },
  image: { width: 80, height: 80, borderRadius: 8 },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: theme.colors.black,
    borderRadius: 10,
    paddingHorizontal: 5,
  },
  removeText: { color: theme.colors.white, fontSize: 12 },
});
