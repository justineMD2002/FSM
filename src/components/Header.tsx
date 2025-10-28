import React from 'react';
import { View, Text } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth();

  return (
    <View className="pt-7 px-6 pb-8" style={{ backgroundColor: '#0092ce', zIndex: 1 }}>
      <View className="flex-row items-center justify-between">
        <Text className="text-white text-xl font-bold">{title}</Text>
        {title === 'Profile' && user?.id && (
          <Text className="text-white text-xs font-mono">ID: {user.id.slice(0, 8)}</Text>
        )}
      </View>
    </View>
  );
}
