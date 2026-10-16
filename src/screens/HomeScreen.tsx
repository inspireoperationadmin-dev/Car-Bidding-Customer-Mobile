import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Platform,
  RefreshControl,
  ActivityIndicator,
  Animated,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import {useNavigation, CompositeNavigationProp} from '@react-navigation/native';
import {BottomTabNavigationProp} from '@react-navigation/bottom-tabs';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import apiClient from '../api/apiClient';
import {AppTabParamList, AppStackParamList} from '../navigation/types';
import {RequestEntity, RequestListResponse, RequestStatusLike} from '../types/api';
import {theme} from '../theme';

type Nav = CompositeNavigationProp<
  BottomTabNavigationProp<AppTabParamList, 'Home'>,
  NativeStackNavigationProp<AppStackParamList>
>;

// ─── helpers ────────────────────────────────────────────────────────────────
function formatDateShort(iso?: string) {
  if (!iso) return '-';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString();
}

function statusBadgeMeta(
  status: RequestStatusLike,
): {label: string; bg: string; fg: string; icon?: string} {
  switch (status) {
    case 'PENDING':
      return {label: 'Pending', bg: theme.colors.warningSoft, fg: theme.colors.amberDark, icon: 'clock'};
    case 'APPROVED':
      return {label: 'Approved', bg: theme.colors.accentLight, fg: theme.colors.primary, icon: 'check-circle'};
    case 'BIDS_VIEWABLE':
      return {label: 'Bids Ready', bg: theme.colors.successSoftTint, fg: theme.colors.successDark, icon: 'check'};
    case 'COMPLETED':
      return {label: 'Done', bg: theme.colors.blueSoftTint, fg: theme.colors.textMutedDark, icon: 'check'};
    default:
      return {label: status, bg: theme.colors.surfaceMuted, fg: theme.colors.muted};
  }
}

function makeCarTitle(r: RequestEntity) {
  const brand = (r.carBrand || '').trim();
  const model = (r.carModel || '').trim();
  const year = (r.carYear || '').trim();
  const car = [brand, model].filter(Boolean).join(' ');
  return year ? `${car} (${year})` : car || `Request #${r.id}`;
}

function shortIssue(desc?: string) {
  const v = (desc || '').trim();
  if (!v) return 'No description';
  return v.length > 42 ? v.slice(0, 42) + '...' : v;
}

const WAVE_HEIGHTS = [6, 12, 8, 16, 10, 18, 8, 13, 6, 11];

