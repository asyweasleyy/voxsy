const APP_ENV = process.env.APP_ENV ?? 'development';

const envConfig = {
  development: {
    name: 'Voxsy (Dev)',
    package: 'com.voxsy.app.dev',
  },
  preview: {
    name: 'Voxsy (Preview)',
    package: 'com.voxsy.app.preview',
  },
  production: {
    name: 'Voxsy',
    package: 'com.voxsy.app',
  },
};

const { name, package: androidPackage } = envConfig[APP_ENV] ?? envConfig.development;

export default {
  expo: {
    name,
    slug: 'voxsy',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#080810',
    },
    ios: {
      supportsTablet: true,
      infoPlist: {
        NSPhotoLibraryUsageDescription:
          'Voxsy, pratik videolarını günlüğüne eklemek için galeri erişimi istiyor.',
      },
    },
    android: {
      adaptiveIcon: {
        foregroundImage: './assets/adaptive-icon.png',
        backgroundColor: '#080810',
      },
      package: androidPackage,
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },
    web: {
      favicon: './assets/favicon.png',
    },
    extra: {
      appEnv: APP_ENV,
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
};
