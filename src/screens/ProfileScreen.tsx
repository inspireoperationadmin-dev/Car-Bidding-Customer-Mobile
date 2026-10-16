import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../theme';

// Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';
import { fetchProfile, selectProfile, selectProfileLoading, selectProfileError } from '../store/slices/profileSlice';

const ProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const profile = useAppSelector(selectProfile);
  const loading = useAppSelector(selectProfileLoading);
  const error = useAppSelector(selectProfileError);

  useEffect(() => {
    // Fetch profile when screen loads
    dispatch(fetchProfile());
  }, [dispatch]);

  const handleLogout = () => {
    dispatch(logoutUser());
  };

  const renderMenuItem = (
    icon: string,
    title: string,
    subtitle?: string,
    isDestructive = false,
    onPress?: () => void,
  ) => (
    <TouchableOpacity style={styles.menuItem} activeOpacity={0.7} onPress={onPress}>
      <View
        style={[
          styles.menuIconBox,
          isDestructive && styles.destructiveIconBox,
        ]}
      >
        <Icon
          name={icon}
          size={20}
          color={isDestructive ? theme.colors.error : theme.colors.primary}
        />
      </View>

      <View style={styles.menuTextContainer}>
        <Text
          style={[styles.menuTitle, isDestructive && styles.destructiveText]}
        >
          {title}
        </Text>
        {subtitle && <Text style={styles.menuSubtitle}>{subtitle}</Text>}
      </View>

      <Icon name="chevron-right" size={18} color={theme.colors.iconPlaceholder} />
    </TouchableOpacity>
  );

  // Format currency for savings
  const formatCurrency = (amount: number) => {
    return `€${amount.toFixed(2)}`;
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient colors={theme.gradients.header} style={styles.header}>
        <SafeAreaView>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={22} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Profile</Text>
            <TouchableOpacity>
              <Icon name="settings" size={22} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* PROFILE CARD */}
        <View style={styles.profileCard}>
          {loading && !profile ? (
            <ActivityIndicator size="large" color={theme.colors.primary} />
          ) : error ? (
            <View>
              <Text style={styles.errorText}>Failed to load profile</Text>
              <TouchableOpacity
                onPress={() => dispatch(fetchProfile())}
                style={styles.retryButton}
              >
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.avatarContainer}>
                <LinearGradient
                  colors={theme.gradients.primaryButton}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {(profile?.firstName?.[0] || user?.email?.[0] || 'U').toUpperCase()}
                  </Text>
                </LinearGradient>

                <View style={styles.editBadge}>
                  <Icon name="edit-2" size={12} color={theme.colors.white} />
                </View>
              </View>

              <Text style={styles.userName}>
                {profile?.firstName
                  ? `${profile.firstName} ${profile.lastName}`
                  : user?.email || 'User'}
              </Text>
              <Text style={styles.userEmail}>
                {profile?.email || user?.email || 'email@example.com'}
              </Text>

              {/* STATS */}
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profile?.stats?.totalRequests || 0}
                  </Text>
                  <Text style={styles.statLabel}>Requests</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>
                    {profile?.stats?.activeRequests || 0}
                  </Text>
                  <Text style={styles.statLabel}>Active</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* ACCOUNT SETTINGS */}
        <Text style={styles.sectionTitle}>Account Settings</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem(
            'user',
            'Personal Information',
            profile?.phoneNo || 'Add phone number',
            false,
            () => (navigation as any).navigate('PersonalInfo'),
          )}
          {renderMenuItem('credit-card', 'Payment Methods', 'Manage cards')}
          {renderMenuItem('bell', 'Notifications', 'Enabled')}
        </View>

        {/* SUPPORT */}
        <Text style={styles.sectionTitle}>Support</Text>
        <View style={styles.menuContainer}>
          {renderMenuItem('help-circle', 'Get Help')}
          {renderMenuItem('file-text', 'Terms & Conditions')}
        </View>

        {/* LOGOUT */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.85}
        >
          <Icon name="log-out" size={18} color={theme.colors.error} />
          <Text style={styles.logoutText}> Log Out</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

export default ProfileScreen;

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
    justifyContent: 'space-between',
    alignItems: 'center',
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
  profileCard: {
    backgroundColor: theme.colors.overlayWhite90,
    borderRadius: 24,
    padding: 20,
    marginBottom: 24,
    shadowColor: theme.colors.primaryLegacy,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 10,
    alignItems: 'center',
    minHeight: 200,
    justifyContent: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  avatarGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.white,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.primary,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.white,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
    marginTop: 8,
  },
  userEmail: {
    fontSize: 13,
    color: theme.colors.muted,
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.neutralBlueAlpha50,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    width: '100%',
    marginTop: 12,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    backgroundColor: theme.colors.neutralSoftBlue,
    marginHorizontal: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 20,
  },
  menuContainer: {
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.overlayWhite90,
    padding: 16,
    borderRadius: 20,
    marginBottom: 12,
    elevation: 4,
  },
  menuIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: theme.colors.neutralSoftBlue,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  destructiveIconBox: {
    backgroundColor: theme.colors.redSoftTint,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.text,
  },
  menuSubtitle: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 2,
  },
  destructiveText: {
    color: theme.colors.error,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.redAlpha10,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.error,
    marginLeft: 6,
  },
  errorText: {
    fontSize: 14,
    color: theme.colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryText: {
    color: theme.colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});

