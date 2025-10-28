import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isClockedIn, setIsClockedIn] = useState(false);

  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const handleClockToggle = () => {
    setIsClockedIn(!isClockedIn);
  };

  // Get initials for avatar
  const getInitials = () => {
    const email = user?.email || '';
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <>
      <ScrollView
        className="flex-1 px-6 pb-20 bg-white"
        style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}
      >
        {/* Avatar */}
        <View className="items-center mb-3">
          <View
            className="w-24 h-24 rounded-full items-center justify-center"
            style={{ backgroundColor: '#0092ce' }}
          >
            <Text className="text-white text-3xl font-bold">{getInitials()}</Text>
          </View>
        </View>

        {/* Name */}
        <Text className="text-2xl font-bold text-slate-800 text-center mb-1">
          {user?.email?.split('@')[0]}
        </Text>

        {/* Email */}
        <Text className="text-slate-500 text-base text-center mb-6">
          {user?.email}
        </Text>

        {/* Last Clockout Card */}
        <View className="bg-white rounded-2xl p-5 shadow-md mb-4">
          <Text className="text-slate-500 text-sm mb-1">Last Clock Out</Text>
          <Text className="text-slate-800 text-lg font-semibold">--:--</Text>
        </View>

        {/* Running Time Card */}
        <View className="bg-white rounded-2xl p-5 shadow-md mb-4">
          <Text className="text-slate-500 text-sm mb-1">Running Time</Text>
          <Text className="text-slate-800 text-lg font-semibold">00:00:00</Text>
        </View>

        {/* Clock In/Out Button */}
        <TouchableOpacity
          className="rounded-xl py-4 shadow-md mb-6"
          style={{ backgroundColor: isClockedIn ? '#ef4444' : '#0092ce' }}
          onPress={handleClockToggle}
          activeOpacity={0.8}
        >
          <Text className="text-white text-center font-bold text-base">
            {isClockedIn ? 'Clock Out' : 'Clock In'}
          </Text>
        </TouchableOpacity>

        {/* Settings Section */}
        <View className="bg-white rounded-2xl shadow-md mb-4">
          {/* Edit Profile */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="person-outline" size={20} color="#64748b" />
              <Text className="text-slate-800 text-base ml-3">Edit Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* About */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="information-circle-outline" size={20} color="#64748b" />
              <Text className="text-slate-800 text-base ml-3">About</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Privacy Policy */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4 border-b border-slate-100"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" />
              <Text className="text-slate-800 text-base ml-3">Privacy Policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#64748b" />
          </TouchableOpacity>

          {/* Logout */}
          <TouchableOpacity
            className="flex-row items-center justify-between px-5 py-4"
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text className="text-red-600 text-base ml-3">Logout</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
}
