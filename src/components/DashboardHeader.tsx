import React from 'react';
import { View, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardHeader() {
  const { user } = useAuth();

  // Get initials for avatar
  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <View className="pt-7 px-6 pb-8" style={{ backgroundColor: '#0092ce', zIndex: 1 }}>
      <View className="flex-row items-center justify-between">
        {/* Left: Logo and My Jobs Text */}
        <View className="flex-row items-center">
          <Image
            source={require('../../assets/SAS-LOGO.png')}
            style={{ width: 40, height: 40 }}
            resizeMode="contain"
          />
          <Text className="text-white text-xl font-bold ml-3">My Jobs</Text>
        </View>

        {/* Right: Info Icon and Avatar */}
        <View className="flex-row items-center">
          <Ionicons name="information-circle-outline" size={24} color="#ffffff" style={{ marginRight: 12 }} />
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Text className="text-base font-bold" style={{ color: '#0092ce' }}>
              {getInitials()}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
