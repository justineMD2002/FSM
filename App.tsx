import './global.css';
import { StatusBar } from 'expo-status-bar';
import { Text, View } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 bg-white items-center justify-center">
      <Text className="text-2xl font-bold text-blue-600">Welcome to FSM!</Text>
      <Text className="mt-4 text-gray-600">React Native + TypeScript + NativeWind + Supabase</Text>
      <StatusBar style="auto" />
    </View>
  );
}
