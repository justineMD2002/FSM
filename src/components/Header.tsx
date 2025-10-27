import React from 'react';
import { View, Text } from 'react-native';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <View className="pt-12 px-6 pb-4 rounded-b-2xl shadow-md" style={{ backgroundColor: '#1a338f' }}>
      <Text className="text-white text-xl font-bold">{title}</Text>
    </View>
  );
}