// ─── component ──────────────────────────────────────────────────────────────
const HomeScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();
  const pulseAnim = useRef(new Animated.Value(1)).current;

  const [requests, setRequests] = useState<RequestEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pulsing glow animation for AI orb + avatar ring
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const fetchRequests = useCallback(async () => {
    try {
      setError(null);
      const res = await apiClient.get<RequestListResponse>('/api/requests');
      if (!res.data?.success) throw new Error('Failed to load requests');
      setRequests(res.data.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load requests');
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchRequests();
  }, [fetchRequests]);

  const activeRequest = useMemo(() => {
    if (!requests.length) return null;
    const sorted = [...requests].sort((a, b) => {
      const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return db - da;
    });
    return (
      sorted.find(r => r.status === 'APPROVED' || r.status === 'BIDS_VIEWABLE') ||
      sorted.find(r => r.status === 'PENDING') ||
      sorted[0]
    );
  }, [requests]);

  const recentHistory = useMemo(() => {
    if (!requests.length) return [];
    return [...requests]
      .sort((a, b) => {
        const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return db - da;
      })
      .slice(0, 5);
  }, [requests]);

  const goToRequestDetail = useCallback(
    (id: number) => navigation.navigate('RequestDetail', {requestId: id}),
    [navigation],
  );

  const chips = [
    {
      label: 'New Request',
      icon: 'plus-circle',
      onPress: () => navigation.navigate('SubmitRequest'),
    },
    {
      label: 'My Requests',
      icon: 'list',
      onPress: () => navigation.navigate('Requests'),
    },
    {
      label: 'Alerts',
      icon: 'bell',
      onPress: () => navigation.navigate('Notifications'),
    },
    {
      label: 'Profile',
      icon: 'user',
      onPress: () => navigation.navigate('Profile'),
    },
  ];

  const renderActiveCard = (r: RequestEntity) => {
    const badge = statusBadgeMeta(r.status);
    const isPending = r.status === 'PENDING';
    const isApproved = r.status === 'APPROVED';
    const canViewBids =
      r.status === 'BIDDING' ||
      r.status === 'BIDS_VIEWABLE' ||
      r.bidsViewable === true;

    let ctaText = 'View Details';
    let ctaIcon = 'eye';
    if (canViewBids) {
      ctaText = 'View Bids';
      ctaIcon = 'list';
    } else if (isApproved) {
      ctaText = 'View Mechanic Bids';
      ctaIcon = 'map';
    } else if (isPending) {
      ctaText = 'View Mechanic Bids';
      ctaIcon = 'lock';
    }

    return (
      <View style={styles.activeCard}>
        {/* Purple decorative glow blob */}
        <View style={styles.cardGlowBlob} />

        <View style={styles.cardHeaderRow}>
          <View style={styles.cardTitleRow}>
            <LinearGradient
              colors={[theme.colors.violetBright, theme.colors.primary]}
              style={styles.cardDot}
            />
            <Text style={styles.cardLabel}>CURRENT STATUS</Text>
          </View>
          <Text style={styles.dateText}>
            {r.createdAt ? formatDateShort(r.createdAt) : ''}
          </Text>
        </View>

        <Text style={styles.carName}>{makeCarTitle(r)}</Text>
        <Text style={styles.issueText}>{shortIssue(r.description)}</Text>

        <View style={[styles.statusBadge, {backgroundColor: badge.bg}]}>
          {badge.icon ? (
            <Icon name={badge.icon as any} size={13} color={badge.fg} />
          ) : null}
          <Text style={[styles.statusText, {color: badge.fg}]}>
            {badge.label}
          </Text>
        </View>

        <Text style={styles.cardDesc}>
          {r.status === 'PENDING' && 'Your request is under review by our team.'}
          {r.status === 'APPROVED' &&
            'Request approved — mechanic bids are available.'}
          {r.status === 'BIDDING' &&
            'Mechanics are placing bids. Check them now.'}
          {r.status === 'BIDS_VIEWABLE' && 'Bids are ready for your review.'}
          {r.status === 'COMPLETED' &&
            'This request has been completed successfully.'}
        </Text>

        <TouchableOpacity
          disabled={isPending}
          activeOpacity={0.9}
          onPress={() => {
            if (canViewBids || isApproved) {
              navigation.navigate('Bids', {requestId: r.id});
            } else {
              goToRequestDetail(r.id);
            }
          }}>
          <LinearGradient
            colors={
              isPending
                ? [theme.colors.violetSoft, theme.colors.violetLight]
                : [theme.colors.gradBtnStart, theme.colors.primary, theme.colors.gradBtnEnd]
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={[styles.ctaGradient, isPending && {opacity: 0.55}]}>
            <Icon
              name={ctaIcon as any}
              size={17}
              color={theme.colors.white}
              style={{marginRight: 8}}
            />
            <Text style={styles.ctaText}>{ctaText}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <LinearGradient
      colors={[theme.colors.gradHeaderStart, theme.colors.gradHeaderMid, theme.colors.gradHeaderEnd]}
      style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      <SafeAreaView style={styles.safeArea}>

        {/* ── HEADER (Properly offset below Android status bar) ── */}
        <View
          style={[
            styles.header,
            {
              paddingTop:
                Platform.OS === 'android'
                  ? (StatusBar.currentHeight || 28) + 26
                  : insets.top + 8,
            },
          ]}>
          {/* Avatar with pulsing ring */}
          <View style={styles.avatarWrapper}>
            <Animated.View
              style={[styles.avatarRing, {transform: [{scale: pulseAnim}]}]}
            />
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>U</Text>
            </View>
          </View>

          <View style={styles.headerText}>
            <Text style={styles.greeting}>Welcome back</Text>
            <Text style={styles.subtitle}>How can we help your car today?</Text>
          </View>

          <TouchableOpacity
            style={styles.bellBtn}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('Notifications')}>
            <Icon name="bell" size={20} color={theme.colors.primary} />
            <View style={styles.badgeDot} />
          </TouchableOpacity>
        </View>

        {/* ── SCROLLABLE CONTENT ───────────────────────────── */}
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {paddingBottom: 110 + insets.bottom},
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={theme.colors.primary}
            />
          }>

          {/* CHIPS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}>
            {chips.map(item => (
              <TouchableOpacity
                key={item.label}
                style={styles.chip}
                onPress={item.onPress}
                activeOpacity={0.8}>
                <View style={styles.chipIcon}>
                  <Icon name={item.icon as any} size={13} color={theme.colors.primary} />
                </View>
                <Text style={styles.chipText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* LOADING */}
          {loading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.colors.primary} />
              <Text style={styles.mutedText}>Loading your requests...</Text>
            </View>
          )}

          {/* ERROR */}
          {!loading && error && (
            <View style={styles.errorCard}>
              <Icon name="alert-circle" size={24} color={theme.colors.error} />
              <Text style={styles.errorTitle}>Could not load requests</Text>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity
                style={styles.retryBtn}
                onPress={fetchRequests}
                activeOpacity={0.85}>
                <Text style={styles.retryText}>Try again</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* CURRENT STATUS CARD */}
          {activeRequest && (
            <>
              <Text style={styles.sectionTitle}>Current Status</Text>
              {renderActiveCard(activeRequest)}
            </>
          )}

          {/* QUICK ACTION */}
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SubmitRequest')}>
            <LinearGradient
              colors={[theme.colors.gradBtnStart, theme.colors.primary, theme.colors.gradBtnEnd]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.newReqCard}>
              <View style={styles.newReqIconCircle}>
                <Icon name="camera" size={22} color={theme.colors.primary} />
              </View>
              <View style={{flex: 1}}>
                <Text style={styles.newReqTitle}>Post New Request</Text>
                <Text style={styles.newReqDesc}>
                  Upload photos & describe the issue
                </Text>
              </View>
              <View style={styles.newReqArrow}>
                <Icon name="chevron-right" size={20} color={theme.colors.white} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* ── AI VOICE ASSISTANT CARD ─────────────────────── */}
          <Text style={styles.sectionTitle}>AI Voice Assistant</Text>
          <TouchableOpacity activeOpacity={0.88} style={styles.voiceCard}>
            <LinearGradient
              colors={[theme.colors.accentLightAlpha75, theme.colors.overlayWhite88]}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.voiceCardInner}>
              <View style={styles.voiceIconCircle}>
                <Icon name="message-circle" size={20} color={theme.colors.primary} />
              </View>

              <View style={styles.voiceCardContent}>
                <Text style={styles.voiceCardTitle}>Describe Issue by Voice</Text>
                <View style={styles.waveformContainer}>
                  <View style={styles.waveform}>
                    {WAVE_HEIGHTS.map((h, i) => (
                      <View key={i} style={[styles.waveBar, {height: h}]} />
                    ))}
                  </View>
                  <Text style={styles.voiceHint}>Tap to speak...</Text>
                </View>
              </View>

              {/* Glowing pulsing mic orb */}
              <View style={styles.orbWrapper}>
                <View style={styles.orbGlow3} />
                <View style={styles.orbGlow2} />
                <Animated.View
                  style={[styles.orbGlow1, {transform: [{scale: pulseAnim}]}]}
                />
                <LinearGradient
                  colors={[theme.colors.violetPale, theme.colors.gradBtnStart, theme.colors.violetDark]}
                  style={styles.orbCore}>
                  <Icon name="mic" size={17} color={theme.colors.white} />
                </LinearGradient>
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* RECENT HISTORY */}
          {recentHistory.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Recent History</Text>
              {recentHistory.map(item => {
                const badge = statusBadgeMeta(item.status);
                return (
                  <TouchableOpacity
                    key={String(item.id)}
                    style={styles.historyCard}
                    activeOpacity={0.85}
                    onPress={() => goToRequestDetail(item.id)}>
                    <LinearGradient
                      colors={[theme.colors.accentLight, theme.colors.accentMid]}
                      style={styles.historyIconBox}>
                      <Icon name="tool" size={17} color={theme.colors.primary} />
                    </LinearGradient>

                    <View style={{flex: 1, paddingHorizontal: 12}}>
                      <Text style={styles.historyCar}>{makeCarTitle(item)}</Text>
                      <Text style={styles.historyIssue}>
                        {shortIssue(item.description)}
                      </Text>
                    </View>

                    <View style={{alignItems: 'flex-end'}}>
                      <Text style={styles.historyDate}>
                        {formatDateShort(item.createdAt)}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          {backgroundColor: badge.bg, marginTop: 5},
                        ]}>
                        <Text style={[styles.pillText, {color: badge.fg}]}>
                          {badge.label}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

export default HomeScreen;

// ─── styles ─────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {flex: 1},
  safeArea: {flex: 1},

  // ── HEADER
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: theme.colors.purpleAlpha50,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.overlayLightStrong,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  avatarText: {fontSize: 17, fontWeight: '800', color: theme.colors.primary},
  headerText: {flex: 1},
  greeting: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {fontSize: 13, color: theme.colors.muted, marginTop: 2},
  bellBtn: {
    backgroundColor: theme.colors.overlayWhite90,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.purpleAlpha25,
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.18,
    shadowRadius: 10,
    elevation: 4,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.error,
    borderWidth: 1.5,
    borderColor: theme.colors.white,
  },

  // ── SCROLL
  scrollContent: {paddingHorizontal: 20, paddingTop: 4},
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.text,
    marginTop: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
  },

  // ── CHIPS
  chipsScroll: {
    marginHorizontal: -20,
    marginBottom: 4,
  },
  chipsRow: {paddingHorizontal: 20, paddingVertical: 8},
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayWhite88,
    borderRadius: 20,
    paddingVertical: 9,
    paddingHorizontal: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 3},
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
  },
  chipIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.purpleAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  chipText: {fontSize: 12, fontWeight: '700', color: theme.colors.indigoDark},

  // ── LOADING / ERROR
  loadingBox: {paddingVertical: 28, alignItems: 'center'},
  mutedText: {marginTop: 10, color: theme.colors.mutedText, fontSize: 13},
  errorCard: {
    backgroundColor: theme.colors.overlayWhite90,
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: theme.colors.errorAlpha20,
    shadowColor: theme.colors.error,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  errorTitle: {
    fontWeight: '800',
    color: theme.colors.text,
    fontSize: 15,
    marginTop: 10,
  },
  errorMsg: {color: theme.colors.mutedText, fontSize: 13, marginTop: 4, textAlign: 'center'},
  retryBtn: {
    marginTop: 14,
    backgroundColor: theme.colors.primaryTint10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  retryText: {fontWeight: '700', color: theme.colors.primary, fontSize: 13},

  // ── ACTIVE STATUS CARD
  activeCard: {
    backgroundColor: theme.colors.overlayWhite88,
    borderRadius: 28,
    padding: 22,
    marginBottom: 14,
    overflow: 'hidden',
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 10},
    shadowOpacity: 0.22,
    shadowRadius: 24,
    elevation: 12,
    borderWidth: 1,
    borderColor: theme.colors.purpleAlpha18,
  },
  cardGlowBlob: {
    position: 'absolute',
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: theme.colors.purpleAlpha10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTitleRow: {flexDirection: 'row', alignItems: 'center'},
  cardDot: {width: 10, height: 10, borderRadius: 5, marginRight: 8},
  cardLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 0.8,
  },
  carName: {
    fontSize: 19,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 6,
    letterSpacing: -0.4,
  },
  dateText: {fontSize: 11, color: theme.colors.mutedText},
  issueText: {fontSize: 13, color: theme.colors.muted, marginBottom: 14, lineHeight: 20},
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  statusText: {fontSize: 12, fontWeight: '800', marginLeft: 5},
  cardDesc: {fontSize: 13, color: theme.colors.muted, marginBottom: 16, lineHeight: 20},
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 18,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaText: {color: theme.colors.white, fontWeight: '800', fontSize: 15, letterSpacing: 0.2},

  // ── QUICK ACTION CARD
  newReqCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 18,
    borderRadius: 26,
    marginBottom: 8,
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.38,
    shadowRadius: 18,
    elevation: 10,
  },
  newReqIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.overlayLightStrong,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  newReqTitle: {
    color: theme.colors.white,
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  newReqDesc: {color: theme.colors.overlayWhite80, fontSize: 12, marginTop: 3},
  newReqArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.overlayWhite20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── HISTORY
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayWhite88,
    padding: 16,
    borderRadius: 22,
    marginBottom: 12,
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 5},
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 5,
    borderWidth: 1,
    borderColor: theme.colors.purpleAlpha10,
  },
  historyIconBox: {
    width: 44,
    height: 44,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyCar: {fontSize: 14, fontWeight: '700', color: theme.colors.text},
  historyIssue: {fontSize: 12, color: theme.colors.mutedText, marginTop: 2},
  historyDate: {fontSize: 11, color: theme.colors.mutedText},
  statusPill: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12},
  pillText: {fontSize: 10, fontWeight: '800'},

  // ── AI VOICE CARD (in-feed)
  voiceCard: {
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.14,
    shadowRadius: 14,
    elevation: 4,
    borderWidth: 1,
    borderColor: theme.colors.purpleAlpha18,
    overflow: 'hidden',
  },
  voiceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 24,
  },
  voiceIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.purpleAlpha12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceCardContent: {
    flex: 1,
    marginHorizontal: 12,
  },
  voiceCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  waveform: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  waveBar: {
    width: 3,
    borderRadius: 2,
    backgroundColor: theme.colors.violetMid,
    opacity: 0.7,
    marginHorizontal: 1.5,
  },
  voiceHint: {
    fontSize: 11,
    color: theme.colors.mutedText,
    fontWeight: '600',
  },

  // ── AI ORB (glowing mic button)
  orbWrapper: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orbGlow3: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: theme.colors.purpleAlpha12,
  },
  orbGlow2: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
    top: 4,
    left: 4,
    backgroundColor: theme.colors.purpleAlpha22,
  },
  orbGlow1: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    top: 9,
    left: 9,
    backgroundColor: theme.colors.purpleAlpha35,
  },
  orbCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 6,
  },
});



