import {
  API_BASE_URL,
  STRIPE_PUBLISHABLE_KEY,
  MAPBOX_TOKEN,
  LOGIN_IMAGE_URL,
} from '@env';

export type AppEnv = {
  apiBaseUrl: string;
  stripePublishableKey: string;
  mapboxToken: string;
  loginImageUrl: string;
};

export const ENV: AppEnv = {
  apiBaseUrl: API_BASE_URL,
  stripePublishableKey: STRIPE_PUBLISHABLE_KEY,
  mapboxToken: MAPBOX_TOKEN,
  loginImageUrl: LOGIN_IMAGE_URL,
};
