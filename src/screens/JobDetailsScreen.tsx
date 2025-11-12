import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { Job } from '@/types';
import ConfirmationModal from '@/components/ConfirmationModal';
import SuccessModal from '@/components/SuccessModal';
import ErrorModal from '@/components/ErrorModal';
import JobMapView from '@/components/JobMapView';
import DetailsTab from '@/components/DetailsTab';
import ServiceTab from '@/components/ServiceTab';
import CompleteTab from '@/components/CompleteTab';
import ChatTab from '@/components/ChatTab';
import { useAuthStore, useNavigationStore } from '@/store';
import { Tab } from '@/enums';
import { checkClockInStatus, getTechnicianStatus } from '@/services/attendance.service';
import { useCurrentUserTechnicianJob } from '@/hooks';
import { updateTechnicianJobStatus } from '@/services/technicianJobs.service';
import { updateCurrentLocation } from '@/services/locations.service';
import { getJobById } from '@/services/jobs.service';

interface JobDetailsScreenProps {
  job: Job;
  onBack: () => void;
  showBackButton?: boolean;
}

type TabType = 'Details' | 'Navigate' | 'Service' | 'Complete' | 'Chat';

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

export default function JobDetailsScreen({ job, onBack, showBackButton = false }: JobDetailsScreenProps) {
  const [activeTab, setActiveTab] = useState<TabType>('Details');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showBreakErrorModal, setShowBreakErrorModal] = useState(false);
  const [showJobStatusModal, setShowJobStatusModal] = useState(false);
  const [showArrivalModal, setShowArrivalModal] = useState(false);
  const [destinationCoords, setDestinationCoords] = useState<{ lat: string | null; lng: string | null }>({ lat: null, lng: null });

  const user = useAuthStore((state) => state.user);
  const { setActiveTab: setGlobalActiveTab, setSelectedJob } = useNavigationStore();

  // Fetch current user's technician job assignment
  const { technicianJob, refetch: refetchTechnicianJob } = useCurrentUserTechnicianJob(job.id, user?.id || null);

  // Fetch location coordinates from database
  useEffect(() => {
    const fetchLocationCoords = async () => {
      try {
        const { supabase } = await import('@/lib/supabase');
        const { data: dbJob } = await supabase
          .from('jobs')
          .select(`
            location_id,
            location:location_id (
              destination_latitude,
              destination_longitude
            )
          `)
          .eq('id', job.id)
          .single() as any;

        if (dbJob?.location) {
          setDestinationCoords({
            lat: dbJob.location.destination_latitude,
            lng: dbJob.location.destination_longitude,
          });
        }
      } catch (error) {
        console.error('Error fetching location coordinates:', error);
      }
    };

    fetchLocationCoords();
  }, [job.id]);

  // Show modal if job is completed or cancelled
  useEffect(() => {
    if (job.status === 'COMPLETED' || job.status === 'CANCELLED') {
      setShowJobStatusModal(true);
    }
  }, [job.status]);

  const getStatusColor = (status: Job['status']): string => {
    switch (status) {
      case 'PENDING':
        return '#0092ce';
      case 'COMPLETED':
        return '#22c55e';
      case 'CANCELLED':
        return '#ef4444';
      case 'UPCOMING':
        return '#f59e0b';
      case 'IN_PROGRESS':
        return '#6366f1';
      default:
        return '#0092ce';
    }
  };

  const statusColor = getStatusColor(job.status);

  const handleStartJob = async () => {
    // Check if user is clocked in
    if (!user) {
      setShowErrorModal(true);
      return;
    }

    const { data: attendance, error } = await checkClockInStatus(user.id);

    if (error || !attendance) {
      // User is not clocked in, show error modal
      setShowErrorModal(true);
      return;
    }

    // Check if user is on break
    // First get technician ID from user ID
    const { supabase } = await import('@/lib/supabase');
    const { data: techData } = await supabase
      .from('technicians')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (techData) {
      const { data: statusData } = await getTechnicianStatus(techData.id);

      if (statusData && statusData.status === 'Break') {
        // User is on break, show break error modal
        setShowBreakErrorModal(true);
        return;
      }
    }

    // User is clocked in and not on break, proceed with confirmation
    setShowConfirmModal(true);
  };

  const handleConfirmStart = async () => {
    if (!technicianJob?.id) {
      alert('No technician assignment found for this job');
      setShowConfirmModal(false);
      return;
    }

    try {
      // Get current location to save as starting point
      let currentLocation = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });
          currentLocation = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
        }
      } catch (locError) {
        console.error('Could not get current location:', locError);
        // Continue without location - it's not critical for starting the job
      }

      // Update technician job status to STARTED
      const result = await updateTechnicianJobStatus(technicianJob.id, 'STARTED');

      if (result.error) {
        alert(`Error starting job: ${result.error.message}`);
        setShowConfirmModal(false);
        return;
      }

      // Save current location to the locations table if we have a location_id
      if (currentLocation) {
        // Fetch the full job details to get location_id
        const jobResult = await getJobById(job.id);
        if (!jobResult.error && jobResult.data) {
          // Get the location_id from the database job
          const { data: dbJob } = await import('@/lib/supabase').then(({ supabase }) =>
            supabase
              .from('jobs')
              .select('location_id')
              .eq('id', job.id)
              .single()
          );

          if (dbJob?.location_id) {
            const locationResult = await updateCurrentLocation(
              dbJob.location_id,
              currentLocation.latitude,
              currentLocation.longitude
            );

            if (locationResult.error) {
              console.error('Error saving starting location:', locationResult.error);
              // Don't fail the job start if location save fails
            }
          }
        }
      }

      // Refetch to get updated status
      await refetchTechnicianJob();

      setShowConfirmModal(false);
      setShowSuccessModal(true);
    } catch (error: any) {
      alert(`Error: ${error.message}`);
      setShowConfirmModal(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    setActiveTab('Navigate');
  };

  const handleErrorClose = () => {
    setShowErrorModal(false);
    // Navigate to Profile tab
    setGlobalActiveTab(Tab.PROFILE);
    // Clear selected job to return to home view
    setSelectedJob(null);
  };

  const handleBreakErrorClose = () => {
    setShowBreakErrorModal(false);
    // Navigate to Profile tab
    setGlobalActiveTab(Tab.PROFILE);
    // Clear selected job to return to home view
    setSelectedJob(null);
  };

  const handleSubmitServiceReport = () => {
    setActiveTab('Complete');
  };

  const handleArrival = () => {
    setShowArrivalModal(true);
  };

  // Auto-redirect to Service tab after 3 seconds when arrival modal is shown
  useEffect(() => {
    if (showArrivalModal) {
      const timer = setTimeout(() => {
        setShowArrivalModal(false);
        setActiveTab('Service');
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [showArrivalModal]);

  const isJobPending = job.status === 'PENDING';
  const isHistoryJob = job.status === 'COMPLETED' || job.status === 'CANCELLED';

  // Check if THIS specific job has been started by the current user
  const isJobStartedByUser = !!(technicianJob && (technicianJob.assignment_status === 'STARTED' || technicianJob.assignment_status === 'COMPLETED'));

  // Can start job if: job is PENDING AND (no assignment OR assignment is still in ASSIGNED status)
  const canStartJob = isJobPending && (!technicianJob || technicianJob.assignment_status === 'ASSIGNED');

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
      {/* Header - Only shown when showBackButton is true */}
      {showBackButton && (
        <View className="bg-white border-b border-slate-200">
          <View className="px-3 pt-7 pb-4">
            <View className="flex-row items-center justify-between">
              {/* Left: Back button and Job Details text */}
              <View className="flex-row items-center">
                <TouchableOpacity onPress={onBack} className="mr-3">
                  <Ionicons name="arrow-back" size={24} color="#334155" />
                </TouchableOpacity>
                <Text className="text-black text-xl font-semibold">Job Details</Text>
              </View>

              {/* Right: Info Icon */}
              <View className="flex-row items-center">
                <Ionicons name="information-circle" size={26} color="#0092ce" />
              </View>
            </View>
          </View>
        </View>
      )}

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
          <JobMapView
            address={job.address}
            isHistoryJob={isHistoryJob}
            onArrival={handleArrival}
            destinationLatitude={destinationCoords.lat}
            destinationLongitude={destinationCoords.lng}
          />
        </View>
      ) : activeTab === 'Chat' ? (
        // Chat tab takes full height without parent ScrollView
        <View className="flex-1 px-4 py-4">
          <ChatTab jobId={job.id} technicianJobId={technicianJob?.id || null} />
        </View>
      ) : (
        <ScrollView className="flex-1 px-4 py-4">
          {activeTab === 'Details' && (
            <DetailsTab
              job={job}
              jobId={job.id}
              customerId={job.customerId}
              statusColor={statusColor}
              canStartJob={canStartJob}
              isJobStartedByUser={isJobStartedByUser}
              onStartJob={handleStartJob}
            />
          )}

          {activeTab === 'Service' && (
            <ServiceTab
              jobId={job.id}
              technicianJobId={technicianJob?.id || null}
              onSubmit={handleSubmitServiceReport}
              isHistoryJob={isHistoryJob}
              isJobStarted={isJobStartedByUser}
            />
          )}

          {activeTab === 'Complete' && (
            <CompleteTab
              jobId={job.id}
              customerId={job.customerId}
              customerName={job.customer}
              technicianJobId={technicianJob?.id || null}
              jobStatus={job.status}
              assignmentStatus={technicianJob?.assignment_status || null}
              onJobCompleted={() => {
                refetchTechnicianJob();
                // Optionally navigate back or refresh
              }}
            />
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

      {/* Error Modal - Not Clocked In */}
      <ErrorModal
        visible={showErrorModal}
        title="Clock In Required"
        message="You need to clock in first before you can start a job. Please go to your profile and clock in."
        buttonText="Go to Profile"
        onClose={handleErrorClose}
      />

      {/* Error Modal - On Break */}
      <ErrorModal
        visible={showBreakErrorModal}
        title="On Break"
        message="You are currently on a break. Please resume first before starting a job."
        buttonText="Go to Profile"
        onClose={handleBreakErrorClose}
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

      {/* Arrival Notification Modal */}
      <Modal
        visible={showArrivalModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowArrivalModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-4">
              <Ionicons
                name="location"
                size={64}
                color="#22c55e"
              />
            </View>
            <Text className="text-2xl font-bold text-slate-800 mb-4 text-center">
              You've Arrived!
            </Text>
            <Text className="text-base text-slate-600 mb-6 text-center">
              You have arrived at your destination. Redirecting to service tab...
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
}
