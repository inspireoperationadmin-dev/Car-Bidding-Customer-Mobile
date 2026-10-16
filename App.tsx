import React from 'react';
import { StatusBar, useColorScheme, View, Text, LogBox } from 'react-native';

LogBox.ignoreAllLogs();
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { StripeProvider } from '@stripe/stripe-react-native';
import { ENV } from './src/config/env';

import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  const publishableKey = ENV.stripePublishableKey;

  if (!publishableKey) {
    console.warn('STRIPE_PUBLISHABLE_KEY is missing. Check .env and rebuild.');
    return (
      <SafeAreaProvider>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', marginBottom: 8 }}>
            Stripe Key Missing
          </Text>
          <Text style={{ textAlign: 'center', color: '#6B7280' }}>
            Add STRIPE_PUBLISHABLE_KEY to .env and rebuild the app.
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <Provider store={store}>
      <StripeProvider publishableKey={publishableKey}>
        <SafeAreaProvider>
          <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
          <AppNavigator />
        </SafeAreaProvider>
      </StripeProvider>
    </Provider>
  );
}

export default App;
