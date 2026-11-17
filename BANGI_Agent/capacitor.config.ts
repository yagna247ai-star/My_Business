import { CapacitorConfig } from '@capacitor/cli';
const config: CapacitorConfig = {
  appId: 'ai.bangi.agent',
  appName: 'Bangi',
  webDir: 'frontend',
  server: { androidScheme: 'https', iosScheme: 'https' },
  plugins: {
    SplashScreen: { launchShowDuration: 1200, backgroundColor: '#070A12' },
    LocalNotifications: { smallIcon: 'ic_stat_bangi', iconColor: '#C9A86A' }
  }
};
export default config;
