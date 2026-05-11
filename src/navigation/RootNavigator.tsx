import React, { useState } from 'react';
import AuthStack from './AuthStack';
import MainTabs from './MainTabs';

export default function RootNavigator() {
  // Placeholder auth state — wire to Supabase session once backend is ready
  const [isAuthenticated] = useState(false);

  return isAuthenticated ? <MainTabs /> : <AuthStack />;
}
