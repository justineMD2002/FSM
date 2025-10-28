import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView
      className="flex-1 px-6 pb-20 bg-white"
      style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}
    >
        <View className="bg-white rounded-2xl p-6 shadow-md mb-4">
          <Text className="text-2xl font-bold text-slate-800 mb-2">
            Welcome back!
          </Text>
          <Text className="text-slate-600 text-base">
            You've successfully logged into the Field Service Management system.
          </Text>
        </View>

        <View className="flex-row mb-4">
          <View className="flex-1 bg-white rounded-2xl p-5 mr-2 shadow-md">
            <Text className="text-slate-500 text-sm mb-1">Active Jobs</Text>
            <Text className="text-3xl font-bold" style={{ color: '#0092ce' }}>0</Text>
          </View>
          <View className="flex-1 bg-white rounded-2xl p-5 ml-2 shadow-md">
            <Text className="text-slate-500 text-sm mb-1">Completed</Text>
            <Text className="text-3xl font-bold text-green-600">0</Text>
          </View>
        </View>

        <View className="bg-white rounded-2xl p-6 shadow-md mb-6">
          <Text className="text-slate-800 font-bold text-lg mb-4">
            Account Information
          </Text>
          <View className="mb-3">
            <Text className="text-slate-500 text-sm mb-1">Email</Text>
            <Text className="text-slate-800 text-base">{user?.email}</Text>
          </View>
          <View>
            <Text className="text-slate-500 text-sm mb-1">User ID</Text>
            <Text className="text-slate-800 text-xs font-mono">{user?.id}</Text>
          </View>
        </View>
      </ScrollView>
  );
}
