import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, TextInput, RefreshControl, Linking, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCustomers } from '@/hooks';
import { Customer } from '@/types';
import { useAuthStore } from '@/store';

export default function CustomersScreen() {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch customers connected to the logged-in technician (filtered by user ID)
  const { customers, loading, error, refetch } = useCustomers(user?.id);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleWhatsApp = (phone: string, name: string) => {
    // Remove spaces and special characters, keep only numbers and +
    const phoneNumber = phone.replace(/[^\d+]/g, '').replace('+', '');
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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Client-side filtering - no API calls
  const filteredCustomers = useMemo(() => {
    if (!searchQuery.trim()) {
      return customers;
    }

    const query = searchQuery.toLowerCase();
    return customers.filter((customer) => {
      return (
        customer.customer_name.toLowerCase().includes(query) ||
        customer.customer_code.toLowerCase().includes(query) ||
        customer.email.toLowerCase().includes(query) ||
        customer.phone_number.toLowerCase().includes(query) ||
        customer.customer_address.toLowerCase().includes(query)
      );
    });
  }, [customers, searchQuery]);

  const renderCustomerCard = (customer: Customer) => (
    <View key={customer.id} className="bg-white rounded-2xl p-4 mb-3 shadow-sm">
      {/* Header with Avatar */}
      <View className="flex-row items-start mb-3">
        {/* Avatar */}
        <View
          className="w-16 h-16 rounded-full items-center justify-center"
          style={{ backgroundColor: '#0092ce' }}
        >
          <Text className="text-white text-xl font-bold">
            {getInitials(customer.customer_name)}
          </Text>
        </View>

        {/* Name and Code */}
        <View className="flex-1 ml-3">
          <Text className="text-lg font-bold text-slate-800">{customer.customer_name}</Text>
          <Text className="text-sm text-slate-600 mt-0.5">Code: {customer.customer_code}</Text>
        </View>
      </View>

      {/* Contact Info */}
      <View className="border-t border-slate-100 pt-3 mb-3">
        {/* Address */}
        <View className="flex-row items-start mb-2">
          <Ionicons name="location-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2 flex-1" numberOfLines={2}>
            {customer.customer_address}
          </Text>
        </View>

        {/* Email */}
        <View className="flex-row items-center mb-2">
          <Ionicons name="mail-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2 flex-1" numberOfLines={1}>
            {customer.email}
          </Text>
        </View>

        {/* Phone */}
        <View className="flex-row items-center">
          <Ionicons name="call-outline" size={16} color="#64748b" />
          <Text className="text-sm text-slate-600 ml-2">{customer.phone_number}</Text>
        </View>
      </View>

      {/* WhatsApp Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center py-3 rounded-lg"
        style={{ backgroundColor: '#25D366' }}
        onPress={() => handleWhatsApp(customer.phone_number, customer.customer_name)}
        activeOpacity={0.8}
      >
        <Ionicons name="logo-whatsapp" size={20} color="#ffffff" />
        <Text className="text-white font-semibold ml-2">WhatsApp</Text>
      </TouchableOpacity>
    </View>
  );

  // Error state
  if (error && !loading && customers.length === 0) {
    return (
      <View className="flex-1 bg-white" style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}>
        <View className="flex-1 items-center justify-center px-6">
          <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
          <Text className="text-slate-800 text-xl font-bold mt-4 text-center">Error Loading Customers</Text>
          <Text className="text-slate-600 text-base mt-2 text-center">{error.message}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            className="mt-6 bg-[#0092ce] rounded-xl py-3 px-6"
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">Try Again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

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
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View className="px-6 pt-3 pb-3 bg-white">
        <View className="flex-row items-center bg-slate-50 rounded-lg p-3">
          <Ionicons name="people-outline" size={20} color="#0092ce" />
          <Text className="text-sm text-slate-600 ml-2">
            {loading ? 'Loading...' : `${filteredCustomers.length} Customer${filteredCustomers.length !== 1 ? 's' : ''}`}
            {!loading && searchQuery && customers.length !== filteredCustomers.length && (
              <Text className="text-slate-500"> of {customers.length}</Text>
            )}
          </Text>
          {error && customers.length > 0 && (
            <View className="ml-auto flex-row items-center">
              <Ionicons name="warning-outline" size={16} color="#f59e0b" />
              <Text className="text-xs text-amber-600 ml-1">Partial results</Text>
            </View>
          )}
        </View>
      </View>

      {/* Customer List */}
      <FlatList
        data={filteredCustomers}
        renderItem={({ item: customer }) => renderCustomerCard(customer)}
        keyExtractor={(customer) => customer.id}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 5, paddingBottom: 20 }}
        className="flex-1 bg-[#f5f5f5] pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
        bounces={true}
        keyboardShouldPersistTaps="handled"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
        ListEmptyComponent={() => (
          loading && !refreshing ? (
            <View className="items-center justify-center py-20">
              <ActivityIndicator size="large" color="#0092ce" />
              <Text className="text-slate-500 text-base mt-4">Loading customers...</Text>
            </View>
          ) : (
            <View className="items-center justify-center py-20">
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text className="text-slate-400 text-base mt-4">
                {searchQuery ? 'No customers found' : 'No customers available'}
              </Text>
              {!searchQuery && (
                <Text className="text-slate-400 text-sm mt-2 text-center px-6">
                  Customers will appear here once you're assigned to jobs
                </Text>
              )}
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
                <Text className="text-[#0092ce] text-sm mt-4">Tap to refresh</Text>
              </TouchableOpacity>
            </View>
          )
        )}
      />
    </View>
  );
}
