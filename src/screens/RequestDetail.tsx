// src/screens/RequestDetail.tsx
import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Platform,
} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import apiClient from '../api/apiClient';
import {AppStackParamList} from '../navigation/types';
import {ApiResponse, RequestEntity, RequestImageDto} from '../types/api';
import {theme} from '../theme';

function formatDate(v?: string) {
  if (!v) return '-';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return v;
  return d.toLocaleString();
}

function normalizeImages(images?: RequestEntity['images']): string[] {
  if (!images) return [];
  if (!Array.isArray(images) || images.length === 0) return [];

  const first = (images as any)[0];
  if (typeof first === 'string') return images as string[];

  return (images as RequestImageDto[])
    .map(i => i?.url || i?.imageUrl || i?.path)
    .filter(Boolean) as string[];
}

function Header({title, onBack}: {title: string; onBack: () => void}) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        style={styles.backBtn}
        android_ripple={{color: theme.colors.rippleDark10}}>
        <Icon name="arrow-left" size={22} color={theme.colors.textStrong} />
      </Pressable>

      <Text style={styles.headerTitle}>{title}</Text>

      <View style={styles.rightSpace} />
    </View>
  );
}

function InfoRow({label, value}: {label: string; value?: string | null}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>
        {value && String(value).trim() ? String(value) : '-'}
      </Text>
    </View>
  );
}

