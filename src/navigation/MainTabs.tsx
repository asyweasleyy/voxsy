import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BugunScreen from '../screens/main/BugunScreen';
import GecmisScreen from '../screens/main/GecmisScreen';
import ProfilScreen from '../screens/main/ProfilScreen';

export type MainTabParamList = {
  Bugun: undefined;
  Gecmis: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Bugun" component={BugunScreen} options={{ title: 'Bugün' }} />
      <Tab.Screen name="Gecmis" component={GecmisScreen} options={{ title: 'Geçmiş' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}
