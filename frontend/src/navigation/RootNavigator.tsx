import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#080810' }}>
        <ActivityIndicator testID="loading-spinner" color="#C9A84C" size="large" />
      </View>
    );
  }

  return session ? <MainTabs /> : <AuthStack />;
}
