import React, {useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {useSelector, useDispatch} from 'react-redux';
import Animated, {FadeInDown} from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';

import {RootState, AppDispatch} from '../store';
import {fetchRequests} from '../store/slices/requestSlice';
import {RequestCard} from '../components/requests/RequestCard';
import {theme} from '../theme';

const Requests: React.FC = () => {
  const navigation = useNavigation<any>();
  const dispatch = useDispatch<AppDispatch>();
  const {requests, loading} = useSelector((state: RootState) => state.requests);

  useEffect(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  const onRefresh = useCallback(() => {
    dispatch(fetchRequests());
  }, [dispatch]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ✅ TOP HEADER WITH BACK BUTTON */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.85}>
          <Icon name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>Requests</Text>

        {/* right spacer (to keep title centered) */}
        <View style={styles.rightSpace} />
      </View>

      {/* ✅ BODY */}
      {loading && !requests.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      ) : !requests.length ? (
        <View style={styles.center}>
          <Text style={styles.emptyTitle}>No Requests Yet</Text>
          <Text style={styles.emptySubtitle}>
            Create a request to start receiving bids
          </Text>
        </View>
      ) : (
        <View style={styles.container}>
          <FlatList
            data={requests}
            keyExtractor={item => item.id.toString()}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={loading}
                onRefresh={onRefresh}
                tintColor={theme.colors.primary}
              />
            }
            renderItem={({item, index}) => (
              <Animated.View entering={FadeInDown.delay(index * 70)}>
                <RequestCard
                  request={item}
                  onPress={() =>
                    navigation.navigate('RequestDetail', {requestId: item.id})
                  }
                />
              </Animated.View>
            )}
          />
        </View>
      )}
    </SafeAreaView>
  );
};

export default Requests;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },

  // ✅ HEADER like your screenshot
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 6 : 0,
    paddingBottom: 12,
    backgroundColor: theme.colors.background,
  },
  backBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: theme.colors.overlayWhite80,
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
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.text,
  },
  rightSpace: {
    width: 44, // same as backBtn width to center title
  },

  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  listContent: {
    padding: theme.spacing.lg,
    paddingTop: 6,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: theme.colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: theme.colors.muted,
    textAlign: 'center',
  },
});

