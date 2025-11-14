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
// Wrap in try-catch to handle new architecture initialization issues
try {
  SplashScreenExpo.preventAutoHideAsync();
} catch (error) {
  console.warn('Failed to prevent splash screen from auto-hiding:', error);
}

export default function App() {
  const { user, loading, initialize } = useAuthStore();
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;

    async function prepare() {
      try {
        // Initialize auth store
        cleanup = initialize();

        // Artificially delay for at least 1 second to show splash screen
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('Error during app initialization:', e);
      } finally {
        // Tell the application to render
        setAppIsReady(true);
      }
    }

    prepare();

    // Return cleanup function for useEffect
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [initialize]);

  const onLayoutRootView = useCallback(async () => {
    if (appIsReady) {
      // This tells the splash screen to hide immediately! If we call this after
      // `setAppIsReady`, then we may see a blank screen while the app is
      // loading its initial state and rendering its first pixels. So instead,
      // we hide the splash screen once we know the root view has already
      // performed layout.
      try {
        await SplashScreenExpo.hideAsync();
      } catch (error) {
        console.warn('Failed to hide splash screen:', error);
      }
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
