import apiClient from './apiClient';
import type {NotificationsResponse} from '../types/api';

export const notificationsApi = {
  getAll: async (limit = 20, offset = 0): Promise<NotificationsResponse> => {
    const response = await apiClient.get('/api/notifications', {
      params: {limit, offset},
    });
    return response.data.data;
  },

  markAsRead: async (id: number): Promise<void> => {
    await apiClient.patch(`/api/notifications/${id}/read`);
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.patch('/api/notifications/read-all');
  },
};
