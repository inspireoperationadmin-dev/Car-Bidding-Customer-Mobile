// src/screens/BidsMap.tsx
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Modal,
  Pressable,
  ScrollView,
  FlatList,
  Animated,
  PanResponder,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import Mapbox from '../config/mapbox';
import Geolocation from 'react-native-geolocation-service';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/Feather';
import apiClient from '../api/apiClient';
import {ENV} from '../config/env';
import {AppStackParamList} from '../navigation/types';
import {theme} from '../theme';
import SuccessModal from '../components/common/SuccessModal';
import {
  BidsApiBid,
  BidsBidItem,
  BidsBookingInfo,
  BidsCustomerLocationApi,
} from '../types/screens';

const {height: SCREEN_HEIGHT} = Dimensions.get('window');
const SHEET_MAX = SCREEN_HEIGHT * 0.55;
const SHEET_MID = SCREEN_HEIGHT * 0.35;
const SHEET_MIN = 120;

/* ── Types ─────────────────────────────────────── */

/* ── Color palette for mechanics ── */

const MECHANIC_COLORS = theme.colors.mechanicPalette;

/* ── Helpers ───────────────────────────────────── */

function formatDuration(days?: number | null, hours?: number | null): string {
  const parts: string[] = [];
  if (days && days > 0) parts.push(`${days}d`);
  if (hours && hours > 0) parts.push(`${hours}h`);
  return parts.length ? parts.join(' ') : '-';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map(w => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function isValidCoord(v?: number) {
  return typeof v === 'number' && Number.isFinite(v) && Math.abs(v) > 0;
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(1)}km`;
}

function parseAppointmentDates(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean).map(String);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean).map(String);
    } catch {}
  }
  return [];
}

function mapApiBidToItem(
  b: BidsApiBid,
  customerLoc: [number, number] | null,
  colorIndex: number,
): BidsBidItem {
  const lat = b.mechanic?.lat;
  const lng = b.mechanic?.lng;
  let distance: number | undefined;
  if (customerLoc && isValidCoord(lat) && isValidCoord(lng)) {
    distance = haversineKm(customerLoc[1], customerLoc[0], lat!, lng!);
  }
  return {
    id: b.id,
    mechanicName: b.mechanic?.businessName || `Mechanic #${b.mechanicId}`,
    price: typeof b.price === 'number' ? b.price : Number(b.price),
    duration: formatDuration(b.durationDays, b.durationHours),
    rating: b.mechanic?.ratingSummary ? Number(b.mechanic.ratingSummary.averageRating) : undefined,
    ratingCount: b.mechanic?.ratingSummary?.ratingCount,
    mechanicId: b.mechanic?.id ?? b.mechanicId,
    phone: b.mechanic?.contactNumber ?? undefined,
    address: b.mechanic?.businessAddress ?? undefined,
    notes: b.notes ?? undefined,
    lat,
    lng,
    distance,
    color: MECHANIC_COLORS[colorIndex % MECHANIC_COLORS.length],
    appointmentDates: parseAppointmentDates(b.appointmentDates),
  };
}

const DEFAULT_CENTER: [number, number] = [79.8612, 6.9271];
const DEFAULT_ZOOM = 11;

const CUSTOMER_COLOR = theme.colors.successDark;

async function geocodeAddress(address: string): Promise<[number, number] | null> {
  try {
    const encoded = encodeURIComponent(address);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encoded}.json?access_token=${ENV.mapboxToken}&limit=1`;
    const res = await fetch(url);
    const data = await res.json();
    const coords = data?.features?.[0]?.center;
    if (coords && coords.length === 2) return coords as [number, number];
  } catch {}
  return null;
}

async function fetchDrivingRoute(
  from: [number, number],
  to: [number, number],
): Promise<{geometry: GeoJSON.LineString; distanceKm: number} | null> {
  try {
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${from[0]},${from[1]};${to[0]},${to[1]}?geometries=geojson&overview=full&access_token=${ENV.mapboxToken}`;
    const res = await fetch(url);
    const data = await res.json();
    const route = data?.routes?.[0];
    if (route?.geometry) {
      return {
        geometry: route.geometry as GeoJSON.LineString,
        distanceKm: (route.distance ?? 0) / 1000,
      };
    }
  } catch {}
  return null;
}

/* ── Component ─────────────────────────────────── */

