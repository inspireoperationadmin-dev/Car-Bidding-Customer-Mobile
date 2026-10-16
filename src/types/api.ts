// src/types/api.ts
// Central typed models for all API request payloads and responses.
// Every API file and slice imports types from here — never define them inline.

// ===================== AUTH =====================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  otp?: string;
}

export interface SendOtpRequest {
  email: string;
  phone?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// ===================== USER / PROFILE =====================

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  [k: string]: any;
}

export interface ProfileStats {
  totalRequests: number;
  activeRequests: number;
  completedRequests: number;
  totalSavings: number;
}

export interface CustomerProfile {
  id: number;
  firstName: string;
  lastName: string;
  phoneNo?: string;
  email: string;
  address?: string;
  preferredContactMethod?: string;
  activeJobsCount: number;
  stats: ProfileStats;
}

export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phoneNo?: string;
  address?: string;
  preferredContactMethod?: string;
}

// ===================== REQUESTS =====================

export type RequestStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'BIDDING'
  | 'BIDS_VIEWABLE'
  | 'MECHANIC_SELECTED'
  | 'COMPLETED';

export interface RequestDto {
  id: number;
  carBrand: string;
  carModel: string;
  carYear: string;
  status: RequestStatus;
  createdAt: string;
}

export interface RequestDetailDto extends RequestDto {
  description: string;
  images: string[];
  updatedAt: string;
}

// ===================== NOTIFICATIONS =====================

export interface Notification {
  id: number;
  userId: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  data: any;
  createdAt: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export interface GetNotificationsParams {
  limit?: number;
  offset?: number;
}

// ===================== PAYMENT =====================

export interface ProcessPaymentRequest {
  amount: number;         // in cents
  currency: string;       // e.g. "eur"
  paymentMethodId: string;
  auctionId?: string;
  userId?: string;
}

export interface ProcessPaymentResponse {
  paymentId: string;
  clientSecret: string;
}

export interface PaymentInitResponse {
  success: boolean;
  message?: string;
  data?: {
    clientSecret?: string;
    paymentId?: number | string;
    status?: string;
  };
}

export type PaymentStatus =
  | 'requires_payment_method'
  | 'requires_confirmation'
  | 'requires_action'
  | 'processing'
  | 'succeeded'
  | 'canceled'
  | 'failed';

export interface PaymentStatusResponse {
  paymentId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  message?: string;
  updatedAt?: string;
}

export interface UpdatePaymentStatusRequest {
  paymentId: string;
  status: string;
}

// ===================== GEO =====================

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface ValidateAddressRequest {
  address: string;
}

export interface AddressValidationResult {
  isValid: boolean;
  normalizedAddress?: string;
  coordinates?: Coordinates;
  details?: {
    city?: string;
    postalCode?: string;
    country?: string;
  };
}

export interface ReverseGeocodeResult {
  address: string;
  postalCode?: string;
  city?: string;
  country?: string;
}

export interface AddressSearchResult {
  id: string;
  address: string;
  coordinates: Coordinates;
}

// ===================== SHARED SCREEN/API HELPERS =====================

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export type RequestStatusLike = RequestStatus | string;

export interface RequestImageDto {
  id?: number;
  requestId?: number;
  url?: string;
  imageUrl?: string;
  path?: string;
}

export interface RequestEntity {
  id: number;
  customerId?: number;
  status: RequestStatusLike;
  carBrand?: string;
  carModel?: string;
  carYear?: string;
  numberPlate?: string;
  description?: string;
  location?: string;
  transmission?: string;
  vin?: string;
  preferredContactMethod?: string;
  createdAt?: string;
  updatedAt?: string;
  bidsViewable?: boolean;
  images?: RequestImageDto[] | string[];
}

export type RequestListResponse = ApiResponse<RequestEntity[]> & {
  pagination?: unknown;
};

export interface MechanicProfileEntity {
  id: number;
  name: string;
  rating: number;
  reviewsCount: number;
  phone: string;
  address: string;
  experience: string;
  about: string;
}
