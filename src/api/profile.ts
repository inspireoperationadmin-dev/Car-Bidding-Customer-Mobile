import apiClient from './apiClient';
import type {CustomerProfile, UpdateProfileRequest} from '../types/api';

export const profileApi = {
  getProfile: async (): Promise<CustomerProfile> => {
    const response = await apiClient.get('/api/profile/me');
    return response.data.data;
  },

  updateProfile: async (data: UpdateProfileRequest): Promise<CustomerProfile> => {
    const response = await apiClient.patch('/api/profile/me', data);
    return response.data.data;
  },
};
