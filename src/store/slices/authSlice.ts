// src/store/slices/authSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../../api/apiClient';
import type { LoginFormInputs, RegisterFormInputs } from '../../utils/validation';
import type {User, SendOtpRequest} from '../../types/api';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

/* ---------------- CONSTANTS ---------------- */

export const TOKEN_KEY = 'token';
export const REFRESH_TOKEN_KEY = 'refreshToken';
export const USER_KEY = 'user';

/* ---------------- INITIAL STATE ---------------- */

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: true, // app start-ல் loadUser check பண்ண
  error: null,
};

/* ---------------- ASYNC THUNKS ---------------- */

// ✅ LOAD USER ON APP START
export const loadUser = createAsyncThunk<
  { token: string; user: User },
  void,
  { rejectValue: string }
>('auth/loadUser', async (_arg, { rejectWithValue }) => {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const userStr = await AsyncStorage.getItem(USER_KEY);

    if (!token || !userStr) return rejectWithValue('No token found');

    const user = JSON.parse(userStr) as User;

    return { token, user };
  } catch (err: any) {
    return rejectWithValue(err?.message || 'Failed to load user');
  }
});

// ✅ LOGIN
export const loginUser = createAsyncThunk<
  { user: User; token: string },
  LoginFormInputs,
  { rejectValue: string }
>('auth/login', async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/api/auth/login', {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    const { token, user, refreshToken } = response.data.data;

    const itemsToSet: [string, string][] = [
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ];
    if (refreshToken) {
      itemsToSet.push([REFRESH_TOKEN_KEY, refreshToken]);
    }
    await AsyncStorage.multiSet(itemsToSet);

    return { token, user };
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Login failed');
  }
});

// ✅ REGISTER + AUTO LOGIN + RETURN token/user
export const registerUser = createAsyncThunk<
  { token: string; user: User },
  RegisterFormInputs & { otp?: string },
  { rejectValue: string }
>('auth/register', async (data, { rejectWithValue }) => {
  try {
    // 1️⃣ REGISTER
    await apiClient.post('/api/auth/register', {
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      role: 'CUSTOMER',
      otp: data.otp,
    });

    // 2️⃣ AUTO LOGIN
    const loginRes = await apiClient.post('/api/auth/login', {
      email: data.email.trim().toLowerCase(),
      password: data.password,
    });

    const { token, user, refreshToken } = loginRes.data.data;

    // 3️⃣ SAVE STORAGE
    const itemsToSet: [string, string][] = [
      [TOKEN_KEY, token],
      [USER_KEY, JSON.stringify(user)],
    ];
    if (refreshToken) {
      itemsToSet.push([REFRESH_TOKEN_KEY, refreshToken]);
    }
    await AsyncStorage.multiSet(itemsToSet);

    return { token, user };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Registration failed'
    );
  }
});

// SEND OTP
export const sendOtp = createAsyncThunk<
  { otp: string },
  SendOtpRequest,
  { rejectValue: string }
>('auth/sendOtp', async (data, { rejectWithValue }) => {
  try {
    const response = await apiClient.post('/api/auth/send-otp', {
      email: data.email.trim().toLowerCase(),
      phone: data.phone,
    });

    return { otp: response.data.data.otp };
  } catch (err: any) {
    return rejectWithValue(
      err?.response?.data?.message || 'Failed to send verification code'
    );
  }
});

// ✅ LOGOUT
export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
});

/* ---------------- SLICE ---------------- */

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    },

    updateTokens(state, action: PayloadAction<{ token: string }>) {
      state.token = action.payload.token;
      state.isAuthenticated = true;
    },

    // optional manual set
    setCredentials(state, action: PayloadAction<{ user: User; token: string }>) {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // LOAD USER
      .addCase(loadUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(loadUser.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loadUser.rejected, (state) => {
        state.loading = false;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })

      // LOGIN — don't touch `loading` here; LoginScreen has its own local loading state.
      // Setting loading=true here causes AppNavigator to unmount LoginScreen mid-request.
      .addCase(loginUser.pending, (state) => {
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.error = action.payload || 'Login failed';
      })

      // REGISTER — same fix: don't touch `loading`
      .addCase(registerUser.pending, (state) => {
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.error = action.payload || 'Registration failed';
      })

      // LOGOUT
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.loading = false;
      });
  },
});

/* ---------------- EXPORTS ---------------- */

export const { clearError, updateTokens, setCredentials } = authSlice.actions;
export default authSlice.reducer;

// ✅ Selectors (optional but useful)
export const selectAuth = (state: any) => state.auth;
export const selectToken = (state: any) => state.auth.token;
export const selectUser = (state: any) => state.auth.user;
export const selectIsAuthenticated = (state: any) => state.auth.isAuthenticated;
export const selectAuthLoading = (state: any) => state.auth.loading;
export const selectAuthError = (state: any) => state.auth.error;
