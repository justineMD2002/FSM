import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';

interface JobDetailsScreenProps {
  job: Job;
  onBack: () => void;
}

type TabType = 'Details' | 'Navigate' | 'Service' | 'Complete';

interface TabConfig {
  id: TabType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

const tabs: TabConfig[] = [
  { id: 'Details', icon: 'document-text-outline', label: 'Details' },
  { id: 'Navigate', icon: 'navigate-outline', label: 'Navigate' },
  { id: 'Service', icon: 'build-outline', label: 'Service' },
  { id: 'Complete', icon: 'checkmark-circle-outline', label: 'Complete' },
];

export default function JobDetailsScreen({ job, onBack }: JobDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Details');

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'ONGOING':
        return '#0092ce';
      case 'COMPLETED':
        return '#22c55e';
      case 'CANCELLED':
        return '#ef4444';
    }
  };

  const statusColor = getStatusColor(job.status);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Timeline Tabs */}
      <View className="bg-white px-4 py-6 border-b border-slate-200">
        <View className="flex-row justify-between items-center">
          {tabs.map((tab, index) => (
            <React.Fragment key={tab.id}>
              <TouchableOpacity
                onPress={() => setActiveTab(tab.id)}
                className="items-center"
                style={{ flex: 1 }}
              >
                <View
                  className={`w-12 h-12 rounded-full items-center justify-center mb-2 ${
                    activeTab === tab.id ? 'bg-[#0092ce]' : 'bg-slate-200'
                  }`}
                >
                  <Ionicons
                    name={tab.icon}
                    size={24}
                    color={activeTab === tab.id ? '#fff' : '#64748b'}
                  />
                </View>
                <Text
                  className={`text-xs text-center ${
                    activeTab === tab.id ? 'text-[#0092ce] font-semibold' : 'text-slate-500'
                  }`}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
              {index < tabs.length - 1 && (
                <View className="h-0.5 bg-slate-300 flex-1 mb-6" style={{ marginHorizontal: 4 }} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4 py-4">
        {activeTab === 'Details' && (
          <View>
            {/* Job Details Card */}
            <View className="bg-white rounded-xl shadow-sm mb-4">
              <View className="flex-row">
                <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
                <View className="flex-1 p-4">
                  {/* Header */}
                  <View className="flex-row justify-between items-start mb-4">
                    <View>
                      <Text className="text-xs text-slate-500 mb-1">JOB NUMBER</Text>
                      <Text className="text-xl font-bold text-slate-800">{job.jobCode}</Text>
                    </View>
                    <View className="items-end">
                      <View
                        className="px-2 py-1 rounded-lg mb-1"
                        style={{
                          backgroundColor: '#f1f5f9',
                          minWidth: 70,
                          alignItems: 'center',
                        }}
                      >
                        <Text className="text-xs font-medium text-slate-500">CREATED</Text>
                      </View>

                      <View
                        className="px-2 py-1 rounded-lg"
                        style={{
                          backgroundColor: '#e0f4fb',
                          minWidth: 70,
                          alignItems: 'center',
                        }}
                      >
                        <Text className="text-xs font-semibold" style={{ color: '#0092ce' }}>
                          LOW
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Subject */}
                  <View className="mb-4">
                    <Text className="text-xs text-slate-500 mb-1">SUBJECT</Text>
                    <Text className="text-base text-slate-800">{job.jobName}</Text>
                  </View>

                  {/* Details Section */}
                  <View>
                    <Text className="text-sm font-semibold text-slate-700 mb-3">Details</Text>

                    {/* Address */}
                    <View className="flex-row mb-3">
                      <Ionicons name="location-outline" size={18} color="#0092ce" />
                      <View className="ml-2 flex-1">
                        <Text className="text-xs text-slate-500 mb-0.5 font-semibold">Address</Text>
                        <Text className="text-sm text-slate-700">{job.address}</Text>
                      </View>
                    </View>

                    {/* Schedule */}
                    <View className="flex-row mb-3">
                      <Ionicons name="calendar-outline" size={18} color="#0092ce" />
                      <View className="ml-2 flex-1">
                        <Text className="text-xs text-slate-500 mb-0.5 font-semibold">Schedule</Text>
                        <Text className="text-sm text-slate-700">
                          {job.date} | {job.time}
                        </Text>
                      </View>
                    </View>

                    {/* Customer */}
                    <View className="flex-row justify-between items-start mb-3">
                      <View className="flex-row flex-1">
                        <Ionicons name="business-outline" size={18} color="#0092ce" />
                        <View className="ml-2 flex-1">
                          <Text className="text-xs text-slate-500 mb-0.5 font-semibold">Customer</Text>
                          <Text className="text-sm text-slate-700">{job.customer}</Text>
                          <Text className="text-xs text-slate-600 mt-0.5">ID: CUST-00123</Text>

                          <View className="mt-3 ml-5">
                            <Text className="text-xs text-slate-500 font-semibold ml-1">Contact Person</Text>
                            <Text className="text-sm text-slate-700">{job.providerName}</Text>
                            <Text className="text-xs text-slate-600 mt-0.5">ID: CP-12345</Text>

                            <View className="flex-row items-center mt-1">
                              <Ionicons name="phone-portrait-outline" size={14} color="#64748b" />
                              <Text className="text-xs text-slate-600 ml-2">0915475656</Text>
                            </View>

                            <View className="flex-row items-center mt-1">
                              <Ionicons name="call-outline" size={14} color="#64748b" />
                              <Text className="text-xs text-slate-600 ml-2">(123) 456-7890</Text>
                            </View>
                          </View>
                        </View>
                      </View>

                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="p-1 rounded-full"
                        style={{ backgroundColor: '#e0f4fb' }}
                        onPress={() => console.log('Call customer pressed')}
                      >
                        <Ionicons name="call-sharp" size={18} color="#0092ce" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Equipments Card */}
            <View className="bg-white rounded-xl shadow-sm mb-4">
              <View className="flex-row">
                <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
                <View className="flex-1 p-4">
                  <View className="flex-row justify-between items-start mb-4">
                    <View className="flex-row items-center flex-1">
                      <Ionicons name="settings-sharp" size={20} color="#0092ce" />
                      <Text className="text-base font-semibold text-slate-800 ml-2">
                        Customer Equipment
                      </Text>
                    </View>
                    <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                      <Text className="text-xs font-medium text-emerald-700">Active</Text>
                    </View>
                  </View>

                  <View className="space-y-2">
                    <View className="flex-row items-center">
                      <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                      <Text className="text-xs text-slate-500 ml-2">Model: </Text>
                      <Text className="text-sm text-slate-700">CS-T43KB4H52</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      <Ionicons name="barcode-outline" size={16} color="#64748b" />
                      <Text className="text-xs text-slate-500 ml-2">SN: </Text>
                      <Text className="text-sm text-slate-700">2408304977</Text>
                    </View>

                    <View className="flex-row items-center mt-2">
                      <Ionicons name="document-text-outline" size={16} color="#64748b" />
                      <Text className="text-sm text-slate-700 ml-2">Door Exit</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Technicians Section */}
            <Text className="text-base font-semibold text-slate-800 mb-3 px-1">Technicians</Text>

            {/* Technician Card 1 */}
            <View className="bg-white rounded-xl shadow-sm mb-3">
              <View className="flex-row">
                <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
                <View className="flex-1 p-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center">
                      <Text className="text-white font-bold text-lg">JD</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-800">John Doe</Text>
                      <Text className="text-xs text-slate-500">ID: TEC-001</Text>
                      <View className="flex-row items-center mt-1">
                        <View style={{ backgroundColor: '#e0f4fb' }} className="px-2 py-1 rounded-lg mr-3">
                          <Text className="text-xs font-medium text-[#0092ce]">Pending</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                          <Text className="text-xs font-medium text-emerald-600">Online</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Technician Card 2 */}
            <View className="bg-white rounded-xl shadow-sm mb-3">
              <View className="flex-row">
                <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
                <View className="flex-1 p-4">
                  <View className="flex-row items-center">
                    <View className="w-12 h-12 rounded-full bg-purple-500 items-center justify-center">
                      <Text className="text-white font-bold text-lg">AS</Text>
                    </View>
                    <View className="ml-3 flex-1">
                      <Text className="text-base font-semibold text-slate-800">Alice Smith</Text>
                      <Text className="text-xs text-slate-500">ID: TEC-002</Text>
                      <View className="flex-row items-center mt-1">
                        <View style={{ backgroundColor: '#e0f4fb' }} className="px-2 py-1 rounded-lg mr-3">
                          <Text className="text-xs font-medium text-[#0092ce]">Pending</Text>
                        </View>
                        <View className="flex-row items-center">
                          <View className="w-2 h-2 rounded-full bg-emerald-500 mr-1" />
                          <Text className="text-xs font-medium text-emerald-600">Online</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Start Job Button */}
            <TouchableOpacity
              className="bg-[#0092ce] rounded-xl py-4 items-center justify-center flex-row mt-2 mb-6"
              activeOpacity={0.8}
            >
              <Ionicons name="play-circle-outline" size={24} color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">Start Job</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'Navigate' && (
          <View className="bg-white rounded-xl p-6 items-center justify-center" style={{ minHeight: 200 }}>
            <Ionicons name="navigate-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-500 mt-4 text-center">Navigation view coming soon</Text>
          </View>
        )}

        {activeTab === 'Service' && (
          <View className="bg-white rounded-xl p-6 items-center justify-center" style={{ minHeight: 200 }}>
            <Ionicons name="build-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-500 mt-4 text-center">Service view coming soon</Text>
          </View>
        )}

        {activeTab === 'Complete' && (
          <View className="bg-white rounded-xl p-6 items-center justify-center" style={{ minHeight: 200 }}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-500 mt-4 text-center">Complete view coming soon</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
