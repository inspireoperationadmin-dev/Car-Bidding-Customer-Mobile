import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import requestReducer from './slices/requestSlice';
import paymentReducer from './slices/paymentSlice';
import profileReducer from './slices/profileSlice';
import notificationReducer from './slices/notificationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    requests: requestReducer,
    payment: paymentReducer,
    profile: profileReducer,
    notifications: notificationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// ✅ Types
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
