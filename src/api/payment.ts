// src/api/payment.ts
import axios from "axios";
import {ENV} from '../config/env';
import type {
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  PaymentStatusResponse,
} from '../types/api';

const api = axios.create({
  baseURL: ENV.apiBaseUrl,
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  return config;
});

export const paymentApi = {
  processPayment: async (payload: ProcessPaymentRequest) => {
    const {data} = await api.post<ProcessPaymentResponse>('/payments/process', payload);
    return data;
  },

  getPaymentStatus: async (paymentId: string) => {
    const {data} = await api.get<PaymentStatusResponse>(`/payments/${paymentId}/status`);
    return data;
  },

  updatePaymentStatus: async (paymentId: string, status: string) => {
    const {data} = await api.patch<{ok: boolean}>(`/payments/${paymentId}/status`, {status});
    return data;
  },
};
