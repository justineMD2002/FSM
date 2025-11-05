import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Job } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import JobMapView from '@/components/JobMapView';
import DetailsTab from '@/components/DetailsTab';
import ServiceTab from '@/components/ServiceTab';
import CompleteTab from '@/components/CompleteTab';
import ChatTab from '@/components/ChatTab';

interface JobDetailsScreenProps {
  job: Job;
  onBack: () => void;
}

type TabType = 'Details' | 'Navigate' | 'Service' | 'Complete' | 'Chat';

interface TabConfig {
  id: TabType;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
}

export default function JobDetailsScreen({ job, onBack }: JobDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showJobStatusModal, setShowJobStatusModal] = useState(false);

  // Show modal if job is completed or cancelled
  useEffect(() => {
    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      setShowJobStatusModal(true);
    }
  }, [job.status]);

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

  // Define tabs based on whether it's a history job
  const baseTabs: TabConfig[] = [
    { id: 'Details', icon: 'document-text-outline', label: 'Details' },
    { id: 'Navigate', icon: 'navigate-outline', label: 'Navigate' },
    { id: 'Service', icon: 'build-outline', label: 'Service' },
    { id: 'Complete', icon: 'checkmark-circle-outline', label: 'Complete' },
  ];

  // Add Chat tab for history jobs only
  const tabs: TabConfig[] = isHistoryJob
    ? [...baseTabs, { id: 'Chat', icon: 'chatbubbles-outline', label: 'Chat' }]
    : baseTabs;

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
      ) : activeTab === 'Chat' ? (
        // Chat tab takes full height without parent ScrollView
        <View className="flex-1 px-4 py-4">
          <ChatTab />
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
            <ServiceTab onSubmit={handleSubmitServiceReport} isHistoryJob={isHistoryJob} />
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

      {/* Job Status Modal (Completed/Cancelled) */}
      <Modal
        visible={showJobStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowJobStatusModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-4">
              <Ionicons
                name={job.status === 'COMPLETED' ? "checkmark-circle" : "close-circle"}
                size={64}
                color={job.status === 'COMPLETED' ? "#22c55e" : "#ef4444"}
              />
            </View>
            <Text className="text-2xl font-bold text-slate-800 mb-4 text-center">
              Job {job.status === 'COMPLETED' ? 'Completed' : 'Cancelled'}
            </Text>
            <Text className="text-base text-slate-600 mb-6 text-center">
              This job has been {job.status === 'COMPLETED' ? 'completed' : 'cancelled'} and cannot be modified.
            </Text>

            <TouchableOpacity
              onPress={() => setShowJobStatusModal(false)}
              className="bg-[#0092ce] rounded-xl py-3 items-center"
            >
              <Text className="text-white font-semibold text-base">OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
