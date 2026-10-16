import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import apiClient from '../../api/apiClient';
import type {RequestDto, RequestDetailDto} from '../../types/api';

interface RequestState {
  requests: RequestDto[];
  selectedRequest: RequestDetailDto | null;
  loading: boolean;
  error: string | null;
}

const initialState: RequestState = {
  requests: [],
  selectedRequest: null,
  loading: false,
  error: null,
};

/* ---------------- THUNKS ---------------- */
export const fetchRequests = createAsyncThunk<RequestDto[]>(
  'requests/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get('/api/requests');
      return res.data.data as RequestDto[];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const fetchRequestById = createAsyncThunk<RequestDetailDto, number>(
  'requests/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const res = await apiClient.get(`/api/requests/${id}`);
      return res.data.data as RequestDetailDto;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

/* ---------------- SLICE ---------------- */
const requestSlice = createSlice({
  name: 'requests',
  initialState,
  reducers: {
    clearSelectedRequest(state) {
      state.selectedRequest = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequests.fulfilled, (state, action: PayloadAction<RequestDto[]>) => {
        state.loading = false;
        state.requests = action.payload;
      })
      .addCase(fetchRequests.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      })

      .addCase(fetchRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRequestById.fulfilled, (state, action: PayloadAction<RequestDetailDto>) => {
        state.loading = false;
        state.selectedRequest = action.payload;
      })
      .addCase(fetchRequestById.rejected, (state, action: PayloadAction<any>) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearSelectedRequest } = requestSlice.actions;
export default requestSlice.reducer;
