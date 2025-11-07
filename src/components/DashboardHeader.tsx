import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore, useNavigationStore } from '@/store';

interface DashboardHeaderProps {
  title?: string;
  showMapIcon?: boolean;
}

export default function DashboardHeader({ title = 'My Jobs', showMapIcon = false }: DashboardHeaderProps) {
  const user = useAuthStore((state) => state.user);
  const { selectedJob, setSelectedJob, setShowMapView } = useNavigationStore();

  // Get initials for avatar
  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  // If a job is selected, render the Job Details header
  if (selectedJob) {
    return (
      <View className="bg-white border-b border-slate-200" style={{ zIndex: 1 }}>
        <View className="px-3 pt-7 pb-4">
          <View className="flex-row items-center justify-between">
            {/* Left: Back button and Job Details text */}
            <View className="flex-row items-center">
              <TouchableOpacity onPress={() => setSelectedJob(null)} className="mr-3">
                <Ionicons name="arrow-back" size={24} color="#334155" />
              </TouchableOpacity>
              <Text className="text-black text-xl font-semibold">Job Details</Text>
            </View>

            {/* Right: Info Icon */}
            <View className="flex-row items-center">
              <Ionicons name="information-circle" size={26} color="#0092ce" />
            </View>
          </View>
        </View>
      </View>
    );
  }

  // Default dashboard header
  return (
    <View className="bg-white border-b border-slate-200" style={{ zIndex: 1 }}>
      <View className="px-3 pt-7 pb-4">
        <View className="flex-row items-center justify-between">
          {/* Left: Logo and Title Text */}
          <View className="flex-row items-center">
            <Image
              source={require('../../assets/SAS-LOGO.png')}
              style={{ width: 70, height: 40 }}
              resizeMode="contain"
            />
          </View>
          
          <Text className="absolute left-0 right-0 text-center text-black text-xl font-semibold">
            {title}
          </Text>

          {/* Right: Map Icon (conditional) and Avatar */}
          <View className="flex-row items-center">
            {showMapIcon && (
              <TouchableOpacity
                onPress={() => setShowMapView(true)}
                activeOpacity={0.7}
                style={{ marginRight: 12 }}
              >
                <Ionicons name="map" size={24} color="#0092ce" />
              </TouchableOpacity>
            )}
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: '#ffffff' }}
            >
              <Text className="text-base font-bold" style={{ color: '#0092ce' }}>
                {getInitials()}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
