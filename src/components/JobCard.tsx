import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';

export const JobCard = ({ job }: { job: Job }) => {
  const statusColors: Record<Job['status'], { bg: string; text: string; border: string }> = {
    COMPLETED: { bg: '#dcfce7', text: '#16a34a', border: '#22c55e' },
    CANCELLED: { bg: '#fee2e2', text: '#dc2626', border: '#ef4444' },
    ONGOING: { bg: '#dbeafe', text: '#1d4ed8', border: '#3b82f6' }
  };

  const colors = statusColors[job.status];

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
  );
};