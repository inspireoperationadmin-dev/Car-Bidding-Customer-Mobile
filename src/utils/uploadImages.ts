import { Platform } from 'react-native';
import apiClient from '../api/apiClient';

/**
 * Upload images for a given request
 * @param requestId - ID of the request to attach images to
 * @param imageUris - array of image URIs
 * @returns array of uploaded image URLs
 */
export const uploadImages = async (
  requestId: number,
  imageUris: string[]
): Promise<string[]> => {
  if (!imageUris.length) return [];

  const formData = new FormData();

  imageUris.forEach((uri, index) => {
    const filename = uri.split('/').pop() || `image_${index}.jpg`;

    formData.append('images', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      type: 'image/jpeg', // can adjust if using PNG
      name: filename,
    } as any);
  });

  try {
    const response = await apiClient.post(`/requests/${requestId}/images`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    // assuming backend returns { imageUrls: string[] }
    return response.data.imageUrls || [];
  } catch (err: any) {
    console.error('Image upload failed:', err);
    throw new Error(err?.response?.data?.message || 'Image upload failed');
  }
};
