import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

type TabType = 'HISTORY' | 'CURRENT';

interface Job {
  id: string;
  jobName: string;
  jobCode: string;
  date: string;
  time: string;
  buildingName: string;
  address: string;
  notes: string;
  providerName: string;
  status: 'COMPLETED' | 'CANCELLED';
}

// Mock data for demonstration
const mockHistoryJobs: Job[] = [
  {
    id: '1',
    jobName: 'HVAC Maintenance',
    jobCode: 'JOB-001',
    date: '2025-10-28',
    time: '09:00 AM',
    buildingName: 'Building A',
    address: '123 Main St, City, State 12345',
    notes: 'Regular maintenance check',
    providerName: 'John Doe',
    status: 'COMPLETED'
  },
  {
    id: '2',
    jobName: 'Electrical Repair',
    jobCode: 'JOB-002',
    date: '2025-10-27',
    time: '02:00 PM',
    buildingName: 'Building B',
    address: '456 Oak Ave, City, State 12345',
    notes: 'Fix lighting issue in lobby',
    providerName: 'Jane Smith',
    status: 'CANCELLED'
  },
  {
    id: '3',
    jobName: 'Plumbing Inspection',
    jobCode: 'JOB-003',
    date: '2025-10-26',
    time: '11:00 AM',
    buildingName: 'Building C',
    address: '789 Pine Rd, City, State 12345',
    notes: 'Quarterly inspection',
    providerName: 'Mike Johnson',
    status: 'COMPLETED'
  }
];

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('HISTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  // Filter jobs based on search query
  const filteredJobs = mockHistoryJobs.filter(job =>
    job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.buildingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <View
      className="flex-1 bg-white"
      style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}
    >
      {/* Divider between header and tabs */}
      <View className="border-t border-slate-200" />

      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-200 px-6">
        <TouchableOpacity
          className="flex-1 py-4 items-center"
          onPress={() => setActiveTab('HISTORY')}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === 'HISTORY' ? 'text-[#0092ce]' : 'text-slate-500'
            }`}
          >
            History
          </Text>
          {activeTab === 'HISTORY' && (
            <View className="absolute bottom-0 w-full h-1" style={{ backgroundColor: '#0092ce' }} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 py-4 items-center"
          onPress={() => setActiveTab('CURRENT')}
          activeOpacity={0.7}
        >
          <Text
            className={`text-base font-semibold ${
              activeTab === 'CURRENT' ? 'text-[#0092ce]' : 'text-slate-500'
            }`}
          >
            Current Jobs
          </Text>
          {activeTab === 'CURRENT' && (
            <View className="absolute bottom-0 w-full h-1" style={{ backgroundColor: '#0092ce' }} />
          )}
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="px-6 pt-4 pb-2 bg-white">
        <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3">
          <Ionicons name="search-outline" size={20} color="#64748b" />
          <TextInput
            className="flex-1 ml-2 text-slate-800"
            placeholder="Search jobs..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Tab Content */}
      <ScrollView
        className="flex-1 px-6 pb-20"
        style={{ backgroundColor: '#f5f5f5' }}
        refreshControl={
          activeTab === 'CURRENT' ? (
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          ) : undefined
        }
      >
        {activeTab === 'HISTORY' ? (
          // History Tab
          <View className="mt-4">
            {filteredJobs.length > 0 ? (
              filteredJobs.map((job) => (
                <View key={job.id} className="mb-4">
                  <View className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Left Color Indicator */}
                    <View className="flex-row">
                      <View
                        className="w-1"
                        style={{
                          backgroundColor: job.status === 'COMPLETED' ? '#22c55e' : '#ef4444'
                        }}
                      />
                      <View className="flex-1 p-4">
                        {/* Header with Document Icon and Job Info */}
                        <View className="flex-row mb-3">
                          <Ionicons name="document-text-outline" size={24} color="#0092ce" />
                          <View className="flex-1 ml-3">
                            <View className="flex-row justify-between items-start">
                              <View className="flex-1">
                                <Text className="text-lg font-bold text-slate-800">{job.jobName}</Text>
                                <Text className="text-sm text-slate-500 mt-1">{job.jobCode}</Text>
                              </View>
                              <View
                                className="px-3 py-1 rounded-full"
                                style={{
                                  backgroundColor: job.status === 'COMPLETED' ? '#dcfce7' : '#fee2e2'
                                }}
                              >
                                <Text
                                  className="text-xs font-semibold"
                                  style={{
                                    color: job.status === 'COMPLETED' ? '#16a34a' : '#dc2626'
                                  }}
                                >
                                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                </Text>
                              </View>
                            </View>
                          </View>
                        </View>

                        {/* Job Details */}
                        <View className="space-y-2">
                          <View className="flex-row items-center">
                            <Ionicons name="calendar-outline" size={16} color="#64748b" />
                            <Text className="text-sm text-slate-600 ml-2">
                              {job.date} at {job.time}
                            </Text>
                          </View>

                          <View className="flex-row items-center mt-2">
                            <Ionicons name="business-outline" size={16} color="#64748b" />
                            <Text className="text-sm text-slate-600 ml-2">{job.buildingName}</Text>
                          </View>

                          <View className="flex-row items-start mt-2">
                            <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                            <Text className="text-sm text-slate-600 ml-2 flex-1">{job.address}</Text>
                          </View>

                          {job.notes && (
                            <View className="flex-row items-start mt-2">
                              <Ionicons name="clipboard-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                              <Text className="text-sm text-slate-600 ml-2 flex-1">{job.notes}</Text>
                            </View>
                          )}

                          <View className="flex-row items-center mt-2">
                            <Ionicons name="person-outline" size={16} color="#64748b" />
                            <Text className="text-sm text-slate-600 ml-2">{job.providerName}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="items-center justify-center py-20">
                <Ionicons name="search-outline" size={64} color="#cbd5e1" />
                <Text className="text-slate-400 text-base mt-4">No jobs found</Text>
              </View>
            )}
          </View>
        ) : (
          // Current Jobs Tab
          <View className="items-center justify-center py-20">
            <Ionicons name="briefcase-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-600 text-base font-semibold mt-4">No current jobs found</Text>
            <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
              <Text className="text-[#0092ce] text-sm mt-2">Tap to refresh</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
