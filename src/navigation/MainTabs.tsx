import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import BugunScreen from '../screens/main/BugunScreen';
import GecmisScreen from '../screens/main/GecmisScreen';
import ProfilScreen from '../screens/main/ProfilScreen';
import EnstrümanSecimScreen from '../screens/main/EnstrümanSecimScreen';
import { useAuth } from '../hooks/useAuth';
import { getUserInstruments } from '../services/instruments.service';

// ─── Tab navigator ────────────────────────────────────────────────────────────

type MainTabParamList = {
  Bugun: undefined;
  Gecmis: undefined;
  Profil: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Bugun" component={BugunScreen} options={{ title: 'Bugün' }} />
      <Tab.Screen name="Gecmis" component={GecmisScreen} options={{ title: 'Geçmiş' }} />
      <Tab.Screen name="Profil" component={ProfilScreen} options={{ title: 'Profil' }} />
    </Tab.Navigator>
  );
}

// ─── Main stack (instrument gate + tabs) ─────────────────────────────────────

export type MainStackParamList = {
  EnstrümanSecim: undefined;
  Tabs: undefined;
};

const MainStack = createStackNavigator<MainStackParamList>();

export default function MainTabs() {
  const { user } = useAuth();
  const [initialRoute, setInitialRoute] = useState<keyof MainStackParamList | null>(null);

  useEffect(() => {
    if (!user) return;

    getUserInstruments(user.id)
      .then((instruments) => {
        setInitialRoute(instruments.length === 0 ? 'EnstrümanSecim' : 'Tabs');
      })
      .catch(() => {
        setInitialRoute('Tabs');
      });
  }, [user]);

  if (initialRoute === null) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810' }}>
        <ActivityIndicator color="#C9A84C" size="large" />
      </View>
    );
  }

  return (
    <MainStack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="EnstrümanSecim" component={EnstrümanSecimScreen} />
      <MainStack.Screen name="Tabs" component={TabNavigator} />
    </MainStack.Navigator>
  );
}
