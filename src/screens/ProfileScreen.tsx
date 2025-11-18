import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { TechnicianProfile, AttendanceRecord } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import { setBreakStatus } from '@/services/attendance.service';

export default function ProfileScreen() {
  const { user, signOut } = useAuthStore();
  const [profile, setProfile] = useState<TechnicianProfile | null>(null);
  const [currentAttendance, setCurrentAttendance] = useState<AttendanceRecord | null>(null);
  const [lastClockOut, setLastClockOut] = useState<string | null>(null);
  const [runningTime, setRunningTime] = useState('00:00:00');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  // Break functionality states
  const [isOnBreak, setIsOnBreak] = useState(false);
  const [breakStartTime, setBreakStartTime] = useState<number | null>(null);
  const [totalBreakTime, setTotalBreakTime] = useState(0);

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showImageOptions, setShowImageOptions] = useState(false);

  const [editForm, setEditForm] = useState({
    full_name: '',
    phone_number: '',
  });
  const [originalForm, setOriginalForm] = useState({
    full_name: '',
    phone_number: '',
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchAttendanceData();
    }
  }, [user]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (currentAttendance?.clock_in && !currentAttendance?.clock_out && !isOnBreak) {
      interval = setInterval(() => {
        const clockInTime = new Date(currentAttendance.clock_in).getTime();
        const now = Date.now();
        const diff = now - clockInTime - totalBreakTime;

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        setRunningTime(
          `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        );
      }, 1000);
    } else if (!currentAttendance?.clock_in || currentAttendance?.clock_out) {
      setRunningTime('00:00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentAttendance, isOnBreak, totalBreakTime]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('technicians')
        .select('*')
        .eq('user_id', user!.id)
        .single();

      if (error) throw error;
      setProfile(data);
      const formData = {
        full_name: data.full_name || '',
        phone_number: data.phone_number || '',
      };
      setEditForm(formData);
      setOriginalForm(formData);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceData = async () => {
    try {
      const { data: techData } = await supabase
        .from('technicians')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!techData) return;

      const { data: activeAttendance } = await supabase
        .from('attendance')
        .select('*')
        .eq('technician_id', techData.id)
        .is('clock_out', null)
        .order('clock_in', { ascending: false })
        .limit(1)
        .maybeSingle();

      setCurrentAttendance(activeAttendance);

      // Set break status from database
      if (activeAttendance?.is_break === true) {
        setIsOnBreak(true);
      } else {
        setIsOnBreak(false);
      }

      const { data: lastAttendance } = await supabase
        .from('attendance')
        .select('clock_out')
        .eq('technician_id', techData.id)
        .not('clock_out', 'is', null)
        .order('clock_out', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastAttendance?.clock_out) {
        const clockOutDate = new Date(lastAttendance.clock_out);
        setLastClockOut(clockOutDate.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        }));
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const handleClockIn = async () => {
    if (!profile) {
      Alert.alert('Error', 'Profile not loaded. Please refresh the page.');
      return;
    }

    try {
      console.log('Clocking in with technician_id:', profile.id);

      const { data, error } = await supabase
        .from('attendance')
        .insert({
          technician_id: profile.id,
          clock_in: new Date().toISOString(),
          is_break: false,
        })
        .select()
        .single();

      if (error) {
        console.error('Clock in error:', error);
        throw error;
      }

      console.log('Clock in successful:', data);
      setCurrentAttendance(data);
      // Reset break states
      setIsOnBreak(false);
      setBreakStartTime(null);
      setTotalBreakTime(0);
      setShowSuccessModal(true);
      await fetchAttendanceData();
    } catch (error: any) {
      console.error('Error clocking in:', error);
      Alert.alert('Error', error?.message || 'Failed to clock in. Please try again.');
    }
  };

  const handleClockOut = async () => {
    if (!currentAttendance) {
      Alert.alert('Error', 'No active clock in session found.');
      return;
    }

    try {
      const clockOutTime = new Date().toISOString();
      const clockInTime = new Date(currentAttendance.clock_in).getTime();
      // Calculate duration excluding break time
      const durationMinutes = Math.floor((Date.now() - clockInTime - totalBreakTime) / (1000 * 60));

      console.log('Clocking out attendance:', currentAttendance.id);

      const { error } = await supabase
        .from('attendance')
        .update({
          clock_out: clockOutTime,
          duration_minutes: durationMinutes,
        })
        .eq('id', currentAttendance.id);

      if (error) {
        console.error('Clock out error:', error);
        throw error;
      }

      console.log('Clock out successful');
      setCurrentAttendance(null);
      // Reset break states
      setIsOnBreak(false);
      setBreakStartTime(null);
      setTotalBreakTime(0);
      await fetchAttendanceData();
      Alert.alert('Success', 'You have been clocked out successfully.');
    } catch (error: any) {
      console.error('Error clocking out:', error);
      Alert.alert('Error', error?.message || 'Failed to clock out. Please try again.');
    }
  };

  const handleBreakToggle = async () => {
    if (!currentAttendance) {
      Alert.alert('Error', 'You must be clocked in to take a break.');
      return;
    }

    try {
      const newBreakStatus = !isOnBreak;

      // Update database
      const { error } = await setBreakStatus(currentAttendance.id, newBreakStatus);

      if (error) {
        Alert.alert('Error', error.message || 'Failed to update break status.');
        return;
      }

      // Update local state
      if (newBreakStatus) {
        // Starting break
        setBreakStartTime(Date.now());
        setIsOnBreak(true);
        Alert.alert('Break Started', 'You are now on break.');
      } else {
        // Ending break
        if (breakStartTime) {
          const breakDuration = Date.now() - breakStartTime;
          setTotalBreakTime(totalBreakTime + breakDuration);
          setBreakStartTime(null);
        }
        setIsOnBreak(false);
        Alert.alert('Break Ended', 'You are back online.');
      }

      // Refetch attendance data to ensure sync
      await fetchAttendanceData();
    } catch (error: any) {
      console.error('Error toggling break:', error);
      Alert.alert('Error', error?.message || 'Failed to update break status.');
    }
  };

  const handleClockToggle = () => {
    if (currentAttendance) {
      handleClockOut();
    } else {
      handleClockIn();
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant camera roll permissions to upload a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets[0]) {
      uploadImage(result.assets[0].uri);
    }
    setShowImageOptions(false);
  };

  const uploadImage = async (uri: string) => {
    if (!profile) return;

    setUploading(true);
    try {
      const response = await fetch(uri);
      const blob = await response.blob();
      const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${profile.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      if (profile.avatar_url) {
        const oldPath = profile.avatar_url.split('/').pop();
        if (oldPath) {
          await supabase.storage.from('avatar').remove([`avatars/${oldPath}`]);
        }
      }

      const { error: uploadError } = await supabase.storage
        .from('avatar')
        .upload(filePath, blob, {
          contentType: `image/${fileExt}`,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatar')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('technicians')
        .update({ avatar_url: publicUrl })
        .eq('id', profile.id);

      if (updateError) throw updateError;

      setProfile({ ...profile, avatar_url: publicUrl });
      Alert.alert('Success', 'Profile picture updated successfully.');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload image. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const deleteProfilePicture = async () => {
    if (!profile?.avatar_url) return;

    try {
      const oldPath = profile.avatar_url.split('/').pop();
      if (oldPath) {
        await supabase.storage.from('avatar').remove([`avatars/${oldPath}`]);
      }

      const { error } = await supabase
        .from('technicians')
        .update({ avatar_url: null })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({ ...profile, avatar_url: null });
      Alert.alert('Success', 'Profile picture removed successfully.');
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Error', 'Failed to delete image. Please try again.');
    }
    setShowImageOptions(false);
  };

  const handleUpdateProfile = async () => {
    if (!profile) return;

    if (editForm.full_name === originalForm.full_name && editForm.phone_number === originalForm.phone_number) {
      Alert.alert('No Changes', 'You have not made any changes to your profile.');
      return;
    }

    try {
      const { error } = await supabase
        .from('technicians')
        .update({
          full_name: editForm.full_name,
          phone_number: editForm.phone_number,
        })
        .eq('id', profile.id);

      if (error) throw error;

      setProfile({
        ...profile,
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
      });
      setOriginalForm({
        full_name: editForm.full_name,
        phone_number: editForm.phone_number,
      });
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully.');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const confirmLogout = () => {
    setShowLogoutModal(false);
    signOut();
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#0092ce" />
      </View>
    );
  }

  return (
    <>
      <ScrollView
        className="flex-1 px-6 pb-20 bg-white"
        style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}
      >
        <View className="items-center mb-3">
          <TouchableOpacity
            onPress={() => setShowImageOptions(true)}
            activeOpacity={0.7}
            className="relative"
          >
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: '#0092ce' }}
              >
                <Text className="text-white text-3xl font-bold">
                  {profile ? getInitials(profile.full_name) : '??'}
                </Text>
              </View>
            )}
            {uploading && (
              <View className="absolute inset-0 w-24 h-24 rounded-full bg-black/50 items-center justify-center">
                <ActivityIndicator color="#ffffff" />
              </View>
            )}
            <View
              className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: '#0092ce' }}
            >
              <Ionicons name="camera" size={16} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>

        <Text className="text-2xl font-bold text-slate-800 text-center mb-1">
          {profile?.full_name || 'No Name'}
        </Text>

        <Text className="text-slate-500 text-base text-center mb-6">
          {profile?.email || user?.email}
        </Text>

        <View className="items-center mb-4">
          <View className="bg-white rounded-2xl p-4 shadow-md flex-row items-center" style={{ width: '85%' }}>
            <Ionicons name="time-outline" size={24} color="#0092ce" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <Text className="text-slate-500 text-sm font-semibold">
                Last Clock Out: <Text className="text-slate-800 font-semibold">{lastClockOut || '--:--'}</Text>
              </Text>
            </View>
          </View>
        </View>

        <View className="items-center mb-4">
          <View className="bg-white rounded-2xl p-4 shadow-md flex-row items-center" style={{ width: '85%' }}>
            <Ionicons name="stopwatch-outline" size={24} color="#0092ce" style={{ marginRight: 12 }} />
            <View className="flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-slate-500 text-sm mb-1">Running Time</Text>
                {isOnBreak && (
                  <View className="flex-row items-center bg-orange-100 px-2 py-1 rounded-full">
                    <Ionicons name="pause" size={12} color="#f59e0b" style={{ marginRight: 4 }} />
                    <Text className="text-orange-600 text-xs font-semibold">On Break</Text>
                  </View>
                )}
              </View>
              <Text className="text-slate-800 text-lg font-semibold text-[#0092ce]">{runningTime}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          className="rounded-lg py-4 shadow-md mb-3 flex-row items-center justify-center"
          style={{ backgroundColor: currentAttendance ? '#ef4444' : '#0092ce' }}
          onPress={handleClockToggle}
          activeOpacity={0.8}
        >
          <Ionicons name={currentAttendance ? 'log-out-outline' : 'log-in-outline'} size={20} color="#ffffff" style={{ marginRight: 8 }} />
          <Text className="text-white text-center font-bold text-base">
            {currentAttendance ? 'Clock Out' : 'Clock In'}
          </Text>
        </TouchableOpacity>

        {/* Take a Break Button */}
        <TouchableOpacity
          className="rounded-lg py-4 shadow-md mb-6 flex-row items-center justify-center"
          style={{
            backgroundColor: !currentAttendance ? '#cbd5e1' : isOnBreak ? '#10b981' : '#f59e0b',
            opacity: !currentAttendance ? 0.5 : 1
          }}
          onPress={handleBreakToggle}
          disabled={!currentAttendance}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isOnBreak ? 'play-outline' : 'pause-outline'}
            size={20}
            color="#ffffff"
            style={{ marginRight: 8, flexShrink: 0 }}
          />
          <Text className="text-white font-bold text-base" numberOfLines={1} style={{ flexShrink: 0 }}>
            {isOnBreak ? 'Resume' : 'Take a Break'}
          </Text>
        </TouchableOpacity>

        <Text className="text-xl font-bold text-slate-800 mb-4">Settings</Text>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-white px-5 py-4 mb-2 rounded-lg shadow-sm"
          onPress={() => setShowEditModal(true)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="person-outline" size={20} color="#64748b" />
            <Text className="text-slate-800 text-base ml-3">Edit Profile</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-white px-5 py-4 mb-2 rounded-lg shadow-sm"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="information-circle-outline" size={20} color="#64748b" />
            <Text className="text-slate-800 text-base ml-3">About</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-white px-5 py-4 mb-2 rounded-lg shadow-sm"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="shield-checkmark-outline" size={20} color="#64748b" />
            <Text className="text-slate-800 text-base ml-3">Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#64748b" />
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-row items-center justify-between bg-white px-5 py-4 mb-4 rounded-lg shadow-sm"
          onPress={() => setShowLogoutModal(true)}
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
            <Text className="text-red-600 text-base ml-3">Logout</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ef4444" />
        </TouchableOpacity>
      </ScrollView>

      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        confirmText="Logout"
        cancelText="Cancel"
        confirmStyle="destructive"
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Clock In Successful"
        message="You have been clocked in and can now start accepting jobs."
        buttonText="Okay"
        onClose={() => setShowSuccessModal(false)}
      />

      <Modal
        visible={showImageOptions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowImageOptions(false)}
      >
        <TouchableOpacity
          className="flex-1 bg-black/50 justify-end"
          activeOpacity={1}
          onPress={() => setShowImageOptions(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View className="bg-white rounded-t-3xl p-6">
              <Text className="text-xl font-bold text-slate-800 mb-4">Profile Picture</Text>

              <TouchableOpacity
                className="flex-row items-center py-4 border-b border-slate-200"
                onPress={pickImage}
                activeOpacity={0.7}
              >
                <Ionicons name="image-outline" size={24} color="#0092ce" />
                <Text className="text-slate-800 text-base ml-3">
                  {profile?.avatar_url ? 'Change Picture' : 'Upload Picture'}
                </Text>
              </TouchableOpacity>

              {profile?.avatar_url && (
                <TouchableOpacity
                  className="flex-row items-center py-4 border-b border-slate-200"
                  onPress={deleteProfilePicture}
                  activeOpacity={0.7}
                >
                  <Ionicons name="trash-outline" size={24} color="#ef4444" />
                  <Text className="text-red-600 text-base ml-3">Remove Picture</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                className="flex-row items-center py-4"
                onPress={() => setShowImageOptions(false)}
                activeOpacity={0.7}
              >
                <Ionicons name="close-circle-outline" size={24} color="#64748b" />
                <Text className="text-slate-600 text-base ml-3">Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center px-6">
          <View className="bg-white rounded-2xl p-6">
            <Text className="text-2xl font-bold text-slate-800 mb-6">Edit Profile</Text>

            <Text className="text-slate-700 text-sm font-semibold mb-2">Full Name</Text>
            <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3 mb-4">
              <Ionicons name="person-outline" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-slate-800"
                placeholder="Enter full name"
                placeholderTextColor="#94a3b8"
                value={editForm.full_name}
                onChangeText={(text) => setEditForm({ ...editForm, full_name: text })}
              />
            </View>

            <Text className="text-slate-700 text-sm font-semibold mb-2">Phone Number</Text>
            <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3 mb-6">
              <Ionicons name="call-outline" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-slate-800"
                placeholder="Enter phone number"
                placeholderTextColor="#94a3b8"
                value={editForm.phone_number}
                onChangeText={(text) => setEditForm({ ...editForm, phone_number: text })}
                keyboardType="phone-pad"
              />
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg border border-slate-300"
                onPress={() => setShowEditModal(false)}
                activeOpacity={0.7}
              >
                <Text className="text-slate-700 text-center font-semibold">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 py-3 rounded-lg"
                style={{ backgroundColor: '#0092ce' }}
                onPress={handleUpdateProfile}
                activeOpacity={0.8}
              >
                <Text className="text-white text-center font-semibold">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}