export default function RequestDetail() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'RequestDetail'>>();
  const insets = useSafeAreaInsets();

  const {requestId} = route.params;

  const [data, setData] = useState<RequestEntity | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // image viewer
  const [viewerVisible, setViewerVisible] = useState(false);
  const [activeImageUrl, setActiveImageUrl] = useState<string | null>(null);

  // debug: broken images
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  // ✅ bids pay state (from /bids/request/:id)
  const [unlockPrice, setUnlockPrice] = useState<number>(50);
  const [lockedBidCount, setLockedBidCount] = useState<number>(0);
  const [bidsMetaLoading, setBidsMetaLoading] = useState(false);

  const images = useMemo(() => normalizeImages(data?.images), [data?.images]);

  const statusMeta = useMemo(() => {
    switch (data?.status) {
      case 'PENDING':
        return {title: 'Under review', hint: 'Your request is being reviewed.'};
      case 'APPROVED':
        return {title: 'Bidding open', hint: 'Request approved. Bidding is open.'};
      case 'BIDS_VIEWABLE':
        return {title: 'Bids available', hint: 'You can view bids now.'};
      case 'MECHANIC_SELECTED':
        return {title: 'Mechanic Selected', hint: 'Bidding ended. Appointment is booked.'};
      case 'COMPLETED':
        return {title: 'Completed', hint: 'This request is completed.'};
      default:
        return {title: data?.status || '-', hint: ''};
    }
  }, [data?.status]);

  const fetchBidsMeta = useCallback(async (rid: number) => {
    try {
      setBidsMetaLoading(true);

      const res = await apiClient.get(`/api/bids/request/${rid}`);

      // 🔒 Locked response => { count, priceToUnlock }
      if (res.data?.count !== undefined) {
        setLockedBidCount(Number(res.data.count) || 0);
        setUnlockPrice(Number(res.data.priceToUnlock) || 50);
        return;
      }
    } catch (_e) {
      setUnlockPrice(50);
    } finally {
      setBidsMetaLoading(false);
    }
  }, []);

  const fetchDetail = useCallback(async () => {
    try {
      setError(null);

      if (requestId === undefined || requestId === null) {
        throw new Error('Missing requestId in navigation params');
      }

      const id = String(requestId);
      const res = await apiClient.get<ApiResponse<RequestEntity>>(
        `/api/requests/${encodeURIComponent(id)}`,
      );

      if (!res.data?.success) {
        throw new Error(res.data?.message || 'Failed to load request');
      }

      const payload: any = res.data.data;
      const finalData: RequestEntity = payload?.data ? payload.data : payload;

      setData(finalData);
      setBroken({});

      // ✅ Get lock/unlock info for actions
      if (finalData?.id) {
        fetchBidsMeta(Number(finalData.id));
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to load request');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [requestId, fetchBidsMeta]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchDetail();
  }, [fetchDetail]);

  const openImage = useCallback((url: string) => {
    setActiveImageUrl(url);
    setViewerVisible(true);
  }, []);

  const closeImage = useCallback(() => {
    setViewerVisible(false);
    setActiveImageUrl(null);
  }, []);

  const onPressViewBids = useCallback(() => {
    if (!data?.id) return;
    navigation.navigate('Bids', {requestId: Number(data.id)});
  }, [navigation, data?.id]);

  const renderActions = () => {
    if (!data) return null;

    const isPending = data.status === 'PENDING';
    const isApproved = data.status === 'APPROVED';
    const canViewBids =
      data.status === 'BIDDING' ||
      data.status === 'BIDS_VIEWABLE' ||
      data.bidsViewable === true;

    // MECHANIC_SELECTED → Bidding ended, view booked mechanic
    if (data?.status === 'MECHANIC_SELECTED') {
      return (
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Mechanic Selected & Booked</Text>
          <Text style={styles.actionHint}>
            Your appointment has been scheduled and bidding has ended.
          </Text>
          <Pressable style={styles.primaryBtn} onPress={onPressViewBids}>
            <Text style={styles.primaryBtnText}>View Booked Mechanic & Route</Text>
          </Pressable>
        </View>
      );
    }

    // BIDDING / BIDS_VIEWABLE → View Bids
    if (canViewBids) {
      return (
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Bids available</Text>
          <Text style={styles.actionHint}>You can view bids now.</Text>
          <Pressable style={styles.primaryBtn} onPress={onPressViewBids}>
            <Text style={styles.primaryBtnText}>View Bids</Text>
          </Pressable>
        </View>
      );
    }

    // APPROVED → View Mechanic Bids (navigate to Bids map, pay from there)
    if (isApproved) {
      return (
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Mechanic bids available</Text>
          <Text style={styles.actionHint}>
            {bidsMetaLoading
              ? 'Checking bids...'
              : `${lockedBidCount ? `${lockedBidCount} mechanic(s)` : 'Mechanics'} have bid. View them on the map.`}
          </Text>

          <Pressable
            style={[styles.primaryBtn, bidsMetaLoading && {opacity: 0.7}]}
            onPress={onPressViewBids}
            disabled={bidsMetaLoading}>
            <Text style={styles.primaryBtnText}>
              {bidsMetaLoading ? 'Please wait...' : 'View Mechanic Bids'}
            </Text>
          </Pressable>
        </View>
      );
    }

    // PENDING → Awaiting approval (disabled)
    if (isPending) {
      return (
        <View style={styles.actionBox}>
          <Text style={styles.actionTitle}>Awaiting approval</Text>
          <Text style={styles.actionHint}>
            Your request is being reviewed. Mechanic bids will be available after approval.
          </Text>

          <Pressable
            style={[styles.primaryBtn, {opacity: 0.45}]}
            disabled={true}>
            <Text style={styles.primaryBtnText}>View Mechanic Bids</Text>
          </Pressable>
        </View>
      );
    }

    // Other statuses (COMPLETED, CANCELLED, etc.)
    return (
      <View style={styles.actionBox}>
        <Text style={styles.actionTitle}>{statusMeta.title}</Text>
        {!!statusMeta.hint ? (
          <Text style={styles.actionHint}>{statusMeta.hint}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Header title="Request Detail" onBack={() => navigation.goBack()} />

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" />
          <Text style={styles.muted}>Loading request...</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {paddingBottom: 90 + insets.bottom},
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }>
          {error ? (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Error</Text>
              <Text style={styles.errorText}>{error}</Text>
              <Pressable
                style={[styles.primaryBtn, {marginTop: 12}]}
                onPress={() => {
                  setLoading(true);
                  fetchDetail();
                }}>
                <Text style={styles.primaryBtnText}>Retry</Text>
              </Pressable>
            </View>
          ) : !data ? (
            <View style={styles.center}>
              <Text style={styles.muted}>No data found.</Text>
            </View>
          ) : (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Request Info</Text>
                <InfoRow label="Status" value={statusMeta.title} />
                <InfoRow label="Created" value={formatDate(data.createdAt)} />
                <InfoRow label="Updated" value={formatDate(data.updatedAt)} />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Car Details</Text>
                <InfoRow label="Brand" value={data.carBrand} />
                <InfoRow label="Model" value={data.carModel} />
                <InfoRow label="Year" value={data.carYear} />
                <InfoRow label="Number Plate" value={data.numberPlate} />
                <InfoRow label="Transmission" value={data.transmission} />
                <InfoRow label="VIN" value={data.vin} />
                <InfoRow label="Location" value={data.location} />
                <InfoRow
                  label="Contact Method"
                  value={data.preferredContactMethod || (data as any).contactMethod}
                />
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Damage Description</Text>
                <Text style={styles.paragraph}>
                  {data.description?.trim() || 'No description provided.'}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Images</Text>
                <Text style={styles.smallMuted}>Images count: {images.length}</Text>

                {images.length === 0 ? (
                  <Text style={styles.muted}>No images uploaded.</Text>
                ) : (
                  <View style={styles.grid}>
                    {images.map((url, idx) => {
                      const isBroken = !!broken[url];
                      return (
                        <Pressable
                          key={`${url}-${idx}`}
                          onPress={() => !isBroken && openImage(url)}
                          style={[
                            styles.thumbWrap,
                            isBroken && styles.thumbBroken,
                          ]}>
                          {!isBroken ? (
                            <Image
                              source={{uri: url}}
                              style={styles.thumb}
                              resizeMode="cover"
                              onError={() => {
                                setBroken(prev => ({...prev, [url]: true}));
                              }}
                            />
                          ) : (
                            <View style={styles.thumbFallback}>
                              <Text style={styles.thumbFallbackText}>
                                Image not loading
                              </Text>
                              <Text style={styles.thumbFallbackText2} numberOfLines={2}>
                                {url}
                              </Text>
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Status</Text>
                <Text style={styles.paragraph}>
                  {statusMeta.title}
                  {!!statusMeta.hint ? ` — ${statusMeta.hint}` : ''}
                </Text>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Actions</Text>
                {renderActions()}
              </View>
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={viewerVisible} transparent onRequestClose={closeImage}>
        <View style={styles.modalOverlay}>
          <Pressable style={styles.modalCloseArea} onPress={closeImage} />
          <View style={styles.modalBody}>
            <Pressable style={styles.modalCloseBtn} onPress={closeImage}>
              <Text style={styles.modalCloseText}>Close ✕</Text>
            </Pressable>

            {activeImageUrl ? (
              <Image
                source={{uri: activeImageUrl}}
                style={styles.fullImage}
                resizeMode="contain"
              />
            ) : null}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: theme.colors.appBackgroundSlate},

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    paddingBottom: 12,
    backgroundColor: theme.colors.appBackgroundSlate,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.overlayWhite85,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: theme.colors.black,
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.textStrong,
    fontSize: 18,
    fontWeight: '800',
  },
  rightSpace: {width: 44},

  center: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16},
  scroll: {paddingHorizontal: 14, paddingBottom: 14, gap: 12},

  card: {
    backgroundColor: theme.colors.white,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderInput,
    borderRadius: 16,
    padding: 14,
  },

  sectionTitle: {
    color: theme.colors.textStrong,
    fontSize: 14,
    fontWeight: '900',
    marginBottom: 10,
  },

  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 8,
  },
  rowLabel: {color: theme.colors.muted, fontSize: 13},
  rowValue: {
    color: theme.colors.textStrong,
    fontSize: 13,
    fontWeight: '700',
    flexShrink: 1,
    textAlign: 'right',
  },

  paragraph: {color: theme.colors.textSubtle, fontSize: 13, lineHeight: 18},
  muted: {color: theme.colors.muted, fontSize: 13},
  smallMuted: {color: theme.colors.mutedText, fontSize: 12, marginBottom: 8},
  errorText: {color: theme.colors.errorDeep, fontSize: 13, lineHeight: 18},

  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},

  thumbWrap: {
    width: '31%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderInput,
    backgroundColor: theme.colors.surfaceMuted,
  },
  thumb: {width: '100%', height: '100%'},
  thumbBroken: {borderColor: theme.colors.borderSoftDanger, backgroundColor: theme.colors.errorSoft},
  thumbFallback: {flex: 1, alignItems: 'center', justifyContent: 'center', padding: 6},
  thumbFallbackText: {
    color: theme.colors.errorDeep,
    fontWeight: '900',
    fontSize: 11,
    marginBottom: 4,
    textAlign: 'center',
  },
  thumbFallbackText2: {color: theme.colors.muted, fontSize: 9, textAlign: 'center'},

  actionBox: {
    padding: 12,
    borderRadius: 14,
    backgroundColor: theme.colors.surfaceSoft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderInput,
  },
  actionTitle: {color: theme.colors.textStrong, fontSize: 14, fontWeight: '900'},
  actionHint: {marginTop: 6, color: theme.colors.muted, fontSize: 13},

  primaryBtn: {
    marginTop: 12,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.info,
  },
  primaryBtnText: {color: theme.colors.white, fontWeight: '900', fontSize: 14},

  modalOverlay: {flex: 1, backgroundColor: theme.colors.overlayStrong},
  modalCloseArea: {flex: 1},
  modalBody: {flex: 8, paddingHorizontal: 12, paddingBottom: 20},
  modalCloseBtn: {
    alignSelf: 'flex-end',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: theme.colors.overlayWhite16,
    marginBottom: 12,
  },
  modalCloseText: {color: theme.colors.white, fontWeight: '900'},
  fullImage: {width: '100%', height: '100%'},
});

