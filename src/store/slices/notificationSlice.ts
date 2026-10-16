import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {notificationsApi} from '../../api/notifications';
import type {Notification} from '../../types/api';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

// Fetch notifications
export const fetchNotifications = createAsyncThunk<
  { notifications: Notification[]; unreadCount: number },
  void,
  { rejectValue: string }
>('notifications/fetch', async (_arg, { rejectWithValue }) => {
  try {
    return await notificationsApi.getAll();
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to fetch notifications');
  }
});

// Mark single as read
export const markAsRead = createAsyncThunk<
  number,
  number,
  { rejectValue: string }
>('notifications/markAsRead', async (id, { rejectWithValue }) => {
  try {
    await notificationsApi.markAsRead(id);
    return id;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to mark as read');
  }
});

// Mark all as read
export const markAllAsRead = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('notifications/markAllAsRead', async (_arg, { rejectWithValue }) => {
  try {
    await notificationsApi.markAllAsRead();
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to mark all as read');
  }
});

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.loading = false;
        state.notifications = action.payload.notifications;
        state.unreadCount = action.payload.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch notifications';
      })

      .addCase(markAsRead.fulfilled, (state, action) => {
        const id = action.payload;
        const notification = state.notifications.find((n) => n.id === id);
        if (notification && !notification.isRead) {
          notification.isRead = true;
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })

      .addCase(markAllAsRead.fulfilled, (state) => {
        state.notifications.forEach((n) => { n.isRead = true; });
        state.unreadCount = 0;
      });
  },
});

export default notificationSlice.reducer;

export const selectNotifications = (state: any) => state.notifications.notifications;
export const selectUnreadCount = (state: any) => state.notifications.unreadCount;
export const selectNotificationsLoading = (state: any) => state.notifications.loading;
export const selectNotificationsError = (state: any) => state.notifications.error;
