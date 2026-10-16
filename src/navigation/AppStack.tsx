import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {AppStackParamList} from './types';

import BottomTabs from './BottomTabs'; // 👇 we will create / rename your current Tab file to BottomTabs
import RequestDetail from '../screens/RequestDetail';
import Bids from '../screens/Bids';
import Payment from '../screens/Payment';
import PaymentConfirmation from '../screens/PaymentConfirmation';

import MechanicProfile from '../screens/MechanicProfile';
import PersonalInfoScreen from '../screens/PersonalInfoScreen';

const Stack = createNativeStackNavigator<AppStackParamList>();

export default function AppStack() {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="Tabs" component={BottomTabs} />

      {/* Hidden flow screens */}
      <Stack.Screen name="RequestDetail" component={RequestDetail} />
      <Stack.Screen name="Bids" component={Bids} />
      {/* <Stack.Screen name="MechanicMap" component={MechanicMap} /> */}
      <Stack.Screen name="MechanicProfile" component={MechanicProfile} />
      <Stack.Screen name="PersonalInfo" component={PersonalInfoScreen} />
      <Stack.Screen name="Payment" component={Payment} />
      <Stack.Screen name="PaymentConfirmation" component={PaymentConfirmation} />
    
    </Stack.Navigator>
  );
}
