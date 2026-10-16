import { launchImageLibrary, launchCamera, ImagePickerResponse, Asset, ImageLibraryOptions, CameraOptions } from 'react-native-image-picker';

export const takePhoto = async (): Promise<Asset> => {
  return new Promise((resolve, reject) => {
    const options: CameraOptions = {
      mediaType: 'photo',
      quality: 0.8,
      includeBase64: false,
      saveToPhotos: false,
    };

    launchCamera(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        reject(new Error('User cancelled camera'));
      } else if (response.errorMessage) {
        reject(new Error(response.errorMessage));
      } else if (response.assets && response.assets.length > 0) {
        resolve(response.assets[0]);
      } else {
        reject(new Error('No photo captured'));
      }
    });
  });
};

export const pickImages = async (maxCount: number = 10): Promise<Asset[]> => {
  return new Promise((resolve, reject) => {
    const options: ImageLibraryOptions = {
      mediaType: 'photo' as const,
      quality: 0.8,
      selectionLimit: maxCount,
      includeBase64: false,
    };

    launchImageLibrary(options, (response: ImagePickerResponse) => {
      if (response.didCancel) {
        reject(new Error('User cancelled image selection'));
      } else if (response.errorMessage) {
        reject(new Error(response.errorMessage));
      } else if (response.assets && response.assets.length > 0) {
        resolve(response.assets);
      } else {
        reject(new Error('No images selected'));
      }
    });
  });
};
