import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import JobMapView from '@/components/JobMapView';
import DetailsTab from '@/components/DetailsTab';
import ServiceTab from '@/components/ServiceTab';
import CompleteTab from '@/components/CompleteTab';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const getStatusColor = (status: Job['status']) => {
    switch (status) {
      case 'PENDING':
        return '#0092ce';
      case 'COMPLETED':
        return '#22c55e';
      case 'CANCELLED':
        return '#ef4444';
    }
  };

  const statusColor = getStatusColor(job.status);

  const handleStartJob = () => {
    setShowConfirmModal(true);
  };

  const handleConfirmStart = () => {
    setShowConfirmModal(false);
    setShowSuccessModal(true);
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setActiveTab('Navigate');
  };

  const handleSubmitServiceReport = () => {
    setActiveTab('Complete');
  };

  const isJobPending = job.status === 'PENDING';
  const isHistoryJob = job.status === 'COMPLETED' || job.status === 'CANCELLED';

  const activeTabIndex = tabs.findIndex(tab => tab.id === activeTab);

  return (
    <View className="flex-1 bg-slate-50">
      {/* Timeline Tabs */}
      <View className="bg-white px-4 py-6 border-b border-slate-200">
        <View className="flex-row justify-between items-center">
          {tabs.map((tab, index) => {
            const isLineCompleted = index < activeTabIndex;

            return (
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
                  <View
                    className="h-0.5 flex-1 mb-6"
                    style={{
                      marginHorizontal: 4,
                      backgroundColor: isLineCompleted ? '#0092ce' : '#cbd5e1'
                    }}
                  />
                )}
              </React.Fragment>
            );
          })}
        </View>
      </View>

      {/* Content */}
      {activeTab === 'Navigate' ? (
        // Map view takes full height without ScrollView
        <View className="flex-1">
          <JobMapView address={job.address} isHistoryJob={isHistoryJob} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {activeTab === 'Details' && (
            <DetailsTab
              job={job}
              statusColor={statusColor}
              isJobPending={isJobPending}
              onStartJob={handleStartJob}
            />
          )}

          {activeTab === 'Service' && (
            <ServiceTab onSubmit={handleSubmitServiceReport} />
          )}

          {activeTab === 'Complete' && (
            <CompleteTab />
          )}
        </ScrollView>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        visible={showConfirmModal}
        title="Start Job"
        message="Are you sure you want to start this job?"
        confirmText="Start"
        cancelText="Cancel"
        onConfirm={handleConfirmStart}
        onCancel={() => setShowConfirmModal(false)}
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title="Job Started"
        message="You can now proceed to Navigation screen"
        buttonText="OK"
        onClose={handleSuccessClose}
      />
    </View>
  );
}
