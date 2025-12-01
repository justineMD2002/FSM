import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';

export const JobCard = ({ job, onPress, isHistoryTab }: { job: Job; onPress?: () => void; isHistoryTab?: boolean }) => {
  // Get display status based on which tab is active
  // History tab uses technician assignment status, Current Jobs tab uses job status
  // EXCEPTION: For CANCELLED/RESCHEDULED jobs, always show the job-level status
  const getDisplayStatus = (): { status: Job['status']; text: string } => {
    // Priority 1: If job is CANCELLED or RESCHEDULED, always show job-level status
    if (job.status === 'CANCELLED') {
      return { status: 'CANCELLED', text: 'Cancelled' };
    }
    if (job.status === 'RESCHEDULED') {
      return { status: 'RESCHEDULED', text: 'Rescheduled' };
    }

    // Priority 2: For History tab, use technician assignment status if available
    if (isHistoryTab && job.technicianAssignmentStatus) {
      switch (job.technicianAssignmentStatus) {
        case 'COMPLETED':
          return { status: 'COMPLETED', text: 'Completed' };
        case 'CANCELLED':
          return { status: 'CANCELLED', text: 'Cancelled' };
        case 'STARTED':
          return { status: 'IN_PROGRESS', text: 'In Progress' };
        case 'ASSIGNED':
          return { status: 'CREATED', text: 'Assigned' };
        default:
          break;
      }
    }

    // Priority 3: For Current Jobs tab, use job-level status
    switch (job.status) {
      case 'COMPLETED':
        return { status: 'COMPLETED', text: 'Completed' };
      case 'IN_PROGRESS':
        return { status: 'IN_PROGRESS', text: 'In Progress' };
      case 'SCHEDULED':
        return { status: 'SCHEDULED', text: 'Scheduled' };
      case 'CREATED':
        return { status: 'CREATED', text: 'Created' };
      default:
        return {
          status: job.status,
          text: (job.status as any).replace('_', ' ').split(' ').map((word: any) =>
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
              <View className="mt-2">
                <View className="flex-row items-start">
                  <Ionicons name="location-outline" size={16} color="#64748b" style={{ marginTop: 2 }} />
                  <Text className="text-sm text-slate-600 ml-2 flex-1">{job.address}</Text>
                </View>

                {/* Address Notes */}
                {job.addressNotes && job.addressNotes.length > 0 && (
                  <View className="ml-6 mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2">
                    <Text className="text-xs font-semibold text-amber-800 mb-1">Address Notes:</Text>
                    {job.addressNotes.map((note, index) => (
                      <Text key={index} className="text-xs text-amber-700">
                        {index > 0 && '\n'}• {note}
                      </Text>
                    ))}
                  </View>
                )}
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

            {/* Assigned Technicians */}
            {job.assignedTechnicians && job.assignedTechnicians.length > 0 && (
              <View className="flex-row items-start mt-2">
                <Ionicons name="people-outline" size={16} color="#0092ce" style={{ marginTop: 2 }} />
                <Text className="text-sm text-[#0092ce] ml-2 font-medium flex-1">
                  {job.assignedTechnicians.join(', ')}
                </Text>
              </View>
            )}
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