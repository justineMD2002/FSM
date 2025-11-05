import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockTechnicians } from '@/data/TechniciansMockData';
import { Technician } from '@/types';

export default function CustomersScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const handleWhatsApp = (phone: string, name: string) => {
    // Remove + and format for WhatsApp
    const phoneNumber = phone.replace('+', '');
    const message = encodeURIComponent(`Hi ${name}, I would like to get in touch regarding your service.`);
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

  // Filter customers
  const filteredCustomers = mockTechnicians.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.specialization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const renderCustomerCard = (customer: Technician) => (
    <View key={customer.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      {/* Header with Avatar */}
      <View className="flex-row items-start mb-3">
        {/* Avatar */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: '#0092ce' }}
        >
          <Text className="text-white text-xl font-bold">{getInitials(customer.name)}</Text>
        </View>

        {/* Name and Company */}
        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-slate-800">{customer.name}</Text>
          <Text className="text-sm text-slate-600 mt-0.5">{customer.specialization}</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="border-t border-slate-100 pt-3 mb-3">
        <View className="flex-row items-center mb-2">
          <Ionicons name="mail-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2 flex-1" numberOfLines={1}>
            {customer.email}
          </Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2">{customer.phone}</Text>
        </View>
      </View>

      {/* WhatsApp Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center py-3 rounded-lg"
        style={{ backgroundColor: '#25D366' }}
        onPress={() => handleWhatsApp(customer.phone, customer.name)}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-white" style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}>
      {/* Search */}
      <View className="px-6 pt-4 bg-white">
        {/* Search Bar */}
        <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-slate-800"
            placeholder="Search customers..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Stats Bar */}
      <View className="px-6 pt-3 pb-3 bg-white">
        <View className="flex-row items-center bg-slate-50 rounded-lg p-3">
          <Ionicons name="people-outline" size={20} color="#0092ce" />
          <Text className="text-sm text-slate-600 ml-2">
            {filteredCustomers.length} Customer{filteredCustomers.length !== 1 ? 's' : ''}
          </Text>
        </View>
      </View>

      {/* Customer List */}
      <ScrollView
        className="flex-1 bg-[#f5f5f5] pt-4"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredCustomers.length > 0 ? (
          filteredCustomers.map((customer) => renderCustomerCard(customer))
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons name="people-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-400 text-base mt-4">
              {searchQuery ? 'No customers found' : 'No customers available'}
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
