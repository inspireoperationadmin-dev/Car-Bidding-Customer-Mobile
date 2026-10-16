import React from 'react';
import {View, TouchableOpacity, StyleSheet, Platform} from 'react-native';
import {createBottomTabNavigator, BottomTabBarProps} from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {AppTabParamList} from './types';
import {theme} from '../theme';

// Screens
import HomeScreen from '../screens/HomeScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SubmitRequest from '../screens/SubmitRequest';
import RequestsList from '../screens/RequestsList';
import NotificationsScreen from '../screens/Notifications';

const Tab = createBottomTabNavigator<AppTabParamList>();

const CustomTabBar = ({state, descriptors, navigation}: BottomTabBarProps) => {
  const insets = useSafeAreaInsets();
  const bottomInset = insets.bottom > 0 ? insets.bottom + 10 : 24;

  return (
    <View style={[styles.tabBarContainer, {bottom: bottomInset}]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name as never);
          }
        };

        if (route.name === 'SubmitRequest') {
          return (
            <View key={route.key} style={styles.centerSlot}>
              <TouchableOpacity
                style={styles.middleButton}
                onPress={onPress}
                activeOpacity={0.85}>
                <LinearGradient
                  colors={[theme.colors.gradBtnStart, theme.colors.primary, theme.colors.gradBtnEnd]}
                  start={{x: 0, y: 0}}
                  end={{x: 1, y: 1}}
                  style={styles.middleButtonInner}>
                  <Icon name="plus" size={26} color={theme.colors.white} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          );
        }

        let iconName = 'circle';
        if (route.name === 'Home') iconName = 'home';
        else if (route.name === 'Requests') iconName = 'file-text';
        else if (route.name === 'Notifications') iconName = 'bell';
        else if (route.name === 'Profile') iconName = 'user';

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.tabButton}
            activeOpacity={0.7}>
            <View style={[styles.iconWrapper, isFocused && styles.activeIconWrapper]}>
              <Icon
                name={iconName}
                size={22}
                color={isFocused ? theme.colors.primary : theme.colors.tabInactive}
              />
            </View>
            {isFocused && <View style={styles.activeDot} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={{headerShown: false}}
      tabBar={props => <CustomTabBar {...props} />}>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Requests" component={RequestsList} />
      <Tab.Screen name="SubmitRequest" component={SubmitRequest} />
      <Tab.Screen name="Notifications" component={NotificationsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: 64,
    backgroundColor: theme.colors.white,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 6,
    shadowColor: theme.colors.violetMid,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.16,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(235, 230, 255, 0.9)',
  },
  tabButton: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    width: 40,
    height: 38,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconWrapper: {
    backgroundColor: theme.colors.purpleAlpha10,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.colors.primary,
    marginTop: 2,
  },
  centerSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  middleButton: {
    position: 'absolute',
    top: -16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middleButtonInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: theme.colors.primary,
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
});



