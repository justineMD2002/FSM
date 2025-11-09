import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { JobCard } from '@/components/JobCard';
import JobDetailsScreen from './JobDetailsScreen';
import MapViewScreen from './MapViewScreen';
import { useNavigationStore } from '@/store';
import { useJobs } from '@/hooks';

type TabType = 'HISTORY' | 'CURRENT';
type DateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('CURRENT');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Separate filter states for HISTORY tab
  const [historyDateFilter, setHistoryDateFilter] = useState<DateFilter>('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');
  const [historyStatusFilters, setHistoryStatusFilters] = useState<string[]>([]);

  // Separate filter states for CURRENT tab
  const [currentDateFilter, setCurrentDateFilter] = useState<DateFilter>('ALL');
  const [currentStartDate, setCurrentStartDate] = useState('');
  const [currentEndDate, setCurrentEndDate] = useState('');
  const [currentStatusFilters, setCurrentStatusFilters] = useState<string[]>([]);

  // Temporary filter states for the modal (not applied until user clicks Apply)
  const [tempDateFilter, setTempDateFilter] = useState<DateFilter>('ALL');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [tempStatusFilters, setTempStatusFilters] = useState<string[]>([]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const { selectedJob, setSelectedJob, showMapView, setShowMapView } = useNavigationStore();

  // Fetch jobs from backend
  const { jobs: historyJobs, loading: historyLoading, error: historyError, refetch: refetchHistory } = useJobs(true);
  const { jobs: currentJobs, loading: currentLoading, error: currentError, refetch: refetchCurrent } = useJobs(false);

  // Get current tab's data and states
  const jobs = activeTab === 'HISTORY' ? historyJobs : currentJobs;
  const loading = activeTab === 'HISTORY' ? historyLoading : currentLoading;
  const error = activeTab === 'HISTORY' ? historyError : currentError;
  const dateFilter = activeTab === 'HISTORY' ? historyDateFilter : currentDateFilter;
  const startDate = activeTab === 'HISTORY' ? historyStartDate : currentStartDate;
  const endDate = activeTab === 'HISTORY' ? historyEndDate : currentEndDate;
  const statusFilters = activeTab === 'HISTORY' ? historyStatusFilters : currentStatusFilters;

  const onRefresh = useCallback(async () => {
    if (activeTab === 'HISTORY') {
      await refetchHistory();
    } else {
      await refetchCurrent();
    }
  }, [activeTab, refetchHistory, refetchCurrent]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
  };

  // Initialize temporary filters with current tab's values when opening modal
  const handleOpenFilterModal = () => {
    setTempDateFilter(dateFilter);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setTempStatusFilters([...statusFilters]);
    setShowFilterModal(true);
  };

  // Apply temporary filters to the current tab
  const handleApplyFilters = () => {
    if (activeTab === 'HISTORY') {
      setHistoryDateFilter(tempDateFilter);
      setHistoryStartDate(tempStartDate);
      setHistoryEndDate(tempEndDate);
      setHistoryStatusFilters([...tempStatusFilters]);
    } else {
      setCurrentDateFilter(tempDateFilter);
      setCurrentStartDate(tempStartDate);
      setCurrentEndDate(tempEndDate);
      setCurrentStatusFilters([...tempStatusFilters]);
    }
    setShowFilterModal(false);
    setShowCustomDatePicker(false);
  };

  // Clear temporary filters
  const handleClearFilters = () => {
    setTempDateFilter('ALL');
    setTempStartDate('');
    setTempEndDate('');
    setTempStatusFilters([]);
    setShowCustomDatePicker(false);
  };

  const isJobInDateRange = (jobDate: string) => {
    if (dateFilter === 'ALL') return true;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const job = new Date(jobDate);
    job.setHours(0, 0, 0, 0);

    switch (dateFilter) {
      case 'TODAY':
        return job.getTime() === today.getTime();

      case 'THIS_WEEK':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return job >= weekStart && job <= weekEnd;

      case 'THIS_MONTH':
        return job.getMonth() === today.getMonth() &&
               job.getFullYear() === today.getFullYear();

      case 'CUSTOM':
        if (!startDate || !endDate) return true;
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        return job >= start && job <= end;

      default:
        return true;
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch =
      job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.customer.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = isJobInDateRange(job.date);

    const matchesStatus = statusFilters.length === 0 || statusFilters.includes(job.status);

    return matchesSearch && matchesDate && matchesStatus;
  });

  const hasActiveFilters = dateFilter !== 'ALL' || (activeTab === 'HISTORY' && statusFilters.length > 0);

  // Show MapViewScreen if map view is active
  if (showMapView) {
    return <MapViewScreen onBack={() => setShowMapView(false)} />;
  }

  if (selectedJob) {
    return <JobDetailsScreen job={selectedJob} onBack={() => setSelectedJob(null)} />;
  }

  return (
    <View className="flex-1 bg-white" style={{ marginTop: -20, paddingTop: 26, borderTopLeftRadius: 15, borderTopRightRadius: 15, zIndex: 2 }}>
      <View className="flex-row bg-white border-b border-slate-200 px-6">
        {(['HISTORY', 'CURRENT'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            className="flex-1 py-4 items-center"
            onPress={() => handleTabChange(tab)}
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

      <View className="px-6 pt-4 bg-white">
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center bg-slate-100 rounded-lg px-4 py-3">
            <Ionicons name="search-outline" size={20} color="#64748b" />
            <TextInput
              className="flex-1 ml-2 text-slate-800"
              placeholder="Search jobs..."
              placeholderTextColor="#94a3b8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity
            onPress={handleOpenFilterModal}
            className="bg-[#0092ce] rounded-lg p-3 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="filter-outline" size={24} color="#ffffff" />
            {hasActiveFilters && (
              <View className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        className="flex-1 bg-[#f5f5f5] mt-4"
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 20 }}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={onRefresh} />}
      >
        {error ? (
          <View className="items-center justify-center py-20">
            <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
            <Text className="text-slate-700 text-base font-semibold mt-4">Error Loading Jobs</Text>
            <Text className="text-slate-500 text-sm mt-2 text-center px-6">{error.message}</Text>
            <TouchableOpacity
              onPress={onRefresh}
              className="bg-[#0092ce] rounded-lg px-6 py-3 mt-4"
              activeOpacity={0.7}
            >
              <Text className="text-white font-semibold">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : loading && jobs.length === 0 ? (
          <View className="items-center justify-center py-20">
            <ActivityIndicator size="large" color="#0092ce" />
            <Text className="text-slate-400 text-base mt-4">Loading jobs...</Text>
          </View>
        ) : filteredJobs.length > 0 ? (
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

      <Modal
        visible={showFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => {
          setShowFilterModal(false);
          setShowCustomDatePicker(false);
        }}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl w-full max-w-md" style={{ maxHeight: '80%' }}>
            <View className="flex-row items-center justify-between p-6 pb-4 border-b border-slate-200">
              <View className="flex-row items-center">
                <Ionicons name="options-outline" size={24} color="#0092ce" />
                <Text className="text-xl font-bold text-slate-800 ml-2">
                  Filter Jobs
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  setShowFilterModal(false);
                  setShowCustomDatePicker(false);
                }}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false}>

            <View className="mb-6">
              <Text className="text-sm font-bold text-slate-700 mb-3">Filter by Date</Text>
              <View className="space-y-2">
                {[
                  { value: 'ALL', label: 'All Dates', icon: 'infinite-outline' },
                  { value: 'TODAY', label: 'Today', icon: 'today-outline' },
                  { value: 'THIS_WEEK', label: 'This Week', icon: 'calendar-outline' },
                  { value: 'THIS_MONTH', label: 'This Month', icon: 'calendar-number-outline' },
                  { value: 'CUSTOM', label: 'Date Range', icon: 'calendar-sharp' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    onPress={() => {
                      if (option.value === 'CUSTOM') {
                        setShowCustomDatePicker(true);
                        setTempDateFilter('CUSTOM');
                      } else {
                        setTempDateFilter(option.value as DateFilter);
                        if (option.value !== 'CUSTOM') {
                          setShowCustomDatePicker(false);
                        }
                      }
                    }}
                    className={`flex-row items-center justify-between p-3 rounded-lg ${
                      tempDateFilter === option.value ? 'bg-[#0092ce]' : 'bg-slate-100'
                    }`}
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <Ionicons
                        name={option.icon as keyof typeof Ionicons.glyphMap}
                        size={18}
                        color={tempDateFilter === option.value ? '#ffffff' : '#64748b'}
                      />
                      <Text
                        className={`ml-3 text-sm font-semibold ${
                          tempDateFilter === option.value ? 'text-white' : 'text-slate-800'
                        }`}
                      >
                        {option.label}
                      </Text>
                    </View>
                    {tempDateFilter === option.value && (
                      <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {activeTab === 'HISTORY' && (
              <View className="mb-4">
                <Text className="text-sm font-bold text-slate-700 mb-3">Filter by Status</Text>
                <View className="space-y-2">
                  {[
                    { value: 'COMPLETED', label: 'Completed', icon: 'checkmark-circle-outline', color: '#22c55e' },
                    { value: 'CANCELLED', label: 'Cancelled', icon: 'close-circle-outline', color: '#ef4444' },
                  ].map((status) => {
                    const isSelected = tempStatusFilters.includes(status.value);
                    return (
                      <TouchableOpacity
                        key={status.value}
                        onPress={() => {
                          if (isSelected) {
                            setTempStatusFilters(tempStatusFilters.filter(s => s !== status.value));
                          } else {
                            setTempStatusFilters([...tempStatusFilters, status.value]);
                          }
                        }}
                        className={`flex-row items-center justify-between p-3 rounded-lg ${
                          isSelected ? 'bg-slate-800' : 'bg-slate-100'
                        }`}
                        activeOpacity={0.7}
                      >
                        <View className="flex-row items-center">
                          <Ionicons
                            name={status.icon as keyof typeof Ionicons.glyphMap}
                            size={18}
                            color={isSelected ? '#ffffff' : status.color}
                          />
                          <Text
                            className={`ml-3 text-sm font-semibold ${
                              isSelected ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            {status.label}
                          </Text>
                        </View>
                        {isSelected && (
                          <Ionicons name="checkmark-circle" size={20} color="#ffffff" />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {showCustomDatePicker && (
              <View className="mt-4 p-4 bg-slate-50 rounded-xl">
                <Text className="text-sm font-semibold text-slate-700 mb-3">
                  Select Date Range
                </Text>

                <View className="mb-3">
                  <Text className="text-xs text-slate-600 mb-1">From</Text>
                  <View className="flex-row items-center bg-white rounded-lg px-3 py-2 border border-slate-200">
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-2 text-slate-800"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={tempStartDate}
                      onChangeText={setTempStartDate}
                    />
                  </View>
                </View>

                <View className="mb-3">
                  <Text className="text-xs text-slate-600 mb-1">To</Text>
                  <View className="flex-row items-center bg-white rounded-lg px-3 py-2 border border-slate-200">
                    <Ionicons name="calendar-outline" size={18} color="#64748b" />
                    <TextInput
                      className="flex-1 ml-2 text-slate-800"
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor="#94a3b8"
                      value={tempEndDate}
                      onChangeText={setTempEndDate}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => {
                    if (tempStartDate && tempEndDate) {
                      setShowCustomDatePicker(false);
                    }
                  }}
                  className={`rounded-lg py-3 items-center ${
                    tempStartDate && tempEndDate ? 'bg-[#0092ce]' : 'bg-slate-300'
                  }`}
                  activeOpacity={0.7}
                  disabled={!tempStartDate || !tempEndDate}
                >
                  <Text className="text-white font-semibold text-base">
                    Apply Date Range
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            </ScrollView>

            <View className="px-6 py-4 border-t border-slate-200">
              <View className="flex-row gap-2">
                {(tempDateFilter !== 'ALL' || tempStatusFilters.length > 0) && (
                  <TouchableOpacity
                    onPress={handleClearFilters}
                    className="flex-1 bg-slate-200 rounded-xl py-3 items-center"
                    activeOpacity={0.7}
                  >
                    <Text className="text-slate-700 font-semibold text-base">
                      Clear All
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  onPress={handleApplyFilters}
                  className={`${(tempDateFilter !== 'ALL' || tempStatusFilters.length > 0) ? 'flex-1' : 'w-full'} bg-[#0092ce] rounded-xl py-3 items-center`}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">
                    Apply Filters
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}