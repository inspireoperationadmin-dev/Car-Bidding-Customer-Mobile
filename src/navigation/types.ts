export type OtpVerificationParams = {
  formData: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  otp: string;
  email: string;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  PasswordReset: undefined;
  OtpVerification: OtpVerificationParams;
};

// ✅ Tabs-only
export type AppTabParamList = {
  Home: undefined;
  Requests: undefined;
  Notifications: undefined;
  SubmitRequest: undefined;
  Profile: undefined;
};

// ✅ Stack screens (Tabs + hidden screens)
export type AppStackParamList = {
  Tabs: undefined;

  RequestDetail: { requestId: number };
  Bids: { requestId: number };
  Payment: { requestId: string; amount: number };
  MechanicMap: { requestId: string };
  MechanicProfile: { mechanicId: string };
  PersonalInfo: undefined;

  PaymentConfirmation: {
    paymentStatus: 'success' | 'failure';
    requestId: string;
    paymentId?: string;
    amount?: number;
    transactionId?: string;
    errorMessage?: string;
  };
};

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
