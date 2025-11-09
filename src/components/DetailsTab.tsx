import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import { useJobTechnicians, useCustomerEquipments, useCustomerContacts } from '@/hooks';

interface DetailsTabProps {
  job: Job;
  jobId: string;
  customerId: string;
  statusColor: string;
  canStartJob: boolean;
  onStartJob: () => void;
}

export default function DetailsTab({ job, jobId, customerId, statusColor, canStartJob, onStartJob }: DetailsTabProps) {
  const { technicians, loading: techniciansLoading } = useJobTechnicians(jobId);
  const { equipments, loading: equipmentsLoading } = useCustomerEquipments(customerId);
  const { contacts, loading: contactsLoading } = useCustomerContacts(customerId);

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'URGENT':
        return { bg: '#fee2e2', text: '#dc2626' };
      case 'HIGH':
        return { bg: '#fed7aa', text: '#ea580c' };
      case 'MEDIUM':
        return { bg: '#e0f4fb', text: '#0092ce' };
      case 'LOW':
        return { bg: '#dbeafe', text: '#2563eb' };
      default:
        return { bg: '#e0f4fb', text: '#0092ce' };
    }
  };

  const priorityStyle = getPriorityColor(job.priority);
  const primaryContact = contacts[0];

  const handleCall = (phoneNumber?: string | null) => {
    if (phoneNumber) {
      Linking.openURL(`tel:${phoneNumber}`);
    }
  };

  const handleWhatsApp = (phoneNumber?: string | null) => {
    if (phoneNumber) {
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      Linking.openURL(`https://wa.me/${cleanNumber}`);
    }
  };

  const getInitials = (name: string) => {
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0].substring(0, 2).toUpperCase();
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getAvatarColor = (index: number) => {
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'];
    return colors[index % colors.length];
  };

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
                  <Text className="text-xs font-medium text-slate-500">{job.status}</Text>
                </View>

                {job.priority && (
                  <View
                    className="px-2 py-1 rounded-lg"
                    style={{
                      backgroundColor: priorityStyle.bg,
                      minWidth: 70,
                      alignItems: 'center',
                    }}
                  >
                    <Text className="text-xs font-semibold" style={{ color: priorityStyle.text }}>
                      {job.priority}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Subject */}
            <View className="mb-4">
              <Text className="text-xs text-slate-500 mb-1">SUBJECT</Text>
              <Text className="text-base text-slate-800">{job.jobName}</Text>
            </View>

            {job.notes && (
              <View className="mb-4">
                <Text className="text-xs text-slate-500 mb-1">DESCRIPTION</Text>
                <Text className="text-sm text-slate-700">{job.notes}</Text>
              </View>
            )}

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

                    {contactsLoading ? (
                      <View className="mt-3 ml-5">
                        <ActivityIndicator size="small" color="#0092ce" />
                      </View>
                    ) : primaryContact ? (
                      <View className="mt-3 ml-5">
                        <Text className="text-xs text-slate-500 font-semibold ml-1">Contact Person</Text>
                        <Text className="text-sm text-slate-700">
                          {primaryContact.first_name} {primaryContact.middle_name ? primaryContact.middle_name + ' ' : ''}{primaryContact.last_name}
                        </Text>

                        {primaryContact.tel1 && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="phone-portrait-outline" size={14} color="#64748b" />
                            <Text className="text-xs text-slate-600 ml-2">{primaryContact.tel1}</Text>
                          </View>
                        )}

                        {primaryContact.tel2 && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="call-outline" size={14} color="#64748b" />
                            <Text className="text-xs text-slate-600 ml-2">{primaryContact.tel2}</Text>
                          </View>
                        )}

                        {primaryContact.email && (
                          <View className="flex-row items-center mt-1">
                            <Ionicons name="mail-outline" size={14} color="#64748b" />
                            <Text className="text-xs text-slate-600 ml-2">{primaryContact.email}</Text>
                          </View>
                        )}
                      </View>
                    ) : null}
                  </View>
                </View>

                {primaryContact && (
                  <View className="flex-row">
                    {primaryContact.tel1 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="p-1 rounded-full mr-2"
                        style={{ backgroundColor: '#e0f4fb' }}
                        onPress={() => handleCall(primaryContact.tel1)}
                      >
                        <Ionicons name="call-sharp" size={18} color="#0092ce" />
                      </TouchableOpacity>
                    )}
                    {primaryContact.tel1 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        className="p-1 rounded-full"
                        style={{ backgroundColor: '#25D366' }}
                        onPress={() => handleWhatsApp(primaryContact.tel1)}
                      >
                        <Ionicons name="logo-whatsapp" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Equipments Card */}
      {equipmentsLoading ? (
        <View className="bg-white rounded-xl shadow-sm mb-4 p-6 items-center">
          <ActivityIndicator size="small" color="#0092ce" />
          <Text className="text-slate-500 text-sm mt-2">Loading equipments...</Text>
        </View>
      ) : equipments.length > 0 ? (
        equipments.slice(0, 3).map((equipment) => (
          <View key={equipment.id} className="bg-white rounded-xl shadow-sm mb-4">
            <View className="flex-row">
              <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
              <View className="flex-1 p-4">
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-row items-center flex-1">
                    <Ionicons name="settings-sharp" size={20} color="#0092ce" />
                    <Text className="text-base font-semibold text-slate-800 ml-2">
                      {equipment.item_name}
                    </Text>
                  </View>
                  <View className="bg-emerald-100 px-2 py-1 rounded-lg">
                    <Text className="text-xs font-medium text-emerald-700">Active</Text>
                  </View>
                </View>

                <View className="space-y-2">
                  {equipment.model_series && (
                    <View className="flex-row items-center">
                      <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                      <Text className="text-xs text-slate-500 ml-2">Model: </Text>
                      <Text className="text-sm text-slate-700">{equipment.model_series}</Text>
                    </View>
                  )}

                  {equipment.serial_number && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="barcode-outline" size={16} color="#64748b" />
                      <Text className="text-xs text-slate-500 ml-2">SN: </Text>
                      <Text className="text-sm text-slate-700">{equipment.serial_number}</Text>
                    </View>
                  )}

                  {equipment.equipment_location && (
                    <View className="flex-row items-center mt-2">
                      <Ionicons name="location-outline" size={16} color="#64748b" />
                      <Text className="text-sm text-slate-700 ml-2">{equipment.equipment_location}</Text>
                    </View>
                  )}
                </View>
              </View>
            </View>
          </View>
        ))
      ) : null}

      {/* Technicians Section */}
      {techniciansLoading ? (
        <View className="bg-white rounded-xl shadow-sm mb-4 p-6 items-center">
          <ActivityIndicator size="small" color="#0092ce" />
          <Text className="text-slate-500 text-sm mt-2">Loading technicians...</Text>
        </View>
      ) : technicians.length > 0 ? (
        <>
          <Text className="text-base font-semibold text-slate-800 mb-3 px-1">Technicians</Text>

          {technicians.map((techJob, index) => {
            const tech = techJob.technician;
            if (!tech) return null;

            return (
              <View key={techJob.id} className="bg-white rounded-xl shadow-sm mb-3">
                <View className="flex-row">
                  <View className="w-1 rounded-l-xl" style={{ backgroundColor: statusColor }} />
                  <View className="flex-1 p-4">
                    <View className="flex-row items-center">
                      <View
                        className="w-12 h-12 rounded-full items-center justify-center"
                        style={{ backgroundColor: getAvatarColor(index) }}
                      >
                        <Text className="text-white font-bold text-lg">{getInitials(tech.full_name)}</Text>
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-base font-semibold text-slate-800">{tech.full_name}</Text>
                        <Text className="text-xs text-slate-500">{tech.email}</Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            style={{ backgroundColor: '#e0f4fb' }}
                            className="px-2 py-1 rounded-lg mr-3"
                          >
                            <Text className="text-xs font-medium text-[#0092ce]">
                              {techJob.assignment_status}
                            </Text>
                          </View>
                          <View className="flex-row items-center">
                            <View
                              className="w-2 h-2 rounded-full mr-1"
                              style={{ backgroundColor: tech.is_online ? '#22c55e' : '#94a3b8' }}
                            />
                            <Text
                              className="text-xs font-medium"
                              style={{ color: tech.is_online ? '#22c55e' : '#94a3b8' }}
                            >
                              {tech.is_online ? 'Online' : 'Offline'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </>
      ) : null}

      {/* Start Job Button */}
      <TouchableOpacity
        className={`rounded-xl py-4 items-center justify-center flex-row mt-2 mb-6 ${
          canStartJob ? 'bg-[#0092ce]' : 'bg-slate-300'
        }`}
        activeOpacity={canStartJob ? 0.8 : 1}
        onPress={canStartJob ? onStartJob : undefined}
        disabled={!canStartJob}
      >
        <Ionicons name="play-circle-outline" size={24} color={canStartJob ? '#fff' : '#94a3b8'} />
        <Text className={`font-semibold text-lg ml-2 ${canStartJob ? 'text-white' : 'text-slate-500'}`}>
          Start Job
        </Text>
      </TouchableOpacity>
    </View>
  );
}
