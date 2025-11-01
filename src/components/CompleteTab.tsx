import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function CompleteTab() {
  return (
    <View className="bg-white rounded-xl p-6 items-center justify-center" style={{ minHeight: 200 }}>
      <Ionicons name="checkmark-circle-outline" size={48} color="#cbd5e1" />
      <Text className="text-slate-500 mt-4 text-center">Complete view coming soon</Text>
    </View>
  );
}
