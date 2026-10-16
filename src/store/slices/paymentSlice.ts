// src/store/slices/paymentSlice.ts
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import {paymentApi} from "../../api/payment";
import type {
  ProcessPaymentRequest,
  PaymentStatusResponse,
  UpdatePaymentStatusRequest,
} from "../../types/api";

type PaymentState = {
  processing: boolean;
  statusLoading: boolean;
  error: string | null;

  paymentId: string | null;
  clientSecret: string | null;

  status: PaymentStatusResponse["status"] | null;
  statusDetails: PaymentStatusResponse | null;
};

const initialState: PaymentState = {
  processing: false,
  statusLoading: false,
  error: null,
  paymentId: null,
  clientSecret: null,
  status: null,
  statusDetails: null,
};

export const processPaymentThunk = createAsyncThunk(
  "payment/processPayment",
  async (payload: ProcessPaymentRequest, { rejectWithValue }) => {
    try {
      const res = await paymentApi.processPayment(payload);
      return res; // { paymentId, clientSecret }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Payment API failed";
      return rejectWithValue(msg);
    }
  }
);

export const getPaymentStatusThunk = createAsyncThunk(
  "payment/getStatus",
  async (paymentId: string, { rejectWithValue }) => {
    try {
      return await paymentApi.getPaymentStatus(paymentId);
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Get status failed";
      return rejectWithValue(msg);
    }
  }
);

// optional
export const updatePaymentStatusThunk = createAsyncThunk(
  "payment/updateStatus",
  async ({paymentId, status}: UpdatePaymentStatusRequest, { rejectWithValue }) => {
    try {
      await paymentApi.updatePaymentStatus(paymentId, status);
      return { paymentId, status };
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Update status failed";
      return rejectWithValue(msg);
    }
  }
);

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    clearPaymentError(state) {
      state.error = null;
    },
    resetPaymentState() {
      return initialState;
    },
    setPaymentId(state, action: PayloadAction<string | null>) {
      state.paymentId = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // process
      .addCase(processPaymentThunk.pending, (state) => {
        state.processing = true;
        state.error = null;
      })
      .addCase(processPaymentThunk.fulfilled, (state, action) => {
        state.processing = false;
        state.paymentId = action.payload.paymentId;
        state.clientSecret = action.payload.clientSecret;
      })
      .addCase(processPaymentThunk.rejected, (state, action) => {
        state.processing = false;
        state.error = (action.payload as string) || "Payment failed";
      })

      // status
      .addCase(getPaymentStatusThunk.pending, (state) => {
        state.statusLoading = true;
        state.error = null;
      })
      .addCase(getPaymentStatusThunk.fulfilled, (state, action) => {
        state.statusLoading = false;
        state.statusDetails = action.payload;
        state.status = action.payload.status;
      })
      .addCase(getPaymentStatusThunk.rejected, (state, action) => {
        state.statusLoading = false;
        state.error = (action.payload as string) || "Status fetch failed";
      })

      // update
      .addCase(updatePaymentStatusThunk.pending, () => {
        // keep light
      })
      .addCase(updatePaymentStatusThunk.fulfilled, (state, action) => {
        // local reflect
        state.status = action.payload.status as any;
      })
      .addCase(updatePaymentStatusThunk.rejected, (state, action) => {
        // optional: don’t block UX
        state.error = (action.payload as string) || state.error;
      });
  },
});

export const { clearPaymentError, resetPaymentState, setPaymentId } = paymentSlice.actions;
export default paymentSlice.reducer;
