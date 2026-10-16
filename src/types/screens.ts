export interface BidsApiBid {
  id: number;
  requestId: number;
  mechanicId: number;
  price: number;
  notes?: string | null;
  durationDays?: number | null;
  durationHours?: number | null;
  status?: string;
  appointmentDates?: string[] | null;
  mechanic?: {
    id: number;
    businessName?: string | null;
    businessAddress?: string | null;
    contactNumber?: string | null;
    profilePic?: string | null;
    ratingSummary?: {
      averageRating: number;
      ratingCount: number;
    } | null;
    lat?: number;
    lng?: number;
  } | null;
}

export interface BidsBidItem {
  id: number;
  mechanicName: string;
  price: number;
  duration: string;
  rating?: number;
  ratingCount?: number;
  mechanicId?: number;
  phone?: string;
  address?: string;
  notes?: string;
  lat?: number;
  lng?: number;
  distance?: number;
  color: string;
  routeGeoJSON?: GeoJSON.FeatureCollection | null;
  routeDistanceKm?: number;
  appointmentDates?: string[];
}

export interface BidsBookingInfo {
  id: number;
  bidId: number;
  mechanicId: number;
  appointmentDate: string;
  status: string;
}

export type BidsCustomerLocationApi = {
  lat: number;
  lng: number;
  address: string;
} | null;
