import React, {useMemo} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import {NativeStackNavigationProp} from '@react-navigation/native-stack';
import {AppStackParamList} from '../navigation/types';
import {MechanicProfileEntity} from '../types/api';
import {theme} from '../theme';

const MechanicProfile: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const route = useRoute<RouteProp<AppStackParamList, 'MechanicProfile'>>();
  const {mechanicId} = route.params;

  const mechanic = useMemo(() => {
    const list: MechanicProfileEntity[] = [
      {
        id: 11,
        name: 'Kumar Auto Works',
        rating: 4.7,
        reviewsCount: 88,
        phone: '+94 77 123 4567',
        address: 'Negombo',
        experience: '8 Years',
        about: 'Specialist in body repairs, paint jobs and bumper works.',
      },
      {
        id: 12,
        name: 'Jaffna Garage Pro',
        rating: 4.4,
        reviewsCount: 61,
        phone: '+94 77 987 6543',
        address: 'Jaffna',
        experience: '6 Years',
        about: 'Affordable repairs with quality spare-part inspection.',
      },
      {
        id: 13,
        name: 'Colombo QuickFix',
        rating: 4.9,
        reviewsCount: 120,
        phone: '+94 77 555 1122',
        address: 'Colombo',
        experience: '10 Years',
        about: 'Fast service, premium finishing, same-day support possible.',
      },
    ];

    return list.find(m => m.id === Number(mechanicId));
  }, [mechanicId]);

  if (!mechanic) {
    return (
      <SafeAreaView style={styles.center}>
        <Text>Mechanic not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mechanic Profile</Text>
        <View style={{width: 22}} />
      </View>

      {/* Full Details */}
      <View style={styles.content}>
        <Text style={styles.name}>{mechanic.name}</Text>

        <Text style={styles.text}>⭐ Rating: {mechanic.rating} ({mechanic.reviewsCount} reviews)</Text>
        <Text style={styles.text}>📞 Phone: {mechanic.phone}</Text>
        <Text style={styles.text}>📍 Address: {mechanic.address}</Text>
        <Text style={styles.text}>🛠 Experience: {mechanic.experience}</Text>

        <Text style={styles.aboutTitle}>About</Text>
        <Text style={styles.aboutText}>{mechanic.about}</Text>
      </View>
    </SafeAreaView>
  );
};

export default MechanicProfile;

const styles = StyleSheet.create({
  center: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  container: {flex: 1, backgroundColor: theme.colors.white},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.neutralLine,
  },
  headerTitle: {fontSize: 16, fontWeight: '800'},
  content: {padding: 16},
  name: {fontSize: 20, fontWeight: '900', marginBottom: 14},
  text: {fontSize: 14, marginBottom: 10, color: theme.colors.textStrong},
  aboutTitle: {fontSize: 16, fontWeight: '800', marginTop: 10, marginBottom: 6},
  aboutText: {fontSize: 14, color: theme.colors.textMedium, lineHeight: 20},
});