const BidsMap: React.FC = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'Bids'>>();
  const {requestId} = route.params;

  const topSafe =
    Platform.OS === 'android'
      ? (StatusBar.currentHeight || 28) + 12
      : Math.max(insets.top, 12) + 4;

  const cameraRef = useRef<Mapbox.Camera>(null);

  const [bids, setBids] = useState<BidsBidItem[]>([]);
  const [loading, setLoading] = useState(true);

  const [locked, setLocked] = useState(false);
  const [lockedCount, setLockedCount] = useState<number>(0);
  const [unlockPrice, setUnlockPrice] = useState<number>(50);
  const [errorText, setErrorText] = useState<string | null>(null);

  const [myLoc, setMyLoc] = useState<[number, number] | null>(null);
  const [customerAddr, setCustomerAddr] = useState<string | null>(null);
  const [locLoading, setLocLoading] = useState(true);

  const [selected, setSelected] = useState<BidsBidItem | null>(null);
  const [highlightedBid, setHighlightedBid] = useState<BidsBidItem | null>(null);
  const mechanicCycleIdx = useRef(0);

  /* ── Booking state ── */
  const [bookings, setBookings] = useState<BidsBookingInfo[]>([]);
  const [bookingTarget, setBookingTarget] = useState<BidsBidItem | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccessData, setBookingSuccessData] = useState<{
    mechanicName: string;
    dateFormatted: string;
  } | null>(null);

  /* ── State-driven camera (more reliable than imperative setCamera) ── */
  const [cameraTarget, setCameraTarget] = useState<{
    center: [number, number];
    zoom: number;
    ts: number;
  } | null>(null);

  /* ── Bottom sheet animation ── */
  const sheetAnim = useRef(new Animated.Value(SHEET_MID)).current;
  const sheetHeight = useRef(SHEET_MID);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        sheetAnim.stopAnimation(v => {
          sheetHeight.current = v ?? SHEET_MID;
          sheetAnim.setOffset(sheetHeight.current);
          sheetAnim.setValue(0);
        });
      },
      onPanResponderMove: (_, g) => {
        sheetAnim.setValue(-g.dy);
      },
      onPanResponderRelease: (_, g) => {
        sheetAnim.flattenOffset();
        const current = sheetHeight.current + -g.dy;
        let snapTo = SHEET_MID;

        if (g.vy < -0.5 || current > (SHEET_MID + SHEET_MAX) / 2) {
          snapTo = SHEET_MAX;
        } else if (g.vy > 0.5 || current < (SHEET_MIN + SHEET_MID) / 2) {
          snapTo = SHEET_MIN;
        }

        sheetHeight.current = snapTo;
        Animated.spring(sheetAnim, {
          toValue: snapTo,
          useNativeDriver: false,
          friction: 9,
          tension: 60,
        }).start();
      },
    }),
  ).current;

  const snapSheet = useCallback(
    (to: number) => {
      sheetHeight.current = to;
      Animated.spring(sheetAnim, {
        toValue: to,
        useNativeDriver: false,
        friction: 9,
        tension: 60,
      }).start();
    },
    [sheetAnim],
  );

  /* ── Ref to avoid re-fetching when GPS arrives ── */
  const myLocRef = useRef<[number, number] | null>(null);
  myLocRef.current = myLoc;

  /* ── Fetch bids ── */
  const fetchBids = useCallback(async () => {
    if (!requestId) return;

    try {
      setLoading(true);
      setErrorText(null);

      const res = await apiClient.get(`/api/bids/request/${requestId}`);
      const payload = res.data?.data ?? res.data;

      // Legacy locked bids check (count-only response without mechanic data)
      if (payload?.count !== undefined && !Array.isArray(payload) && !payload?.bids) {
        setLocked(true);
        setLockedCount(Number(payload.count) || 0);
        setUnlockPrice(Number(payload.priceToUnlock ?? 50));
        setBids([]);
        return;
      }

      // Parse response format: { bids: [...], customerLocation: {...}, locked?: boolean, unlockPrice?: number }
      // Also handle legacy format where payload is directly an array
      let arr: BidsApiBid[];
      let apiCustomerLoc: BidsCustomerLocationApi = null;

      if (payload?.bids && Array.isArray(payload.bids)) {
        arr = payload.bids;
        apiCustomerLoc = payload.customerLocation ?? null;
        // New locked format: has bids with mechanic profiles but bid details are hidden
        if (payload.locked) {
          setLocked(true);
          setLockedCount(arr.length);
          setUnlockPrice(Number(payload.unlockPrice ?? 50));
        } else {
          setLocked(false);
          setLockedCount(0);
          setUnlockPrice(50);
        }
      } else if (Array.isArray(payload)) {
        arr = payload;
        setLocked(false);
        setLockedCount(0);
        setUnlockPrice(50);
      } else {
        arr = [];
        setLocked(false);
        setLockedCount(0);
        setUnlockPrice(50);
      }

      // Use customer location from API if available
      let customerLocCoord: [number, number] | null = myLocRef.current;
      if (apiCustomerLoc && isValidCoord(apiCustomerLoc.lat) && isValidCoord(apiCustomerLoc.lng)) {
        customerLocCoord = [apiCustomerLoc.lng, apiCustomerLoc.lat];
        setMyLoc(customerLocCoord);
        setCustomerAddr(apiCustomerLoc.address);
        setLocLoading(false);
      }

      const items = arr.map((b, idx) => mapApiBidToItem(b, customerLocCoord, idx));

      // Geocode mechanics that don't have coordinates
      const geocodePromises = items.map(async item => {
        if (!isValidCoord(item.lat) || !isValidCoord(item.lng)) {
          if (item.address) {
            const coords = await geocodeAddress(item.address);
            if (coords) {
              item.lng = coords[0];
              item.lat = coords[1];
              if (customerLocCoord) {
                item.distance = haversineKm(customerLocCoord[1], customerLocCoord[0], item.lat, item.lng);
              }
            }
          }
        }
        return item;
      });
      const geocoded = await Promise.all(geocodePromises);

      // Fetch driving routes for all mechanics with valid coordinates
      if (customerLocCoord) {
        const routePromises = geocoded.map(async item => {
          if (isValidCoord(item.lat) && isValidCoord(item.lng)) {
            const result = await fetchDrivingRoute(customerLocCoord!, [item.lng!, item.lat!]);
            if (result) {
              item.routeGeoJSON = {
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  properties: {},
                  geometry: result.geometry,
                }],
              };
              item.routeDistanceKm = result.distanceKm;
              item.distance = result.distanceKm;
            }
          }
          return item;
        });
        const withRoutes = await Promise.all(routePromises);
        setBids(withRoutes);
      } else {
        setBids(geocoded);
      }
    } catch (e: any) {
      setErrorText(e?.response?.data?.message || e?.message || 'Failed to load bids');
      setLocked(false);
      setBids([]);
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchBids();
  }, [fetchBids]);

  /* ── Fetch existing bookings ── */
  const fetchBookings = useCallback(async () => {
    if (!requestId) return;
    try {
      const res = await apiClient.get(`/api/bookings/request/${requestId}`);
      const data = res.data?.data ?? res.data;
      if (Array.isArray(data)) setBookings(data);
    } catch {}
  }, [requestId]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  /* ── Create booking ── */
  const handleBooking = useCallback(async () => {
    if (!bookingTarget || !selectedDate) return;
    try {
      setBookingLoading(true);
      await apiClient.post('/api/bookings', {
        requestId,
        bidId: bookingTarget.id,
        appointmentDate: selectedDate,
      });
      const d = new Date(selectedDate);
      const dateFormatted = `${d.toLocaleDateString('en-GB', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
      })} at ${d.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      const mechanicName = bookingTarget.mechanicName;
      setBookingTarget(null);
      setSelectedDate(null);
      fetchBookings();
      fetchBids();
      setBookingSuccessData({
        mechanicName,
        dateFormatted,
      });
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Booking failed. Please try again.';
      Alert.alert('Booking Error', msg);
    } finally {
      setBookingLoading(false);
    }
  }, [bookingTarget, selectedDate, requestId, fetchBookings]);

  const isBooked = useCallback(
    (bidId: number) => bookings.some(b => b.bidId === bidId),
    [bookings],
  );

  /* ── Get user location (fallback if API doesn't provide customer address) ── */
  useEffect(() => {
    setLocLoading(true);
    Geolocation.getCurrentPosition(
      pos => {
        setMyLoc(prev => prev ?? [pos.coords.longitude, pos.coords.latitude]);
        setLocLoading(false);
      },
      () => {
        setLocLoading(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
        forceRequestLocation: Platform.OS === 'android',
      },
    );
  }, []);

  /* ── Markers ── */
  const markers = useMemo(() => bids.filter(b => isValidCoord(b.lat) && isValidCoord(b.lng)), [bids]);

  const allCoords = useMemo(() => {
    const coords: [number, number][] = [];
    if (myLoc) coords.push(myLoc);
    markers.forEach(m => coords.push([m.lng!, m.lat!]));
    return coords;
  }, [myLoc, markers]);

  const fitAll = useCallback(() => {
    if (!cameraRef.current || !allCoords.length) return;

    if (allCoords.length === 1) {
      cameraRef.current.setCamera({
        centerCoordinate: allCoords[0],
        zoomLevel: 14,
        animationDuration: 900,
      });
      return;
    }

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    allCoords.forEach(([lng, lat]) => {
      minLng = Math.min(minLng, lng);
      maxLng = Math.max(maxLng, lng);
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
    });

    cameraRef.current.fitBounds(
      [maxLng, maxLat],
      [minLng, minLat],
      [80, 60, 180, 60],
      900,
    );
  }, [allCoords]);

  useEffect(() => {
    const t = setTimeout(() => fitAll(), 600);
    return () => clearTimeout(t);
  }, [fitAll]);

  /* Clear cameraTarget after animation so it doesn't block other camera ops */
  useEffect(() => {
    if (cameraTarget) {
      const t = setTimeout(() => setCameraTarget(null), 1200);
      return () => clearTimeout(t);
    }
  }, [cameraTarget]);

  const initialCenter = useMemo(() => {
    if (myLoc) return myLoc;
    if (markers.length) return [markers[0].lng!, markers[0].lat!] as [number, number];
    return DEFAULT_CENTER;
  }, [myLoc, markers]);

  /* ── Bid press -> zoom + highlight ── */
  const onPressBid = useCallback(
    (item: BidsBidItem) => {
      setHighlightedBid(item);
      if (isValidCoord(item.lat) && isValidCoord(item.lng) && cameraRef.current) {
        if (myLoc) {
          cameraRef.current.fitBounds(
            [Math.max(myLoc[0], item.lng!), Math.max(myLoc[1], item.lat!)],
            [Math.min(myLoc[0], item.lng!), Math.min(myLoc[1], item.lat!)],
            [80, 60, 180, 60],
            900,
          );
        } else {
          cameraRef.current.setCamera({
            centerCoordinate: [item.lng!, item.lat!],
            zoomLevel: 15,
            animationDuration: 900,
          });
        }
      }
      snapSheet(SHEET_MIN);
    },
    [myLoc, snapSheet],
  );

  const onPressProfile = useCallback((item: BidsBidItem) => {
    setSelected(item);
  }, []);

  const renderLockedBidCard = useCallback(
    ({item}: {item: BidsBidItem}) => {
      const initials = getInitials(item.mechanicName);
      const isHighlighted = highlightedBid?.id === item.id;

      return (
        <TouchableOpacity
          style={[
            styles.bidCard,
            isHighlighted ? [styles.bidCardHighlighted, {borderColor: item.color, shadowColor: item.color}] : null,
          ]}
          activeOpacity={0.9}
          onPress={() => onPressBid(item)}>
          {isHighlighted && (
            <View style={[styles.highlightBanner, {backgroundColor: `${item.color}15`}]}>
              <View style={styles.highlightBadgeLeft}>
                <View style={[styles.pulseDot, {backgroundColor: item.color}]} />
                <Text style={[styles.highlightBannerText, {color: item.color}]}>
                  SELECTED MECHANIC
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.profilePillBtn, {backgroundColor: item.color}]}
                onPress={() => onPressBid(item)}
                activeOpacity={0.8}>
                <Text style={styles.profilePillText}>Unlock Details</Text>
                <Icon name="lock" size={11} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.cardMainRow}>
            <View style={styles.avatarWrapper}>
              <View style={[styles.cardAvatarSquircle, {backgroundColor: item.color}]}>
                <Text style={styles.cardAvatarText}>{initials}</Text>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.mechanicName}
                </Text>
                {typeof item.rating === 'number' ? (
                  <View style={styles.ratingBadge}>
                    <Icon name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
                    {typeof item.ratingCount === 'number' ? (
                      <Text style={styles.ratingCountText}>({item.ratingCount})</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              <View style={styles.pillsRow}>
                <View style={styles.lockedPricePill}>
                  <Icon name="lock" size={11} color={theme.colors.muted} />
                  <Text style={styles.lockedPricePillText}>Bid Details Locked</Text>
                </View>

                {item.distance !== undefined ? (
                  <View style={[styles.distancePill, {backgroundColor: `${item.color}15`}]}>
                    <Icon name="navigation" size={11} color={item.color} />
                    <Text style={[styles.distancePillText, {color: item.color}]}>
                      {formatDistance(item.distance)} {item.routeDistanceKm !== undefined ? 'drive' : 'away'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {item.address ? (
                <View style={styles.addressRow}>
                  <Icon name="map-pin" size={11} color={theme.colors.mutedText} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              ) : null}
            </View>

            <View style={styles.cardRight}>
              <View style={styles.lockedBadge}>
                <Icon name="lock" size={14} color={theme.colors.muted} />
              </View>
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [onPressBid, highlightedBid],
  );

  const renderBidCard = useCallback(
    ({item}: {item: BidsBidItem}) => {
      const initials = getInitials(item.mechanicName);
      const isHighlighted = highlightedBid?.id === item.id;

      return (
        <TouchableOpacity
          style={[
            styles.bidCard,
            isHighlighted ? [styles.bidCardHighlighted, {borderColor: item.color, shadowColor: item.color}] : null,
          ]}
          activeOpacity={0.9}
          onPress={() => onPressBid(item)}>
          {isHighlighted && (
            <View style={[styles.highlightBanner, {backgroundColor: `${item.color}15`}]}>
              <View style={styles.highlightBadgeLeft}>
                <View style={[styles.pulseDot, {backgroundColor: item.color}]} />
                <Text style={[styles.highlightBannerText, {color: item.color}]}>
                  SELECTED MECHANIC
                </Text>
              </View>
              <TouchableOpacity
                style={[styles.profilePillBtn, {backgroundColor: item.color}]}
                onPress={() => onPressProfile(item)}
                activeOpacity={0.8}>
                <Text style={styles.profilePillText}>View Details</Text>
                <Icon name="arrow-right" size={11} color={theme.colors.white} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.cardMainRow}>
            {/* Avatar */}
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() => onPressProfile(item)}
              style={styles.avatarWrapper}>
              <View style={[styles.cardAvatarSquircle, {backgroundColor: item.color}]}>
                <Text style={styles.cardAvatarText}>{initials}</Text>
              </View>
              <View style={styles.verifiedBadge}>
                <Icon name="check" size={9} color={theme.colors.white} />
              </View>
            </TouchableOpacity>

            {/* Center Info */}
            <View style={styles.cardBody}>
              <View style={styles.cardTitleRow}>
                <Text style={styles.cardName} numberOfLines={1}>
                  {item.mechanicName}
                </Text>
                {typeof item.rating === 'number' ? (
                  <View style={styles.ratingBadge}>
                    <Icon name="star" size={11} color="#F59E0B" />
                    <Text style={styles.ratingBadgeText}>{item.rating.toFixed(1)}</Text>
                    {typeof item.ratingCount === 'number' ? (
                      <Text style={styles.ratingCountText}>({item.ratingCount})</Text>
                    ) : null}
                  </View>
                ) : null}
              </View>

              {/* Badges row */}
              <View style={styles.pillsRow}>
                <View style={styles.pricePill}>
                  <Text style={styles.pricePillText}>
                    {'\u20AC'}{item.price}
                  </Text>
                </View>

                <View style={styles.durationPill}>
                  <Icon name="clock" size={11} color={theme.colors.muted} />
                  <Text style={styles.durationPillText}>{item.duration}</Text>
                </View>

                {item.distance !== undefined ? (
                  <View style={[styles.distancePill, {backgroundColor: `${item.color}15`}]}>
                    <Icon name="navigation" size={11} color={item.color} />
                    <Text style={[styles.distancePillText, {color: item.color}]}>
                      {formatDistance(item.distance)} {item.routeDistanceKm !== undefined ? 'drive' : 'away'}
                    </Text>
                  </View>
                ) : null}
              </View>

              {item.address ? (
                <View style={styles.addressRow}>
                  <Icon name="map-pin" size={11} color={theme.colors.mutedText} />
                  <Text style={styles.addressText} numberOfLines={1}>
                    {item.address}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Right section */}
            <View style={styles.cardRight}>
              {isBooked(item.id) ? (
                <View style={styles.bookedBadge}>
                  <Icon name="check-circle" size={12} color={theme.colors.successDark} />
                  <Text style={styles.bookedBadgeText}>Booked</Text>
                </View>
              ) : !isHighlighted ? (
                <TouchableOpacity
                  onPress={() => onPressProfile(item)}
                  style={styles.chevronCircle}
                  activeOpacity={0.7}>
                  <Icon name="chevron-right" size={16} color={theme.colors.muted} />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [onPressBid, onPressProfile, highlightedBid],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />

      {/* Map — fills the whole screen behind the sheet */}
      <View style={styles.mapContainer}>
        <Mapbox.MapView
          style={StyleSheet.absoluteFill}
          styleURL={Mapbox.StyleURL.Street}
          scaleBarEnabled={false}
          attributionEnabled={false}
          logoEnabled={false}>
          <Mapbox.Camera
            ref={cameraRef}
            defaultSettings={{
              centerCoordinate: initialCenter,
              zoomLevel: DEFAULT_ZOOM,
            }}
            {...(cameraTarget
              ? {
                  centerCoordinate: cameraTarget.center,
                  zoomLevel: cameraTarget.zoom,
                  animationDuration: 900,
                  animationMode: 'flyTo' as const,
                }
              : {})}
          />

          {/* Customer location marker */}
          {myLoc ? (
            <Mapbox.MarkerView id="customer-location" coordinate={myLoc}>
              <View style={styles.customerMarkerWrap}>
                <View style={styles.customerMarker}>
                  <Icon name="user" size={20} color={theme.colors.white} />
                </View>
                <Text style={styles.customerLabel}>
                  {customerAddr ? 'You' : 'You (GPS)'}
                </Text>
              </View>
            </Mapbox.MarkerView>
          ) : null}

          {/* Driving route lines for ALL mechanics */}
          {markers.map(m => {
            if (!m.routeGeoJSON) return null;
            const isHL = highlightedBid?.id === m.id;
            return (
              <Mapbox.ShapeSource
                key={`route-${m.id}`}
                id={`route-${m.id}`}
                shape={m.routeGeoJSON}>
                <Mapbox.LineLayer
                  id={`route-line-${m.id}`}
                  style={{
                    lineColor: m.color,
                    lineWidth: isHL ? 5 : 3,
                    lineDasharray: isHL ? [1, 0] : [4, 3],
                    lineOpacity: isHL ? 0.9 : 0.5,
                  }}
                />
              </Mapbox.ShapeSource>
            );
          })}

          {/* Fallback straight lines for mechanics without route data */}
          {markers.map(m => {
            if (m.routeGeoJSON || !myLoc) return null;
            const fallbackLine = {
              type: 'FeatureCollection' as const,
              features: [{
                type: 'Feature' as const,
                properties: {},
                geometry: {
                  type: 'LineString' as const,
                  coordinates: [myLoc, [m.lng!, m.lat!]],
                },
              }],
            };
            const isHL = highlightedBid?.id === m.id;
            return (
              <Mapbox.ShapeSource
                key={`fallback-line-${m.id}`}
                id={`fallback-line-${m.id}`}
                shape={fallbackLine}>
                <Mapbox.LineLayer
                  id={`fallback-line-layer-${m.id}`}
                  style={{
                    lineColor: m.color,
                    lineWidth: isHL ? 4 : 2,
                    lineDasharray: [6, 4],
                    lineOpacity: isHL ? 0.7 : 0.35,
                  }}
                />
              </Mapbox.ShapeSource>
            );
          })}

          {/* Mechanic markers — each with unique color */}
          {markers.map(m => {
            const initials = getInitials(m.mechanicName);
            const isHL = highlightedBid?.id === m.id;

            return (
              <Mapbox.MarkerView
                key={String(m.id)}
                id={`bid-${m.id}`}
                coordinate={[m.lng!, m.lat!]}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setHighlightedBid(m);
                    snapSheet(SHEET_MIN);
                  }}
                  style={styles.mechanicMarkerWrap}>
                  <View style={[
                    styles.mechanicMarker,
                    {backgroundColor: m.color},
                    isHL && {borderColor: theme.colors.focusRing, borderWidth: 4, transform: [{scale: 1.15}]},
                  ]}>
                    <Text style={styles.mechanicMarkerText}>{initials}</Text>
                  </View>
                  {m.distance !== undefined ? (
                    <View style={[
                      styles.distanceBadge,
                      isHL && {backgroundColor: m.color, borderColor: m.color},
                    ]}>
                      <Text style={[
                        styles.distanceBadgeText,
                        isHL && {color: theme.colors.white},
                      ]}>
                        {formatDistance(m.distance)}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              </Mapbox.MarkerView>
            );
          })}
        </Mapbox.MapView>

        {/* FABs */}
        <View style={styles.fabRow}>
          <TouchableOpacity style={styles.fab} onPress={fitAll} activeOpacity={0.9}>
            <Icon name="maximize" size={18} color={theme.colors.white} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.fab, {marginLeft: 8}]}
            onPress={fetchBids}
            activeOpacity={0.9}>
            <Icon name="refresh-cw" size={18} color={theme.colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Top Floating Controls (Safely offset below Android status bar) */}
      <View
        pointerEvents="box-none"
        style={[styles.topControlsContainer, {top: topSafe}]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}>
            <Icon name="arrow-left" size={20} color={theme.colors.textStrong} />
          </TouchableOpacity>
          <Text style={styles.title}>Bids Map</Text>
          <View style={{width: 44}} />
        </View>

        {/* Top info overlay */}
        <View style={styles.topInfo}>
          <Text style={styles.topInfoText}>
            Bids ·{' '}
            {locked ? `Locked: ${lockedCount}` : `Bids: ${bids.length}`}
          </Text>
          {customerAddr ? (
            <View style={styles.row}>
              <Icon name="home" size={11} color={CUSTOMER_COLOR} />
              <Text style={styles.muted} numberOfLines={1}> {customerAddr}</Text>
            </View>
          ) : locLoading ? (
            <View style={styles.row}>
              <ActivityIndicator size="small" />
              <Text style={styles.muted}> Getting your location...</Text>
            </View>
          ) : null}
        </View>

        {/* Legend (interactive) */}
        <View style={styles.legend}>
          <TouchableOpacity
            style={styles.legendItem}
            activeOpacity={0.6}
            onPress={() => {
              if (myLoc) {
                setCameraTarget({center: myLoc, zoom: 15, ts: Date.now()});
              }
            }}>
            <View style={[styles.legendDot, {backgroundColor: CUSTOMER_COLOR}]} />
            <Text style={styles.legendText}>You</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.legendItem}
            activeOpacity={0.6}
            onPress={() => {
              if (!markers.length) return;
              const idx = mechanicCycleIdx.current % markers.length;
              const m = markers[idx];
              mechanicCycleIdx.current = idx + 1;
              setHighlightedBid(m);
              setCameraTarget({center: [m.lng!, m.lat!], zoom: 15, ts: Date.now()});
              snapSheet(SHEET_MIN);
            }}>
            <View style={[styles.legendDot, {backgroundColor: theme.colors.muted}]} />
            <Text style={styles.legendText}>Mechanics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Draggable bottom sheet */}
      <Animated.View style={[styles.bottomSheet, {height: sheetAnim}]}>
        {/* Drag handle */}
        <View {...panResponder.panHandlers} style={styles.dragHandleArea}>
          <View style={styles.dragHandle} />
          {/* Snap buttons */}
          <View style={styles.snapRow}>
            <TouchableOpacity onPress={() => snapSheet(SHEET_MIN)} style={styles.snapBtn}>
              <Icon name="chevron-down" size={16} color={theme.colors.muted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => snapSheet(SHEET_MAX)} style={styles.snapBtn}>
              <Icon name="chevron-up" size={16} color={theme.colors.muted} />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.sheetCenter}>
            <Text style={styles.listTitle}>Loading bids...</Text>
            <ActivityIndicator style={{marginTop: 14}} />
          </View>
        ) : errorText ? (
          <View style={styles.sheetCenter}>
            <Text style={styles.listTitle}>Error</Text>
            <Text style={styles.lockText}>{errorText}</Text>
            <TouchableOpacity style={[styles.btnPrimary, {marginTop: 12}]} onPress={fetchBids}>
              <Text style={styles.btnPrimaryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8}}>
              <Text style={styles.listTitle}>
                {bids.length ? `${bids.length} Bid${bids.length !== 1 ? 's' : ''}` : 'No bids yet'}
              </Text>
              {bookings.length > 0 && (
                <View style={{flexDirection: 'row', alignItems: 'center', backgroundColor: '#ecfdf5', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: '#a7f3d0'}}>
                  <Icon name="check-circle" size={13} color="#059669" />
                  <Text style={{marginLeft: 5, fontSize: 11, fontWeight: '700', color: '#059669'}}>
                    Bidding Ended
                  </Text>
                </View>
              )}
            </View>

            {/* Pay to unlock banner when bids are locked */}
            {locked ? (
              <View style={styles.unlockBanner}>
                <View style={styles.unlockBannerLeft}>
                  <Icon name="lock" size={18} color={theme.colors.info} />
                  <View style={{marginLeft: 10, flex: 1}}>
                    <Text style={styles.unlockBannerTitle}>Bid details are locked</Text>
                    <Text style={styles.unlockBannerSub}>
                      Pay {'\u20AC'}{unlockPrice} to see prices, contact info & book
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.unlockBtn}
                  onPress={() =>
                    navigation.navigate('Payment', {
                      requestId: String(requestId),
                      amount: unlockPrice,
                    })
                  }
                  activeOpacity={0.9}>
                  <Icon name="unlock" size={14} color={theme.colors.white} />
                  <Text style={styles.unlockBtnText}>
                    Unlock {'\u20AC'}{unlockPrice}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : null}

            <FlatList
              data={bids}
              keyExtractor={item => String(item.id)}
              renderItem={locked ? renderLockedBidCard : renderBidCard}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.listContent,
                {paddingBottom: 24 + insets.bottom},
              ]}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No bids yet for this request.</Text>
              }
            />
          </>
        )}
      </Animated.View>

      {/* Mechanic detail sheet modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setSelected(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandleBar} />

          <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.sheetHeader}>
              <View
                style={[
                  styles.sheetAvatar,
                  {backgroundColor: selected?.color ?? theme.colors.muted},
                ]}>
                <Text style={styles.sheetAvatarText}>
                  {getInitials(selected?.mechanicName ?? '')}
                </Text>
              </View>
              <View style={{flex: 1, marginLeft: 14}}>
                <Text style={styles.sheetTitle}>{selected?.mechanicName}</Text>
                {typeof selected?.rating === 'number' ? (
                  <View style={styles.ratingRow}>
                    <Icon name="star" size={14} color={theme.colors.warning} />
                    <Text style={styles.ratingText}>
                      {selected.rating.toFixed(1)}
                      {typeof selected.ratingCount === 'number'
                        ? ` (${selected.ratingCount})`
                        : ''}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>

            {locked ? (
              /* Locked state: show distance & address but hide price/duration/contact */
              <>
                {selected?.distance !== undefined ? (
                  <View style={styles.bidInfoCard}>
                    <View style={styles.bidInfoItem}>
                      <Icon name="navigation" size={16} color={selected?.color ?? theme.colors.mechanicPalette[0]} />
                      <Text style={styles.bidInfoLabel}>Distance</Text>
                      <Text style={styles.bidInfoValue}>
                        {formatDistance(selected.distance)}
                      </Text>
                    </View>
                  </View>
                ) : null}

                {selected?.address ? (
                  <View style={styles.detailRow}>
                    <Icon name="map-pin" size={15} color={theme.colors.muted} />
                    <Text style={styles.detailText}>{selected.address}</Text>
                  </View>
                ) : null}

                <View style={[styles.aboutBox, {alignItems: 'center', marginTop: 14}]}>
                  <Icon name="lock" size={20} color={theme.colors.muted} />
                  <Text style={[styles.aboutLabel, {marginTop: 8, textAlign: 'center'}]}>
                    Price, duration & contact info are locked
                  </Text>
                  <Text style={[styles.aboutText, {textAlign: 'center'}]}>
                    Pay to unlock all bid details
                  </Text>
                </View>
              </>
            ) : (
              /* Unlocked state: show all bid details */
              <>
                <View style={styles.bidInfoCard}>
                  <View style={styles.bidInfoItem}>
                    <Icon name="dollar-sign" size={16} color={theme.colors.successDark} />
                    <Text style={styles.bidInfoLabel}>Price</Text>
                    <Text style={styles.bidInfoValue}>
                      {'\u20AC'}
                      {selected?.price}
                    </Text>
                  </View>
                  <View style={styles.bidInfoDivider} />
                  <View style={styles.bidInfoItem}>
                    <Icon name="clock" size={16} color={theme.colors.info} />
                    <Text style={styles.bidInfoLabel}>Duration</Text>
                    <Text style={styles.bidInfoValue}>{selected?.duration}</Text>
                  </View>
                  {selected?.distance !== undefined ? (
                    <>
                      <View style={styles.bidInfoDivider} />
                      <View style={styles.bidInfoItem}>
                        <Icon name="navigation" size={16} color={selected?.color ?? theme.colors.mechanicPalette[0]} />
                        <Text style={styles.bidInfoLabel}>Distance</Text>
                        <Text style={styles.bidInfoValue}>
                          {formatDistance(selected.distance)}
                        </Text>
                      </View>
                    </>
                  ) : null}
                </View>

                {selected?.phone ? (
                  <View style={styles.detailRow}>
                    <Icon name="phone" size={15} color={theme.colors.muted} />
                    <Text style={styles.detailText}>{selected.phone}</Text>
                  </View>
                ) : null}

                {selected?.address ? (
                  <View style={styles.detailRow}>
                    <Icon name="map-pin" size={15} color={theme.colors.muted} />
                    <Text style={styles.detailText}>{selected.address}</Text>
                  </View>
                ) : null}

                {selected?.notes ? (
                  <View style={styles.aboutBox}>
                    <Text style={styles.aboutLabel}>Notes</Text>
                    <Text style={styles.aboutText}>{selected.notes}</Text>
                  </View>
                ) : null}
              </>
            )}
          </ScrollView>

          <View style={styles.sheetBtnRow}>
            {locked ? (
              /* Locked: show pay button instead of booking actions */
              <>
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={() => setSelected(null)}>
                  <Text style={styles.btnOutlineText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnPrimary}
                  onPress={() => {
                    setSelected(null);
                    navigation.navigate('Payment', {
                      requestId: String(requestId),
                      amount: unlockPrice,
                    });
                  }}>
                  <Icon name="unlock" size={14} color={theme.colors.white} />
                  <Text style={[styles.btnPrimaryText, {marginLeft: 6}]}>
                    Unlock {'\u20AC'}{unlockPrice}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Unlocked: show view details + booking */
              <>
                <TouchableOpacity
                  style={styles.btnOutline}
                  onPress={() => {
                    const mechId = selected?.mechanicId;
                    setSelected(null);
                    if (mechId)
                      navigation.navigate('MechanicProfile', {mechanicId: String(mechId)});
                  }}>
                  <Text style={styles.btnOutlineText}>View Details</Text>
                </TouchableOpacity>

                {selected && isBooked(selected.id) ? (
                  <View style={[styles.btnPrimary, {backgroundColor: theme.colors.successDark}]}>
                    <Icon name="check-circle" size={16} color={theme.colors.white} />
                    <Text style={[styles.btnPrimaryText, {marginLeft: 6}]}>Booked</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.btnPrimary}
                    onPress={() => {
                      if (selected) {
                        setBookingTarget(selected);
                        setSelectedDate(null);
                        setSelected(null);
                      }
                    }}>
                    <Text style={styles.btnPrimaryText}>Book Mechanic</Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Booking date picker modal */}
      <Modal visible={!!bookingTarget} transparent animationType="slide">
        <Pressable style={styles.modalOverlay} onPress={() => setBookingTarget(null)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandleBar} />

          <Text style={styles.sheetTitle}>Book Appointment</Text>
          <Text style={styles.bookingSubtitle}>
            {bookingTarget?.mechanicName} · €{bookingTarget?.price}
          </Text>

          {bookingTarget?.appointmentDates && bookingTarget.appointmentDates.length > 0 ? (
            <>
              <Text style={styles.bookingSectionLabel}>Available Dates & Times</Text>
              <ScrollView style={styles.dateList} showsVerticalScrollIndicator={false}>
                {bookingTarget.appointmentDates.map((dateStr, idx) => {
                  const d = new Date(dateStr);
                  const isSelected = selectedDate === dateStr;
                  const alreadyBooked = bookings.some(
                    b => b.bidId === bookingTarget.id && b.appointmentDate === dateStr,
                  );
                  return (
                    <TouchableOpacity
                      key={idx}
                      style={[
                        styles.dateChip,
                        isSelected && styles.dateChipSelected,
                        alreadyBooked && styles.dateChipDisabled,
                      ]}
                      disabled={alreadyBooked}
                      activeOpacity={0.7}
                      onPress={() => setSelectedDate(isSelected ? null : dateStr)}>
                      <Icon
                        name="calendar"
                        size={16}
                        color={alreadyBooked ? theme.colors.mutedText : isSelected ? theme.colors.white : theme.colors.info}
                      />
                      <Text
                        style={[
                          styles.dateChipText,
                          isSelected && styles.dateChipTextSelected,
                          alreadyBooked && {color: theme.colors.mutedText},
                        ]}>
                        {d.toLocaleDateString('en-GB', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        at{' '}
                        {d.toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      {alreadyBooked ? (
                        <Text style={styles.dateChipBooked}>Already booked</Text>
                      ) : isSelected ? (
                        <Icon name="check" size={16} color={theme.colors.white} />
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          ) : (
            <View style={styles.noDateBox}>
              <Icon name="alert-circle" size={24} color={theme.colors.mutedText} />
              <Text style={styles.noDateText}>
                No appointment dates available from this mechanic.
              </Text>
            </View>
          )}

          <View style={styles.sheetBtnRow}>
            <TouchableOpacity style={styles.btnOutline} onPress={() => setBookingTarget(null)}>
              <Text style={styles.btnOutlineText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btnPrimary,
                (!selectedDate || bookingLoading) && {opacity: 0.5},
              ]}
              disabled={!selectedDate || bookingLoading}
              onPress={handleBooking}>
              {bookingLoading ? (
                <ActivityIndicator color={theme.colors.white} size="small" />
              ) : (
                <Text style={styles.btnPrimaryText}>Confirm Booking</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Booking Success Popup ── */}
      <SuccessModal
        visible={!!bookingSuccessData}
        title="Appointment Booked!"
        message={`Your appointment with ${bookingSuccessData?.mechanicName || 'the mechanic'} has been scheduled for ${bookingSuccessData?.dateFormatted || 'the selected date'}.`}
        infoBadgeText="Mechanic has been notified of your booking"
        primaryButtonText="Done"
        secondaryButtonText="View Request Details"
        onPrimaryPress={() => setBookingSuccessData(null)}
        onSecondaryPress={() => {
          setBookingSuccessData(null);
          navigation.navigate('RequestDetail', { requestId });
        }}
        onClose={() => setBookingSuccessData(null)}
      />
    </View>
  );
};

export default BidsMap;

/* ── Styles ────────────────────────────────────── */

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: theme.colors.white},

  topControlsContainer: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.overlayLightMax,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 10,
    elevation: 5,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginBottom: 8,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {fontSize: 16, fontWeight: '900', color: theme.colors.textStrong},

  mapContainer: {flex: 1},
  topInfo: {
    backgroundColor: theme.colors.overlayLightMax,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  topInfoText: {fontSize: 12, fontWeight: '800', color: theme.colors.textStrong},
  row: {flexDirection: 'row', alignItems: 'center', marginTop: 6},
  muted: {color: theme.colors.muted, fontSize: 12, flex: 1},

  /* Legend */
  legend: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.overlayLightMax,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    gap: 12,
    elevation: 4,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.08,
    shadowRadius: 3,
  },
  legendItem: {flexDirection: 'row', alignItems: 'center', gap: 5},
  legendDot: {width: 10, height: 10, borderRadius: 5},
  legendText: {fontSize: 11, fontWeight: '700', color: theme.colors.textSubtle},

  fabRow: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    flexDirection: 'row',
    zIndex: 20,
  },
  fab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
    elevation: 5,
  },

  /* Customer marker */
  customerMarkerWrap: {alignItems: 'center'},
  customerMarker: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CUSTOMER_COLOR,
    borderWidth: 3,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  customerLabel: {
    marginTop: 2,
    fontSize: 10,
    fontWeight: '900',
    color: CUSTOMER_COLOR,
    backgroundColor: theme.colors.overlayLightStrong,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
    overflow: 'hidden',
  },

  /* Mechanic marker */
  mechanicMarkerWrap: {alignItems: 'center'},
  mechanicMarker: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  mechanicMarkerText: {color: theme.colors.white, fontSize: 16, fontWeight: '900', letterSpacing: 1},
  distanceBadge: {
    marginTop: 2,
    backgroundColor: theme.colors.overlayLightStrong,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  distanceBadgeText: {fontSize: 10, fontWeight: '800', color: theme.colors.textSubtle},

  /* Bottom sheet */
  bottomSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 14,
    elevation: 12,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dragHandleArea: {
    paddingTop: 10,
    paddingBottom: 6,
    alignItems: 'center',
  },
  dragHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.iconPlaceholder,
  },
  snapRow: {
    flexDirection: 'row',
    position: 'absolute',
    right: 0,
    top: 8,
    gap: 4,
  },
  snapBtn: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCenter: {paddingTop: 8},

  listTitle: {fontSize: 15, fontWeight: '900', color: theme.colors.textStrong, marginBottom: 10},
  listContent: {paddingBottom: 24},
  emptyText: {textAlign: 'center', color: theme.colors.mutedText, marginTop: 24, fontSize: 14},
  lockText: {color: theme.colors.textStrong, fontSize: 14, fontWeight: '700'},

  /* Bid card */
  bidCard: {
    backgroundColor: theme.colors.white,
    borderRadius: 20,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E9EEF5',
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  bidCardHighlighted: {
    borderWidth: 2,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.22,
    shadowRadius: 12,
    elevation: 6,
  },
  highlightBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F3F8',
  },
  highlightBadgeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  highlightBannerText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  profilePillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  profilePillText: {
    color: theme.colors.white,
    fontSize: 11,
    fontWeight: '800',
  },
  cardMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cardAvatarSquircle: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  cardAvatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardBody: {
    flex: 1,
    marginLeft: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 15,
    fontWeight: '800',
    color: theme.colors.textStrong,
    flex: 1,
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 8,
    marginLeft: 8,
  },
  ratingBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#B45309',
  },
  ratingCountText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400E',
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  pricePill: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pricePillText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#059669',
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  durationPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.textSubtle,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  distancePillText: {
    fontSize: 12,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  addressText: {
    fontSize: 11,
    color: theme.colors.muted,
    flex: 1,
  },
  cardRight: {
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedPricePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  lockedPricePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.muted,
  },
  bookedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  bookedBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.successDark,
  },
  lockedBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Modal detail sheet */
  modalOverlay: {flex: 1, backgroundColor: theme.colors.overlay},
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: '70%',
    backgroundColor: theme.colors.white,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 18,
    paddingBottom: 28,
    elevation: 12,
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  sheetHandleBar: {
    alignSelf: 'center',
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: theme.colors.borderLight,
    marginBottom: 16,
  },
  sheetHeader: {flexDirection: 'row', alignItems: 'center', marginBottom: 18},
  sheetAvatar: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: theme.colors.black,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  sheetAvatarText: {color: theme.colors.white, fontSize: 20, fontWeight: '900', letterSpacing: 1},
  sheetTitle: {fontSize: 18, fontWeight: '900', color: theme.colors.textStrong},
  ratingRow: {flexDirection: 'row', alignItems: 'center', marginTop: 4},
  ratingText: {fontSize: 14, fontWeight: '700', color: theme.colors.warning, marginLeft: 4},

  bidInfoCard: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceSoft,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E9EEF5',
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  bidInfoItem: {flex: 1, alignItems: 'center'},
  bidInfoLabel: {fontSize: 11, color: theme.colors.muted, fontWeight: '600', marginTop: 4},
  bidInfoValue: {fontSize: 16, fontWeight: '900', color: theme.colors.textStrong, marginTop: 2},
  bidInfoDivider: {width: 1, height: 36, backgroundColor: theme.colors.borderLight},

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.surfaceMuted,
  },
  detailText: {fontSize: 14, color: theme.colors.textSubtle, marginLeft: 10, fontWeight: '600'},

  aboutBox: {marginTop: 10, backgroundColor: theme.colors.surfaceSoft, borderRadius: 12, padding: 12},
  aboutLabel: {fontSize: 13, fontWeight: '800', color: theme.colors.textStrong, marginBottom: 4},
  aboutText: {fontSize: 13, color: theme.colors.muted, lineHeight: 19},

  sheetBtnRow: {flexDirection: 'row', marginTop: 14, gap: 10},
  btnOutline: {
    flex: 1,
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnOutlineText: {fontWeight: '900', color: theme.colors.textStrong},
  btnPrimary: {
    flex: 1,
    backgroundColor: theme.colors.info,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnPrimaryText: {fontWeight: '900', color: theme.colors.white},

  /* Booking modal */
  bookingSubtitle: {fontSize: 14, color: theme.colors.muted, fontWeight: '600', marginTop: 4, marginBottom: 16},
  bookingSectionLabel: {fontSize: 13, fontWeight: '800', color: theme.colors.textSubtle, marginBottom: 10},
  dateList: {maxHeight: 260},
  dateChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceMuted,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    gap: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dateChipSelected: {
    backgroundColor: theme.colors.info,
    borderColor: theme.colors.infoDark,
  },
  dateChipDisabled: {
    opacity: 0.5,
  },
  dateChipText: {flex: 1, fontSize: 14, fontWeight: '700', color: theme.colors.textStrong},
  dateChipTextSelected: {color: theme.colors.white},
  dateChipBooked: {fontSize: 11, fontWeight: '600', color: theme.colors.mutedText},
  noDateBox: {
    alignItems: 'center',
    padding: 24,
    gap: 8,
  },
  noDateText: {fontSize: 14, color: theme.colors.mutedText, textAlign: 'center'},

  /* Unlock banner */
  unlockBanner: {
    backgroundColor: theme.colors.infoSoft,
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.infoBorder,
  },
  unlockBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  unlockBannerTitle: {fontSize: 14, fontWeight: '800', color: theme.colors.infoTextDark},
  unlockBannerSub: {fontSize: 12, color: theme.colors.infoText, fontWeight: '600', marginTop: 2},
  unlockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
    borderRadius: 10,
    paddingVertical: 10,
    gap: 6,
  },
  unlockBtnText: {fontWeight: '900', color: theme.colors.white, fontSize: 14},
});




