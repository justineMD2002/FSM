import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, RefreshControl, Linking, ActivityIndicator, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useCustomers } from '@/hooks';
import { Customer } from '@/types';
import { useAuthStore } from '@/store';

const INITIAL_CUSTOMERS_TO_DISPLAY = 5;
const CUSTOMERS_INCREMENT = 5;

export default function CustomersScreen() {
  const user = useAuthStore((state) => state.user);
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination state
  const [displayedCustomerCount, setDisplayedCustomerCount] = useState(INITIAL_CUSTOMERS_TO_DISPLAY);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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

  // Reset pagination when search changes
  useEffect(() => {
    setDisplayedCustomerCount(INITIAL_CUSTOMERS_TO_DISPLAY);
  }, [searchQuery]);

  // Handle scroll to load more customers
  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;

    // Check if user is within 200px of the bottom
    const isNearBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 200;

    if (isNearBottom && !isLoadingMore && displayedCustomerCount < filteredCustomers.length) {
      setIsLoadingMore(true);

      // Simulate a small delay for smooth UX
      setTimeout(() => {
        setDisplayedCustomerCount(prev => Math.min(prev + CUSTOMERS_INCREMENT, filteredCustomers.length));
        setIsLoadingMore(false);
      }, 300);
    }
  };

  const renderCustomerCard = (customer: Customer) => {
    // Extract address notes from customer_location -> customer_address_details
    const addressNotes = customer.customer_location
      ?.flatMap(loc => loc.customer_address_details || [])
      .map(detail => detail.address_notes)
      .filter(note => note && note.trim() !== '') || [];

    return (
      <View key={customer.id} className="bg-white rounded-xl p-3 mb-2 shadow-sm">
        {/* Header with Avatar */}
        <View className="flex-row items-center mb-2">
          {/* Avatar */}
          <View
            className="w-12 h-12 rounded-full items-center justify-center"
            style={{ backgroundColor: '#0092ce' }}
          >
            <Text className="text-white text-base font-bold">
              {getInitials(customer.customer_name)}
            </Text>
          </View>

          {/* Name */}
          <View className="flex-1 ml-2">
            <Text className="text-base font-bold text-slate-800" numberOfLines={1} ellipsizeMode="tail">
              {customer.customer_name}
            </Text>
          </View>
        </View>

        {/* Contact Info */}
        <View className="border-t border-slate-100 pt-2 mb-2">
          {/* Email - only show if exists */}
          {customer.email && customer.email.trim() !== '' && (
            <View className="flex-row items-center mb-1.5">
              <Ionicons name="mail-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-600 ml-2 flex-1" numberOfLines={1} ellipsizeMode="tail">
                {customer.email}
              </Text>
            </View>
          )}

          {/* Phone - only show if exists */}
          {customer.phone_number && customer.phone_number.trim() !== '' && (
            <View className="flex-row items-center mb-1.5">
              <Ionicons name="call-outline" size={14} color="#64748b" />
              <Text className="text-xs text-slate-600 ml-2">{customer.phone_number}</Text>
            </View>
          )}

          {/* Address - only show if exists */}
          {customer.customer_address && customer.customer_address.trim() !== '' && (
            <View className="flex-row items-start mb-1.5">
              <Ionicons name="location-outline" size={14} color="#64748b" style={{ marginTop: 1 }} />
              <Text className="text-xs text-slate-600 ml-2 flex-1" numberOfLines={1} ellipsizeMode="tail">
                {customer.customer_address}
              </Text>
            </View>
          )}

          {/* Address Notes - only show if exists */}
          {addressNotes.length > 0 && (
            <View className="flex-row items-start">
              <Ionicons name="document-text-outline" size={14} color="#64748b" style={{ marginTop: 1 }} />
              <View className="flex-1 ml-2">
                {addressNotes.slice(0, 1).map((note, index) => (
                  <Text key={index} className="text-xs text-slate-600" numberOfLines={1} ellipsizeMode="tail">
                    {note}
                  </Text>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* WhatsApp Button - only show if phone exists */}
        {customer.phone_number && customer.phone_number.trim() !== '' && (
          <TouchableOpacity
            className="flex-row items-center justify-center py-2 rounded-lg"
            style={{ backgroundColor: '#25D366' }}
            onPress={() => handleWhatsApp(customer.phone_number, customer.customer_name)}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-whatsapp" size={16} color="#ffffff" />
            <Text className="text-white font-semibold text-sm ml-1.5">WhatsApp</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

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
      <View className="px-6 pt-4 pb-4 bg-white">
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

      {/* Customer List */}
      <ScrollView
        className="flex-1 bg-[#f5f5f5] pt-4"
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        bounces={true}
        onScroll={handleScroll}
      >
        {loading && !refreshing ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0092ce" />
            <Text className="text-slate-500 text-base mt-4">Loading customers...</Text>
          </View>
        ) : filteredCustomers.length > 0 ? (
          <>
            {filteredCustomers.slice(0, displayedCustomerCount).map((customer) => renderCustomerCard(customer))}
            {isLoadingMore && (
              <View className="items-center justify-center py-4">
                <ActivityIndicator size="small" color="#0092ce" />
                <Text className="text-slate-400 text-sm mt-2">Loading more customers...</Text>
              </View>
            )}
          </>
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
        )}
      </ScrollView>
    </View>
  );
}
