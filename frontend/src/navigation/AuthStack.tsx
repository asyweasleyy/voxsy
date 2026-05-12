import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import InstrumentSelectionScreen from '../screens/auth/InstrumentSelectionScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  InstrumentSelection: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export default function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="InstrumentSelection" component={InstrumentSelectionScreen} />
    </Stack.Navigator>
  );
}
