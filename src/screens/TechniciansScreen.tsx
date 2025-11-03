import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockTechnicians } from '@/data/TechniciansMockData';
import { Technician } from '@/types';

export default function TechniciansScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'AVAILABLE' | 'ON_JOB' | 'OFFLINE'>('ALL');

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleWhatsApp = (phone: string, name: string) => {
    // Remove + and format for WhatsApp
    const phoneNumber = phone.replace('+', '');
    const message = encodeURIComponent(`Hi ${name}, I would like to discuss a job assignment with you.`);
    const whatsappUrl = `whatsapp://send?phone=${phoneNumber}&text=${message}`;

    Linking.canOpenURL(whatsappUrl)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(whatsappUrl);
        } else {
          // Fallback to web WhatsApp
          const webUrl = `https://wa.me/${phoneNumber}?text=${message}`;
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => console.error('Error opening WhatsApp:', err));
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  // Filter technicians
  const filteredTechnicians = mockTechnicians.filter((tech) => {
    const matchesSearch =
      tech.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tech.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = filterStatus === 'ALL' || tech.status === filterStatus;

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: Technician['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return '#10b981';
      case 'ON_JOB':
        return '#f59e0b';
      case 'OFFLINE':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  const getStatusText = (status: Technician['status']) => {
    switch (status) {
      case 'AVAILABLE':
        return 'Available';
      case 'ON_JOB':
        return 'On Job';
      case 'OFFLINE':
        return 'Offline';
      default:
        return 'Unknown';
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

  const renderTechnicianCard = (technician: Technician) => (
    <View key={technician.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      {/* Header with Avatar and Status */}
      <View className="flex-row items-start mb-3">
        {/* Avatar */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: '#0092ce' }}
        >
          <Text className="text-white text-xl font-bold">{getInitials(technician.name)}</Text>
        </View>

        {/* Name and Specialization */}
        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-slate-800">{technician.name}</Text>
          <Text className="text-sm text-slate-600 mt-0.5">{technician.specialization}</Text>

          {/* Status Badge */}
          <View className="flex-row items-center mt-2">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: getStatusColor(technician.status) }}
            />
            <Text
              className="text-xs font-semibold"
              style={{ color: getStatusColor(technician.status) }}
            >
              {getStatusText(technician.status)}
            </Text>
          </View>
        </View>

        {/* Rating */}
        <View className="items-center">
          <View className="flex-row items-center">
            <Ionicons name="star" size={16} color="#fbbf24" />
            <Text className="text-sm font-bold text-slate-800 ml-1">{technician.rating}</Text>
          </View>
          <Text className="text-xs text-slate-500 mt-0.5">{technician.completedJobs} jobs</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="border-t border-slate-100 pt-3 mb-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="mail-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2 flex-1" numberOfLines={1}>
            {technician.email}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2">{technician.phone}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View className="flex-row gap-2">
        {/* WhatsApp Button */}
        <TouchableOpacity
          className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
          style={{ backgroundColor: '#25D366' }}
          onPress={() => handleWhatsApp(technician.phone, technician.name)}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
          <Text className="text-white font-semibold ml-2">WhatsApp</Text>
        </TouchableOpacity>

        {/* Call Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 px-4 rounded-lg border border-slate-300"
          onPress={() => handleCall(technician.phone)}
          activeOpacity={0.7}
        >
          <Ionicons name="call" size={20} color="#0092ce" />
        </TouchableOpacity>

        {/* Email Button */}
        <TouchableOpacity
          className="flex-row items-center justify-center py-3 px-4 rounded-lg border border-slate-300"
          onPress={() => handleEmail(technician.email)}
          activeOpacity={0.7}
        >
          <Ionicons name="mail" size={20} color="#0092ce" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-white" style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}>
      {/* Search and Filter */}
      <View className="px-6 pt-4 bg-white">
        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3 mb-3">
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-slate-800"
            placeholder="Search technicians..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Status Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-3"
        >
          {(['ALL', 'AVAILABLE', 'ON_JOB', 'OFFLINE'] as const).map((status) => (
            <TouchableOpacity
              key={status}
              className="px-4 py-2 rounded-full mr-2"
              style={{
                backgroundColor: filterStatus === status ? '#0092ce' : '#f1f5f9',
              }}
              onPress={() => setFilterStatus(status)}
              activeOpacity={0.7}
            >
              <Text
                className="text-sm font-semibold"
                style={{
                  color: filterStatus === status ? '#ffffff' : '#64748b',
                }}
              >
                {status === 'ALL' ? 'All' : status === 'ON_JOB' ? 'On Job' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Stats Bar */}
      <View className="px-6 pb-3 bg-white">
        <View className="flex-row items-center justify-between bg-slate-50 rounded-lg p-3">
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={20} color="#0092ce" />
            <Text className="text-sm text-slate-600 ml-2">
              {filteredTechnicians.length} Technician{filteredTechnicians.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-2 h-2 rounded-full mr-2 bg-green-500" />
            <Text className="text-sm text-slate-600">
              {mockTechnicians.filter(t => t.status === 'AVAILABLE').length} Available
            </Text>
          </View>
        </View>
      </View>

      {/* Technician List */}
      <ScrollView
        className="flex-1 bg-[#f5f5f5] pt-4"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredTechnicians.length > 0 ? (
          filteredTechnicians.map((technician) => renderTechnicianCard(technician))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-400 text-base mt-4">
              {searchQuery ? 'No technicians found' : 'No technicians available'}
            </Text>
            <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
              <Text className="text-[#0092ce] text-sm mt-2">Tap to refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
