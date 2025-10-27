import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: signOut
        }
      ]
    );
  };

  // Get initials for avatar
  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <ScrollView className="flex-1 px-6 pt-6 pb-20">
        {/* Avatar Section */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4 items-center">
          <View
            className="w-24 h-24 rounded-full items-center justify-center mb-4"
            style={{ backgroundColor: '#1a338f' }}
          >
            <Text className="text-white text-3xl font-bold">{getInitials()}</Text>
          </View>
          <Text className="text-xl font-bold text-slate-800">{user?.email?.split('@')[0]}</Text>
          <Text className="text-slate-500 text-sm mt-1">{user?.email}</Text>
        </View>

        {/* Profile Details */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4">
          <Text className="text-lg font-bold text-slate-800 mb-4">
            Account Information
          </Text>

          <View className="mb-4">
            <Text className="text-slate-500 text-sm mb-1">Email Address</Text>
            <Text className="text-slate-800 text-base">{user?.email}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-slate-500 text-sm mb-1">Name</Text>
            <Text className="text-slate-800 text-base">{user?.email?.split('@')[0] || 'Not set'}</Text>
          </View>

          <View className="mb-4">
            <Text className="text-slate-500 text-sm mb-1">Contact Number</Text>
            <Text className="text-slate-800 text-base">Not set</Text>
          </View>

          <View>
            <Text className="text-slate-500 text-sm mb-1">User ID</Text>
            <Text className="text-slate-800 text-xs font-mono">{user?.id}</Text>
          </View>
        </View>

        {/* Account Actions */}
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4">
          <Text className="text-lg font-bold text-slate-800 mb-4">
            Account Actions
          </Text>

          <TouchableOpacity
            className="bg-slate-100 rounded-xl px-4 py-4 mb-3"
            activeOpacity={0.7}
          >
            <Text className="text-slate-800 font-semibold text-base">Edit Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-slate-100 rounded-xl px-4 py-4 mb-3"
            activeOpacity={0.7}
          >
            <Text className="text-slate-800 font-semibold text-base">Change Password</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="bg-red-50 rounded-xl px-4 py-4 border border-red-200"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <Text className="text-red-600 font-semibold text-base text-center">Logout</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
  );
}
