import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { mockHistoryJobs, mockCurrentJobs } from '@/data/JobsMockData';
import { JobCard } from '@/components/JobCard';
import JobDetailsScreen from './JobDetailsScreen';
import { useNavigation } from '@/contexts/NavigationContext';

type TabType = 'HISTORY' | 'CURRENT';

// 🔹 Main Screen
export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('HISTORY');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const { selectedJob, setSelectedJob } = useNavigation();

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const jobs = activeTab === 'HISTORY' ? mockHistoryJobs : mockCurrentJobs;

  const filteredJobs = jobs.filter(job =>
    job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.buildingName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show JobDetailsScreen if a job is selected
  if (selectedJob) {
    return <JobDetailsScreen job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <View className="flex-1 bg-white" style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}>
      {/* Tabs */}
      <View className="flex-row bg-white border-b border-slate-200 px-6">
        {(['HISTORY', 'CURRENT'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-4 items-center"
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.7}
          >
            <Text
              className={`text-base font-semibold ${
                activeTab === tab ? 'text-[#0092ce]' : 'text-slate-500'
              }`}
            >
              {tab === 'HISTORY' ? 'History' : 'Current Jobs'}
            </Text>
            {activeTab === tab && <View className="absolute bottom-0 w-full h-1 bg-[#0092ce]" />}
          </TouchableOpacity>
        ))}
      </View>

      {/* Search */}
      <View className="px-6 pt-4 bg-white">
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

      {/* Job List */}
      <ScrollView
        className="flex-1 bg-[#f5f5f5] mt-4"
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {filteredJobs.length > 0 ? (
          filteredJobs.map((job) => <JobCard key={job.id} job={job} onPress={() => setSelectedJob(job)} />)
        ) : (
          <View className="items-center justify-center py-20">
            <Ionicons
              name={activeTab === 'HISTORY' ? 'search-outline' : 'briefcase-outline'}
              size={64}
              color="#cbd5e1"
            />
            <Text className="text-slate-400 text-base mt-4">
              {activeTab === 'HISTORY' ? 'No jobs found' : 'No current jobs found'}
            </Text>
            {activeTab === 'CURRENT' && (
              <TouchableOpacity onPress={onRefresh} activeOpacity={0.7}>
                <Text className="text-[#0092ce] text-sm mt-2">Tap to refresh</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </View>
  );
}