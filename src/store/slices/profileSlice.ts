import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {profileApi} from '../../api/profile';
import type {CustomerProfile, UpdateProfileRequest} from '../../types/api';

/* ---------------- TYPES ---------------- */

interface ProfileState {
  profile: CustomerProfile | null;
  loading: boolean;
  error: string | null;
  updateLoading: boolean;
  updateError: string | null;
}

/* ---------------- INITIAL STATE ---------------- */

const initialState: ProfileState = {
  profile: null,
  loading: false,
  error: null,
  updateLoading: false,
  updateError: null,
};

/* ---------------- ASYNC THUNKS ---------------- */

// Fetch profile
export const fetchProfile = createAsyncThunk<
  CustomerProfile,
  void,
  { rejectValue: string }
>('profile/fetchProfile', async (_arg, { rejectWithValue }) => {
  try {
    const profile = await profileApi.getProfile();
    return profile;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to fetch profile');
  }
});

// Update profile
export const updateProfile = createAsyncThunk<
  CustomerProfile,
  UpdateProfileRequest,
  { rejectValue: string }
>('profile/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const profile = await profileApi.updateProfile(data);
    return profile;
  } catch (err: any) {
    return rejectWithValue(err?.response?.data?.message || 'Failed to update profile');
  }
});

/* ---------------- SLICE ---------------- */

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
      state.updateError = null;
    },
    clearProfile(state) {
      state.profile = null;
      state.loading = false;
      state.error = null;
      state.updateLoading = false;
      state.updateError = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // FETCH PROFILE
      .addCase(fetchProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch profile';
      })

      // UPDATE PROFILE
      .addCase(updateProfile.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.profile = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload || 'Failed to update profile';
      });
  },
});

/* ---------------- EXPORTS ---------------- */

export const { clearError, clearProfile } = profileSlice.actions;
export default profileSlice.reducer;

// Selectors
export const selectProfile = (state: any) => state.profile.profile;
export const selectProfileLoading = (state: any) => state.profile.loading;
export const selectProfileError = (state: any) => state.profile.error;
export const selectUpdateLoading = (state: any) => state.profile.updateLoading;
export const selectUpdateError = (state: any) => state.profile.updateError;
