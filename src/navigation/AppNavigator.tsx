import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

// Redux
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { loadUser } from '../store/slices/authSlice';

// Navigators
import AuthNavigator from './AuthNavigator';
import AppStack from './AppStack';
import { RootStackParamList } from './types';
import {theme} from '../theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const dispatch = useAppDispatch();
  
  // Redux-ல் இருந்து auth state மற்றும் loading இரண்டையும் எடுக்கிறோம்
  const { isAuthenticated, loading } = useAppSelector((state) => state.auth);

  // 1. ஆப் தொடங்கியவுடன் User விபரங்களை Load செய்யவும்
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // 2. Loading-ாக இருந்தால் Spinner-ஐ காட்டவும் (இதுதான் Stuck ஆவதை தடுக்கும்)
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          // ✅ பயனர் லாகின் செய்திருந்தால்
          <Stack.Screen name="App" component={AppStack} />
          
        ) : (
          // ❌ பயனர் லாகின் செய்யவில்லை என்றால்
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.appBackgroundSoft,
  },
});
