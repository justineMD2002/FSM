import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, Modal, Dimensions, Pressable, ActivityIndicator } from 'react-native';
import { ScrollView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import JobDetailsScreen from './JobDetailsScreen';
import MultipleJobsMapView, { ROUTE_COLORS } from '@/components/MultipleJobsMapView';
import { useJobs } from '@/hooks';

type DateFilter = 'ALL' | 'TODAY' | 'THIS_WEEK' | 'THIS_MONTH' | 'CUSTOM';

interface MapViewScreenProps {
  onBack: () => void;
}

const { height } = Dimensions.get('window');

export default function MapViewScreen({ onBack }: MapViewScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [dateFilter, setDateFilter] = useState<DateFilter>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Temporary filter states for the modal (not applied until user clicks Apply)
  const [tempDateFilter, setTempDateFilter] = useState<DateFilter>('ALL');
  const [tempStartDate, setTempStartDate] = useState('');
  const [tempEndDate, setTempEndDate] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [currentJobIndex, setCurrentJobIndex] = useState(0);
  const scrollViewRef = React.useRef<ScrollView>(null);

  // Fetch current jobs from database
  const { jobs: currentJobs, loading, error, refetch } = useJobs(false);

  // Only show pending/current jobs in map view - memoized to prevent map refresh
  const allJobs = useMemo(() =>
    currentJobs.filter(job =>
      job.status === 'CREATED' ||
      job.status === 'SCHEDULED' ||
      job.status === 'RESCHEDULED' ||
      job.status === 'IN_PROGRESS'
    ),
    [currentJobs]
  );

  // Date filtering helper
  const isJobInDateRange = useCallback((jobDate: string) => {
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
  }, [dateFilter, startDate, endDate]);

  const filteredJobs = useMemo(() =>
    allJobs.filter(job => {
      const matchesSearch =
        job.jobName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.jobCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.customer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesDate = isJobInDateRange(job.date);

      return matchesSearch && matchesDate;
    }),
    [allJobs, searchQuery, isJobInDateRange]
  );

  // Add color indices to jobs for consistent coloring
  const jobsWithColors = useMemo(() =>
    filteredJobs.map((job, index) => ({
      ...job,
      colorIndex: index
    })),
    [filteredJobs]
  );

  // Initialize temporary filters with current values when opening modal
  const handleOpenFilterModal = () => {
    setTempDateFilter(dateFilter);
    setTempStartDate(startDate);
    setTempEndDate(endDate);
    setShowFilterModal(true);
  };

  // Apply temporary filters
  const handleApplyFilters = () => {
    setDateFilter(tempDateFilter);
    setStartDate(tempStartDate);
    setEndDate(tempEndDate);
    setShowFilterModal(false);
    setShowCustomDatePicker(false);
  };

  // Clear temporary filters
  const handleClearFilters = () => {
    setTempDateFilter('ALL');
    setTempStartDate('');
    setTempEndDate('');
    setShowCustomDatePicker(false);
  };

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'CREATED':
        return '#0092ce';
      case 'COMPLETED':
        return '#22c55e';
      case 'CANCELLED':
        return '#ef4444';
      case 'SCHEDULED':
        return '#f59e0b';
      case 'IN_PROGRESS':
        return '#6366f1';
      default:
        return '#0092ce';
    }
  };

  const getStatusText = (status: Job['status']) => {
    switch (status) {
      case 'CREATED':
        return 'Created';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'SCHEDULED':
        return 'Scheduled';
      case 'IN_PROGRESS':
        return 'In Progress';
      default:
        return 'Created';
    }
  };

  const handlePreviousJob = () => {
    if (currentJobIndex > 0) {
      const newIndex = currentJobIndex - 1;
      setCurrentJobIndex(newIndex);
      const screenWidth = Dimensions.get('window').width;
      const cardWidth = screenWidth * 0.75;
      const marginRight = 12;
      const paddingLeft = (screenWidth - cardWidth) / 2;
      const scrollPosition = newIndex * (cardWidth + marginRight);

      scrollViewRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  };

  const handleNextJob = () => {
    if (currentJobIndex < filteredJobs.length - 1) {
      const newIndex = currentJobIndex + 1;
      setCurrentJobIndex(newIndex);
      const screenWidth = Dimensions.get('window').width;
      const cardWidth = screenWidth * 0.75;
      const marginRight = 12;
      const paddingLeft = (screenWidth - cardWidth) / 2;
      const scrollPosition = newIndex * (cardWidth + marginRight);

      scrollViewRef.current?.scrollTo({
        x: scrollPosition,
        animated: true,
      });
    }
  };

  if (selectedJob) {
    return <JobDetailsScreen job={selectedJob} onBack={() => {
      setSelectedJob(null);
      // Refetch jobs to update the list after job completion
      refetch();
    }} showBackButton={true} />;
  }

  // Loading state
  if (loading) {
    return (
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-slate-200 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-3" activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#0092ce" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-800">Job Map</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#0092ce" />
          <Text className="text-slate-600 mt-4">Loading jobs...</Text>
        </View>
      </View>
    );
  }

  // Error state
  if (error) {
    return (
      <View className="flex-1 bg-slate-50">
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-slate-200 flex-row items-center justify-between">
          <View className="flex-row items-center">
            <TouchableOpacity onPress={onBack} className="mr-3" activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={24} color="#0092ce" />
            </TouchableOpacity>
            <Text className="text-xl font-bold text-slate-800">Job Map</Text>
          </View>
        </View>
        <View className="flex-1 justify-center items-center px-6">
          <Ionicons name="alert-circle" size={64} color="#ef4444" />
          <Text className="text-slate-800 text-lg font-semibold mt-4">Error Loading Jobs</Text>
          <Text className="text-slate-600 text-center mt-2">{error.message}</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header */}
      <View className="bg-white px-6 py-4 border-b border-slate-200 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={onBack}
            className="mr-3"
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#0092ce" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-slate-800">Job Map</Text>
        </View>
        <TouchableOpacity
          onPress={() => setShowSearchModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="search" size={24} color="#0092ce" />
        </TouchableOpacity>
      </View>

      {/* Date Filter Bar */}
      <View className="bg-white px-6 py-3 border-b border-slate-200">
        <TouchableOpacity
          onPress={handleOpenFilterModal}
          className="flex-row items-center justify-between bg-slate-100 rounded-lg px-4 py-3"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <Ionicons name="calendar-outline" size={20} color="#0092ce" />
            <Text className="text-slate-700 ml-2 font-semibold">
              {dateFilter === 'ALL' ? 'All Dates' :
               dateFilter === 'TODAY' ? 'Today' :
               dateFilter === 'THIS_WEEK' ? 'This Week' :
               dateFilter === 'THIS_MONTH' ? 'This Month' :
               `${startDate} - ${endDate}`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Map View - Full Screen */}
      <View style={{ flex: 1 }}>
        <MultipleJobsMapView
          jobs={jobsWithColors}
          onJobMarkerPress={(job) => setSelectedJob(job)}
          focusedJobId={jobsWithColors[currentJobIndex]?.id}
        />

        {/* Floating Job Cards - Positioned at Bottom */}
        <View
          style={{
            position: 'absolute',
            bottom: 30,
            left: 0,
            right: 0,
          }}
        >
          {/* Left Arrow */}
          {currentJobIndex > 0 && (
            <TouchableOpacity
              onPress={handlePreviousJob}
              style={{
                position: 'absolute',
                left: 8,
                top: '50%',
                transform: [{ translateY: -20 }],
                zIndex: 10,
                backgroundColor: 'white',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={24} color="#0092ce" />
            </TouchableOpacity>
          )}

          {/* Right Arrow */}
          {currentJobIndex < filteredJobs.length - 1 && (
            <TouchableOpacity
              onPress={handleNextJob}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: [{ translateY: -20 }],
                zIndex: 10,
                backgroundColor: 'white',
                width: 40,
                height: 40,
                borderRadius: 20,
                justifyContent: 'center',
                alignItems: 'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 5,
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={24} color="#0092ce" />
            </TouchableOpacity>
          )}

          <ScrollView
            ref={scrollViewRef}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: (Dimensions.get('window').width - (Dimensions.get('window').width * 0.75)) / 2,
              paddingVertical: 10
            }}
            scrollEventThrottle={16}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            overScrollMode="auto"
          >
            {jobsWithColors.map((job, index) => (
              <Pressable
                key={job.id}
                onPress={() => setSelectedJob(job)}
                style={{
                  width: Dimensions.get('window').width * 0.75,
                  marginRight: index < filteredJobs.length - 1 ? 12 : 0,
                }}
              >
                {({ pressed }) => (
                  <View
                    className="bg-white rounded-2xl shadow-lg overflow-hidden"
                    style={{
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }}
                  >
                    {/* Route Color Bar - Matches map route color */}
                    <View
                      className="absolute left-0 top-0 bottom-0 rounded-l-2xl"
                      style={{
                        backgroundColor: ROUTE_COLORS[job.colorIndex % ROUTE_COLORS.length],
                        width: 6
                      }}
                    />

                    <View className="pl-5 pr-4 py-4">
                  {/* Job Number & Status */}
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-slate-600 text-sm font-bold">
                      {job.jobCode}
                    </Text>
                    <View
                      className="px-3 py-1.5 rounded-full"
                      style={{ backgroundColor: `${getStatusColor(job.status)}20` }}
                    >
                      <Text
                        className="text-xs font-bold"
                        style={{ color: getStatusColor(job.status) }}
                      >
                        {getStatusText(job.status)}
                      </Text>
                    </View>
                  </View>

                  {/* Job Name */}
                  <Text className="text-lg font-bold text-slate-800 mb-3" numberOfLines={2}>
                    {job.jobName}
                  </Text>

                  {/* Customer */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person-outline" size={16} color="#64748b" />
                    <Text className="text-sm text-slate-700 ml-2 flex-1 font-medium" numberOfLines={1}>
                      {job.customer}
                    </Text>
                  </View>

                  {/* Date & Time */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text className="text-sm text-slate-700 ml-2 font-medium">
                      {job.date} • {job.time}
                    </Text>
                  </View>

                  {/* Assigned Technicians */}
                  {job.assignedTechnicians && job.assignedTechnicians.length > 0 && (
                    <View className="flex-row items-start mb-2">
                      <Ionicons name="people-outline" size={16} color="#0092ce" style={{ marginTop: 1 }} />
                      <Text className="text-xs text-[#0092ce] ml-2 font-medium flex-1">
                        {job.assignedTechnicians.join(', ')}
                      </Text>
                    </View>
                  )}

                      {/* Location */}
                      <View className="flex-row items-start">
                        <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginTop: 1 }} />
                        <Text className="text-xs text-slate-600 ml-2 flex-1" numberOfLines={2}>
                          {job.address}
                        </Text>
                      </View>
                    </View>
                  </View>
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>

      {/* Search Modal */}
      <Modal
        visible={showSearchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowSearchModal(false)}
      >
        <View className="flex-1 bg-black/50 px-6 pt-20">
          <View className="bg-white rounded-2xl p-4">
            <View className="flex-row items-center bg-slate-100 rounded-lg px-4 py-3">
              <Ionicons name="search-outline" size={20} color="#64748b" />
              <TextInput
                className="flex-1 ml-2 text-slate-800"
                placeholder="Search jobs..."
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#64748b" />
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity
              onPress={() => setShowSearchModal(false)}
              className="mt-4 bg-[#0092ce] rounded-lg py-3"
              activeOpacity={0.7}
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Date Filter Modal */}
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
                <Ionicons name="calendar-outline" size={24} color="#0092ce" />
                <Text className="text-xl font-bold text-slate-800 ml-2">
                  Filter by Date
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

            <ScrollView className="px-6 py-4" showsVerticalScrollIndicator={false} nestedScrollEnabled={true} overScrollMode="auto" scrollEventThrottle={16}>
              <View className="mb-6">
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
                          numberOfLines={1}
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
                    <Text className="text-white font-semibold text-base" numberOfLines={1}>
                      Apply Date Range
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            <View className="px-6 py-4 border-t border-slate-200">
              <View className="flex-row" style={{ gap: 8 }}>
                <TouchableOpacity
                  onPress={handleClearFilters}
                  className="flex-1 rounded-xl items-center justify-center"
                  style={{
                    height: 44,
                    backgroundColor: tempDateFilter !== 'ALL' ? '#e2e8f0' : '#f1f5f9',
                    opacity: tempDateFilter !== 'ALL' ? 1 : 0.5
                  }}
                  activeOpacity={0.7}
                  disabled={tempDateFilter === 'ALL'}
                >
                  <Text className="text-slate-700 font-semibold text-base">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleApplyFilters}
                  className="flex-1 bg-[#0092ce] rounded-xl items-center justify-center"
                  style={{ height: 44 }}
                  activeOpacity={0.7}
                >
                  <Text className="text-white font-semibold text-base">Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
