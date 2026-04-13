const IS_DEV = process.env.APP_VARIANT === 'development';

export default {
  expo: {
    name: IS_DEV ? 'Pins Dev' : 'Pins Inventory',
    slug: 'pins-inventory',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/icon.png',
    scheme: 'pins-inventory',
    userInterfaceStyle: 'automatic',
    splash: {
      image: './assets/splash-icon.png',
      resizeMode: 'contain',
      backgroundColor: '#0F0F0F',
    },
    android: {
      package: IS_DEV ? 'com.osdiego97.pinsinventory.dev' : 'com.osdiego97.pinsinventory',
      adaptiveIcon: {
        foregroundImage: './assets/icon.png',
        backgroundColor: '#0F0F0F',
      },
      predictiveBackGestureEnabled: false,
      permissions: [
        'android.permission.CAMERA',
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.RECORD_AUDIO',
      ],
      config: {
        googleMaps: {
          apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
        },
      },
    },
    plugins: [
      'expo-router',
      'expo-secure-store',
      [
        'expo-image-picker',
        {
          photosPermission: 'Allow Pins Inventory to access your photos.',
          cameraPermission: 'Allow Pins Inventory to use your camera.',
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: '8a0fa5d1-7f8e-4edf-b6e0-ddc5b803f5ea',
      },
    },
    owner: 'osdiego97',
  },
};
