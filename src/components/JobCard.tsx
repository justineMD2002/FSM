import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';

export const JobCard = ({ job, onPress }: { job: Job; onPress?: () => void }) => {
  // Get display status based on actual job status
  const getDisplayStatus = (): { status: Job['status']; text: string } => {
    // Use the actual job status
    switch (job.status) {
      case 'COMPLETED':
        return { status: 'COMPLETED', text: 'Completed' };
      case 'CANCELLED':
        return { status: 'CANCELLED', text: 'Cancelled' };
      case 'IN_PROGRESS':
        return { status: 'IN_PROGRESS', text: 'In Progress' };
      case 'SCHEDULED':
        return { status: 'SCHEDULED', text: 'Scheduled' };
      case 'RESCHEDULED':
        return { status: 'RESCHEDULED', text: 'Rescheduled' };
      case 'CREATED':
        return { status: 'CREATED', text: 'Created' };
      default:
        return {
          status: job.status,
          text: job.status.replace('_', ' ').split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          ).join(' ')
        };
    }
  };

  const statusColors: Record<Job['status'], { bg: string; text: string; border: string }> = {
    COMPLETED: { bg: '#E8F5E9', text: '#2E7D32', border: '#77DD77' },
    CANCELLED: { bg: '#FFEBEE', text: '#C62828', border: '#FF6961' },
    CREATED: { bg: '#FFF9E6', text: '#9E9E9E', border: '#CCCCCC' },
    SCHEDULED: { bg: '#FFF3E0', text: '#E65100', border: '#FFD580' },
    RESCHEDULED: { bg: '#FFF3E0', text: '#E65100', border: '#FFD580' },
    IN_PROGRESS: { bg: '#E3F2FD', text: '#1565C0', border: '#6A89CC' }
  };

  const displayInfo = getDisplayStatus();
  const colors = statusColors[displayInfo.status];

  return (
    <View className="bg-white rounded-xl shadow-md mb-4 w-full">
      <View className="flex-row">
        <View className="w-1 rounded-l-xl" style={{ backgroundColor: colors.border }} />
        <View className="flex-1 p-4">
          {/* Header */}
          <View className="flex-row mb-3">
            <Ionicons name="document-text-outline" size={24} color="#0092ce" />
            <View className="flex-1 ml-3">
              <View className="flex-row justify-between items-start">
                <View className="flex-1">
                  <Text className="text-lg font-bold text-slate-800">{job.jobName}</Text>
                  <Text className="text-sm text-slate-500 mt-1">{job.jobCode}</Text>
                </View>
                <View className="px-3 py-1 rounded-full" style={{ backgroundColor: colors.bg }}>
                  <Text className="text-xs font-semibold" style={{ color: colors.text }}>
                    {displayInfo.text}
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
                {job.endTime && (
                  job.endDate && job.endDate !== job.date
                    ? ` - ${job.endDate} at ${job.endTime}`
                    : ` - ${job.endTime}`
                )}
              </Text>
            </View>

            {job.address && (
              <View className="flex-row items-start mt-2">
                <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text className="text-sm text-slate-600 ml-2 flex-1">{job.address}</Text>
              </View>
            )}

            {job.notes && (
              <View className="flex-row items-start mt-2">
                <Ionicons name="clipboard-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                <Text className="text-sm text-slate-600 ml-2 flex-1">{job.notes}</Text>
              </View>
            )}

            <View className="flex-row items-center mt-2">
              <Ionicons name="person-outline" size={16} color="#64748b" />
              <Text className="text-sm text-slate-600 ml-2">{job.customer}</Text>
            </View>
          </View>
          <View className="mt-4 flex-row justify-end">
            <TouchableOpacity
              className="flex-row items-center bg-[#0092ce] px-4 py-2 rounded-full"
              activeOpacity={0.8}
              onPress={onPress}
            >
              <Text className="text-white font-medium mr-2">View Job Details</Text>
              <Ionicons name="arrow-forward-outline" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};