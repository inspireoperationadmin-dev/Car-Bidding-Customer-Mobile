import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount,
  selectNotificationsLoading,
  selectNotificationsError,
} from '../store/slices/notificationSlice';

const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(selectNotifications);
  const unreadCount = useAppSelector(selectUnreadCount);
  const loading = useAppSelector(selectNotificationsLoading);
  const error = useAppSelector(selectNotificationsError);

  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const handleMarkAsRead = (id: number) => {
    dispatch(markAsRead(id));
  };

  const handleMarkAllAsRead = () => {
    dispatch(markAllAsRead());
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderNotificationCard = (notification: any) => (
    <TouchableOpacity
      key={notification.id}
      style={[
        styles.notificationCard,
        !notification.isRead && styles.unreadNotification,
      ]}
      activeOpacity={0.7}
      onPress={() => {
        if (!notification.isRead) {
          handleMarkAsRead(notification.id);
        }
      }}
    >
      <View style={styles.cardHeader}>
        <Text style={styles.notificationTitle}>{notification.title}</Text>
        <Text style={styles.notificationDate}>
          {formatDate(notification.createdAt)}
        </Text>
      </View>
      <Text style={styles.notificationDesc}>{notification.message}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />

      {/* HEADER */}
      <LinearGradient colors={theme.gradients.header} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <TouchableOpacity onPress={handleMarkAllAsRead}>
                <Icon name="check-circle" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={{ width: 22 }} />
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={onRefresh} />
        }
      >
        {/* Unread badge */}
        {unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadBadgeText}>
              {unreadCount} unread
            </Text>
          </View>
        )}

        {/* Loading state */}
        {loading && notifications.length === 0 && (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        )}

        {/* Error state */}
        {error && notifications.length === 0 && (
          <View style={styles.centerContainer}>
            <Icon name="wifi-off" size={40} color={theme.colors.muted} />
            <Text style={styles.emptyText}>Failed to load notifications</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => dispatch(fetchNotifications())}
            >
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Empty state */}
        {!loading && !error && notifications.length === 0 && (
          <View style={styles.centerContainer}>
            <Icon name="bell-off" size={40} color={theme.colors.muted} />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        )}

        {/* Notification list */}
        {notifications.map(renderNotificationCard)}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default NotificationsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingTop: Platform.OS === 'android' ? 24 : 0,
    paddingBottom: 40,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scrollContent: {
    padding: 20,
    marginTop: -24,
  },
  unreadBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  unreadBadgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  notificationCard: {
    backgroundColor: theme.colors.overlayWhite90,
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: theme.colors.primaryLegacy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 5,
  },
  unreadNotification: {
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.text,
    flex: 1,
  },
  notificationDate: {
    fontSize: 11,
    color: theme.colors.muted,
    marginLeft: 8,
  },
  notificationDesc: {
    fontSize: 13,
    color: theme.colors.muted,
    marginTop: 4,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: theme.colors.muted,
    marginTop: 12,
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 12,
  },
  retryText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

