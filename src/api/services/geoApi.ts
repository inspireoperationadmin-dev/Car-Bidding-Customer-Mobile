import apiClient from '../apiClient';
import type {
  Coordinates,
  AddressValidationResult,
  ReverseGeocodeResult,
  AddressSearchResult,
} from '../../types/api';

export type {Coordinates};

const geoApi = {
  validateAddress: async (address: string): Promise<AddressValidationResult> => {
    const response = await apiClient.post('/api/geo/validate-address', {address});
    return response.data?.data || response.data;
  },

  reverseGeocode: async (
    lat: number,
    lng: number,
    mapboxToken: string,
  ): Promise<ReverseGeocodeResult> => {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxToken}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const feature = data.features[0];
      const context = feature.context || [];

      let postalCode = '';
      let city = '';
      let country = '';

      for (const ctx of context) {
        if (ctx.id.startsWith('postcode')) {
          postalCode = ctx.text;
        } else if (ctx.id.startsWith('place')) {
          city = ctx.text;
        } else if (ctx.id.startsWith('country')) {
          country = ctx.text;
        }
      }

      return {
        address: feature.place_name,
        postalCode,
        city,
        country,
      };
    }

    throw new Error('No address found for coordinates');
  },

  searchAddress: async (
    query: string,
    mapboxToken: string,
  ): Promise<AddressSearchResult[]> => {
    if (!query || query.length < 3) {
      return [];
    }

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      query,
    )}.json?access_token=${mapboxToken}&autocomplete=true&limit=5`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.features) {
      return data.features.map((feature: any) => ({
        id: feature.id,
        address: feature.place_name,
        coordinates: {
          lng: feature.center[0],
          lat: feature.center[1],
        },
      }));
    }

    return [];
  },
};

export default geoApi;
