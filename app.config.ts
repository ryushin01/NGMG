import type { ExpoConfig } from 'expo/config';

const config: ExpoConfig = {
  name: '신세계',
  slug: 'newworld',
  scheme: 'newworld',
  version: '2.4.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  backgroundColor: '#ffffff',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.ryushin01.newworld',
    infoPlist: { CFBundleDevelopmentRegion: 'ko', ITSAppUsesNonExemptEncryption: false },
  },
  android: {
    package: 'com.ryushin01.newworld',
    adaptiveIcon: {
      backgroundColor: '#2a2233',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    softwareKeyboardLayoutMode: 'resize',
    predictiveBackGestureEnabled: false,
  },
  web: { favicon: './assets/favicon.png' },
  plugins: [
    './plugins/with-gradle-memory',
    [
      'expo-build-properties',
      {
        android: {
          // 로컬 Supabase(http)로 E2E를 돌릴 때만 평문 통신을 허용합니다.
          usesCleartextTraffic: (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').startsWith('http://'),
          // react-native-maps가 가져오는 WorkManager의 Room DB는 이름으로 찾으므로 R8 제거를 막습니다.
          extraProguardRules:
            '-keep class * extends androidx.room.RoomDatabase { <init>(); }\n-keep class androidx.work.impl.WorkDatabase_Impl { *; }',
        },
      },
    ],
    'expo-router',
    'expo-secure-store',
    [
      'expo-splash-screen',
      { image: './assets/splash-icon.png', imageWidth: 200, backgroundColor: '#ffffff' },
    ],
    [
      'expo-location',
      {
        locationWhenInUsePermission:
          '지도에서 현재 위치를 보여 주고 주변 장소를 찾기 위해 위치 정보를 사용합니다.',
        locationAlwaysAndWhenInUsePermission:
          '앱을 닫아 두어도 여행지 근처에 도착하면 알려 드리기 위해 위치 정보를 사용합니다. 위치는 기기 밖으로 보내지 않습니다.',
        // 도착 알림은 지역 감시(geofencing)만 쓰므로 Android 포그라운드 서비스는 켜지 않습니다.
        isIosBackgroundLocationEnabled: true,
        isAndroidBackgroundLocationEnabled: true,
        isAndroidForegroundServiceEnabled: false,
      },
    ],
    // 도착 알림은 기기 안에서 만드는 로컬 알림이라 원격 푸시(APNs) 권한을 넣지 않습니다.
    ['expo-notifications', { enableRemoteNotifications: false, color: '#c2792b' }],
    [
      'expo-image-picker',
      {
        photosPermission: '여행 기록에 사진을 첨부하기 위해 사진 보관함에 접근합니다.',
        cameraPermission: '기록에 첨부할 사진을 촬영하기 위해 카메라를 사용합니다.',
      },
    ],
    [
      'react-native-maps',
      { androidGoogleMapsApiKey: process.env.GOOGLE_MAPS_ANDROID_API_KEY ?? '' },
    ],
  ],
  extra: { googleMapsConfigured: Boolean(process.env.GOOGLE_MAPS_ANDROID_API_KEY) },
  experiments: { typedRoutes: true },
};

export default config;
