import './global.css';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';
import { useAuthStore } from '@/store';
import LoginScreen from '@/screens/LoginScreen';
import MainScreen from '@/screens/MainScreen';

export default function App() {
  const { user, loading, initialize } = useAuthStore();

  useEffect(() => {
    const cleanup = initialize();
    return cleanup;
  }, [initialize]);

  if (loading) {
    return (
      <View className="flex-1 bg-slate-50 items-center justify-center">
        <ActivityIndicator size="large" color="#2563eb" />
      </View>
    );
  }

  return (
    <>
      {user ? <MainScreen /> : <LoginScreen />}
      <StatusBar style="auto" />
    </>
  );
}
