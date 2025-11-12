import './global.css';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { useEffect, useCallback, useState } from 'react';
import * as SplashScreenExpo from 'expo-splash-screen';
import { useAuthStore } from '@/store';
import LoginScreen from '@/screens/LoginScreen';
import MainScreen from '@/screens/MainScreen';
import SplashScreen from '@/components/SplashScreen';

// Keep the splash screen visible while we fetch resources
SplashScreenExpo.preventAutoHideAsync();

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        // Initialize auth store
        const cleanup = initialize();

        // Artificially delay for at least 1 second to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));

        return cleanup;
      } catch (e) {
        console.warn(e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();
  }, [initialize]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      await SplashScreenExpo.hideAsync();
    }
  }, [appIsReady]);

  // Show custom splash screen while app is loading
  if (!appIsReady || loading) {
    return <SplashScreen />;
  }

  return (
    <>
      <View onLayout={onLayoutRootView} style={{ flex: 1 }}>
        {user ? <MainScreen /> : <LoginScreen />}
      </View>
      <StatusBar style="auto" />
    </>
  );
}
