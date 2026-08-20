import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.simplehello.app',
  appName: 'SimpleHello',
  webDir: 'dist',
  server: {
    url: 'https://simple-hello-page-clone.vercel.app',
    cleartext: false
  }
};

export default config;
