import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';

interface DetailsTabProps {
  job: Job;
  statusColor: string;
  isJobPending: boolean;
  onStartJob: () => void;
}

export default function DetailsTab({ job, statusColor, isJobPending, onStartJob }: DetailsTabProps) {
  return (
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
        className={`rounded-xl py-4 items-center justify-center flex-row mt-2 mb-6 ${
          isJobPending ? 'bg-[#0092ce]' : 'bg-slate-300'
        }`}
        activeOpacity={isJobPending ? 0.8 : 1}
        onPress={isJobPending ? onStartJob : undefined}
        disabled={!isJobPending}
      >
        <Ionicons name="play-circle-outline" size={24} color={isJobPending ? '#fff' : '#94a3b8'} />
        <Text className={`font-semibold text-lg ml-2 ${isJobPending ? 'text-white' : 'text-slate-500'}`}>
          Start Job
        </Text>
      </TouchableOpacity>
    </View>
  );
}
