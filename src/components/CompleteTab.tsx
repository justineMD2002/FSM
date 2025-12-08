import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Platform, Modal, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import SignatureScreen from 'react-native-signature-canvas';
import SignatureCanvas from 'react-signature-canvas';
import SuccessModal from '@/components/SuccessModal';
import { useJobTasks, useTaskCompletions, useJobEquipments, useJobSignature } from '@/hooks';
import { uploadSignatureAndCreateRecord } from '@/services/jobSignatures.service';
import { updateTechnicianJobStatus } from '@/services/technicianJobs.service';
import { checkClockInStatus, getTechnicianStatus } from '@/services/attendance.service';
import { useAuthStore } from '@/store';
import { formatDateTime } from '@/utils/dateFormat';

interface CompleteTabProps {
  jobId: string;
  customerId: string;
  customerName: string;
  technicianJobId: string | null;
  jobStatus: string;
  assignmentStatus: string | null;
  onJobCompleted?: () => void;
  onSignatureDrawingChange?: (isDrawing: boolean) => void;
}

export default function CompleteTab({
  jobId,
  customerId,
  customerName,
  technicianJobId,
  jobStatus,
  assignmentStatus,
  onJobCompleted,
  onSignatureDrawingChange,
}: CompleteTabProps) {
  const user = useAuthStore((state) => state.user);

  const [localSignature, setLocalSignature] = useState<string | null>(null);
  const [signatureDate, setSignatureDate] = useState<Date | null>(null);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [isSignatureEmpty, setIsSignatureEmpty] = useState(true);
  const [localTaskCompletions, setLocalTaskCompletions] = useState<{ [taskId: string]: boolean }>({});
  const [pendingSignature, setPendingSignature] = useState<string | null>(null); // Store signature temporarily until job completion
  const [localJobCompleted, setLocalJobCompleted] = useState(false); // Track if job was completed in this session
  const signatureRef = useRef<any>(null);
  const isWeb = Platform.OS === 'web';

  // Attendance states
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Modal states
  const [showSignatureSavedModal, setShowSignatureSavedModal] = useState(false);
  const [showCompleteJobModal, setShowCompleteJobModal] = useState(false);
  const [showCongratulationsModal, setShowCongratulationsModal] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Fetch data
  const { tasks, loading: tasksLoading } = useJobTasks(jobId);
  const { completions, loading: completionsLoading } = useTaskCompletions(technicianJobId);
  const { jobEquipments, loading: equipmentsLoading } = useJobEquipments(jobId);
  const { signature: existingSignature, loading: signatureLoading, refetch: refetchSignature } = useJobSignature(technicianJobId);

  // Check if job has been started
  const jobStarted = assignmentStatus === 'STARTED' || assignmentStatus === 'COMPLETED';
  const jobCompleted = jobStatus === 'COMPLETED' || jobStatus === 'CANCELLED' || localJobCompleted;

  // Load existing signature
  useEffect(() => {
    if (existingSignature) {
      setLocalSignature(existingSignature.signature_image_url);
      setSignatureDate(new Date(existingSignature.signed_at));
    }
  }, [existingSignature]);

  // Initialize local task completions from database and task status
  useEffect(() => {
    const initialCompletions: { [taskId: string]: boolean } = {};
    tasks.forEach(task => {
      // Priority order: task.is_completed > completion record
      const completion = completions.find(c => c.job_task_id === task.id);
      initialCompletions[task.id] = task.is_completed || completion?.is_completed || false;
    });
    setLocalTaskCompletions(initialCompletions);
  }, [tasks, completions]);

  // Check clock-in and break status
  useEffect(() => {
    const checkAttendanceStatus = async () => {
      if (!user) {
        setIsClockedIn(false);
        setIsOnBreak(false);
        return;
      }

      try {
        // Check clock-in status
        const { data: attendance, error: clockError } = await checkClockInStatus(user.id);

        if (clockError || !attendance) {
          setIsClockedIn(false);
          setIsOnBreak(false);
          return;
        }

        setIsClockedIn(true);

        // Check break status - get technician ID from user ID
        const { supabase } = await import('@/lib/supabase');
        const { data: techData } = await supabase
          .from('technicians')
          .select('id')
          .eq('user_id', user.id)
          .single();

        if (techData) {
          const { data: statusData } = await getTechnicianStatus(techData.id);

          if (statusData && statusData.status === 'Break') {
            setIsOnBreak(true);
          } else {
            setIsOnBreak(false);
          }
        }
      } catch (error) {
        console.error('Error checking attendance status:', error);
        setIsClockedIn(false);
        setIsOnBreak(false);
      }
    };

    checkAttendanceStatus();

    // Check status periodically (every 30 seconds)
    const interval = setInterval(checkAttendanceStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Check if all required tasks are completed (using local state)
  const allRequiredTasksCompleted = tasks
    .filter(task => task.is_required)
    .every(task => localTaskCompletions[task.id] === true);

  // Can save signature if job started, not completed, clocked in, and not on break
  const canSaveSignature = jobStarted && !jobCompleted && isClockedIn && !isOnBreak;

  // Can complete job if signature exists (either saved to DB or pending), job started, not completed, all required tasks done, clocked in, and not on break
  const hasSignature = localSignature || pendingSignature;
  const canCompleteJob = hasSignature && jobStarted && !jobCompleted && allRequiredTasksCompleted && isClockedIn && !isOnBreak;

  const handleSignatureOK = (signatureData: string) => {
    if (!canSaveSignature) return;

    // Store signature locally, don't upload to database yet
    setPendingSignature(signatureData);
    setSignatureDate(new Date());
    setShowSignaturePad(false);
    setIsSignatureEmpty(true);
    setShowSignatureSavedModal(true);
    // Re-enable scrolling after saving signature
    onSignatureDrawingChange?.(false);
  };

  const handleToggleTask = (taskId: string) => {
    if (!jobStarted || jobCompleted) return;

    setLocalTaskCompletions(prev => ({
      ...prev,
      [taskId]: !prev[taskId]
    }));
  };

  const handleSignatureClear = () => {
    if (isWeb) {
      signatureRef.current?.clear();
    } else {
      signatureRef.current?.clearSignature();
    }
    setIsSignatureEmpty(true);
  };

  const handleSignatureBegin = () => {
    setIsSignatureEmpty(false);
  };

  const handleSignatureEnd = () => {
    // For web, check if signature is empty after drawing ends
    if (isWeb && signatureRef.current) {
      setIsSignatureEmpty(signatureRef.current.isEmpty());
    }
  };

  const handleSaveSignature = () => {
    if (!canSaveSignature) return;

    if (isWeb && signatureRef.current) {
      const signatureData = signatureRef.current.toDataURL();
      if (signatureData) {
        handleSignatureOK(signatureData);
      }
    }
  };

  const handleRetakeSignature = () => {
    if (!canSaveSignature) {
      alert('Cannot retake signature - job is already completed');
      return;
    }
    setLocalSignature(null);
    setPendingSignature(null);
    setSignatureDate(null);
    setShowSignaturePad(true);
    setIsSignatureEmpty(true);
    // Disable scrolling when signature pad opens
    onSignatureDrawingChange?.(true);
  };

  // Effect to manage scrolling based on signature pad visibility
  useEffect(() => {
    // Signature pad is shown when: no signature exists OR user is retaking signature
    const isSignaturePadVisible = !hasSignature || showSignaturePad;

    if (isSignaturePadVisible) {
      // Disable scrolling when signature pad is visible
      onSignatureDrawingChange?.(true);
    } else {
      // Re-enable scrolling when signature is captured and pad is hidden
      onSignatureDrawingChange?.(false);
    }

    // Cleanup: ensure scrolling is enabled when component unmounts
    return () => {
      onSignatureDrawingChange?.(false);
    };
  }, [hasSignature, showSignaturePad, onSignatureDrawingChange]);

  const handleCompleteJob = () => {
    if (!canCompleteJob) {
      if (!jobStarted) {
        alert('You must start the job before completing it');
      } else if (!hasSignature) {
        alert('Customer signature is required to complete the job');
      } else if (!allRequiredTasksCompleted) {
        alert('Please complete all required tasks before finishing the job');
      }
      return;
    }
    setShowCompleteJobModal(true);
  };

  const handleConfirmComplete = async () => {
    if (!technicianJobId) return;

    setCompleting(true);
    try {
      // Upload pending signature to database if exists (will create or update)
      if (pendingSignature) {
        const signatureResult = await uploadSignatureAndCreateRecord(
          technicianJobId,
          pendingSignature,
          customerName
        );

        if (signatureResult.error) {
          throw new Error(`Error saving signature: ${signatureResult.error.message}`);
        }

        // Clear pending signature after successful upload
        setPendingSignature(null);
        setLocalSignature(signatureResult.data?.signature_image_url || null);
      }

      // Update is_completed field in the database
      const { supabase } = await import('@/lib/supabase');
      const taskUpdatePromises = tasks.map(task =>
        supabase
          .from('job_tasks')
          .update({
            is_completed: localTaskCompletions[task.id]
          })
          .eq('id', task.id)
      );

      const taskUpdateResults = await Promise.all(taskUpdatePromises);
      const taskUpdateErrors = taskUpdateResults.filter(result => result.error);

      if (taskUpdateErrors.length > 0) {
        throw new Error('Failed to update task completion status');
      }

      // Update technician job status to COMPLETED
      // Note: Job status is automatically updated to COMPLETED by database trigger
      // when all technicians have completed their assignments
      const techJobResult = await updateTechnicianJobStatus(technicianJobId, 'COMPLETED');
      if (techJobResult.error) {
        throw new Error(techJobResult.error.message);
      }

      // Mark job as completed locally
      setLocalJobCompleted(true);

      setShowCompleteJobModal(false);
      setShowCongratulationsModal(true);

      // Notify parent component
      if (onJobCompleted) {
        onJobCompleted();
      }
    } catch (error: any) {
      alert(`Error completing job: ${error.message}`);
    } finally {
      setCompleting(false);
    }
  };

  // Determine which error to show (prioritized)
  const getErrorMessage = () => {
    if (jobCompleted) return null;

    // Priority 1: Not clocked in
    if (!isClockedIn) {
      return {
        icon: 'time-outline',
        title: 'Not Clocked In',
        message: 'You must clock in before you can add a signature or complete the job.',
      };
    }

    // Priority 2: On break
    if (isOnBreak) {
      return {
        icon: 'cafe-outline',
        title: 'On Break',
        message: 'You cannot add a signature or complete the job while on break.',
      };
    }

    // Priority 3: Job not started
    if (!jobStarted) {
      return {
        icon: 'warning-outline',
        title: 'Job Not Started',
        message: 'You must start this job before you can add a signature or complete it.',
      };
    }

    // Priority 4: Missing signature (only if job is started)
    if (!hasSignature) {
      return {
        icon: 'create-outline',
        title: 'Signature Required',
        message: 'Customer signature is required to complete the job.',
      };
    }

    // Priority 5: Incomplete required tasks
    if (!allRequiredTasksCompleted) {
      return {
        icon: 'checkmark-done-outline',
        title: 'Required Tasks Incomplete',
        message: 'Please complete all required tasks before finishing the job.',
      };
    }

    return null;
  };

  const errorMessage = getErrorMessage();

  const style = `.m-signature-pad {
    box-shadow: none;
    border: none;
  }
  .m-signature-pad--body {
    border: none;
  }
  .m-signature-pad--footer {
    display: none;
  }
  body,html {
    width: 100%;
    height: 100%;
    touch-action: none;
  }
  canvas {
    touch-action: none;
  }`;

  if (tasksLoading || completionsLoading || equipmentsLoading || signatureLoading) {
    return (
      <View className="items-center justify-center py-20">
        <ActivityIndicator size="large" color="#0092ce" />
        <Text className="text-slate-400 text-base mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View>
      {/* Error Message (Prioritized - Only one at a time) */}
      {errorMessage && (
        <View className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <View className="flex-row items-start">
            <Ionicons name={errorMessage.icon as any} size={24} color="#f59e0b" />
            <View className="ml-3 flex-1">
              <Text className="text-amber-900 font-semibold mb-1">{errorMessage.title}</Text>
              <Text className="text-amber-700 text-sm">
                {errorMessage.message}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Service Checklist Section - Only show if there are tasks */}
      {tasks.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="checkmark-done-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Service Checklist</Text>
          </View>
          {tasks.map((task) => {
            const isCompleted = localTaskCompletions[task.id] || false;
            const canToggle = jobStarted && !jobCompleted;

            return (
              <View key={task.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start">
                  <TouchableOpacity
                    className="mr-3 mt-0.5"
                    onPress={() => handleToggleTask(task.id)}
                    disabled={!canToggle}
                  >
                    <Ionicons
                      name={isCompleted ? 'checkmark-circle' : 'ellipse-outline'}
                      size={24}
                      color={isCompleted ? '#77DD77' : '#94a3b8'}
                    />
                  </TouchableOpacity>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text
                        className="text-base text-slate-800 flex-1"
                        style={isCompleted ? { textDecorationLine: 'line-through', color: '#94a3b8' } : undefined}
                      >
                        {task.task_name}
                      </Text>
                      {task.is_required && (
                        <View className="bg-red-100 px-2 py-1 rounded">
                          <Text className="text-xs font-medium text-red-700">Required</Text>
                        </View>
                      )}
                    </View>
                    {task.task_description && (
                      <Text
                        className="text-sm text-slate-600 mb-2"
                        style={isCompleted ? { textDecorationLine: 'line-through', color: '#94a3b8' } : undefined}
                      >
                        {task.task_description}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Equipments Section - Only show if there are equipments */}
      {jobEquipments.length > 0 && (
        <View className="mb-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="construct-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Equipments Used</Text>
          </View>
          {jobEquipments.map((jobEquipment) => {
            const equipment = jobEquipment.equipment;
            if (!equipment) return null;

            return (
              <View key={jobEquipment.id} className="bg-white rounded-xl p-4 mb-3 shadow-sm">
                <View className="flex-row items-start">
                  <View className="mr-3">
                    <Ionicons name="hardware-chip-outline" size={24} color="#0092ce" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-base font-semibold text-slate-800 mb-1">
                      {equipment.item_name}
                    </Text>
                    {equipment.model_series && (
                      <Text className="text-sm text-slate-600 mb-1">Model: {equipment.model_series}</Text>
                    )}
                    {equipment.serial_number && (
                      <Text className="text-sm text-slate-600">S/N: {equipment.serial_number}</Text>
                    )}
                    {jobEquipment.quantity_used > 1 && (
                      <Text className="text-xs text-slate-500 mt-1">Quantity: {jobEquipment.quantity_used}</Text>
                    )}
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Customer Signature Section */}
      <View className="mb-6">
        <View className="flex-row items-center mb-4">
          <Ionicons name="create-outline" size={24} color="#0092ce" />
          <Text className="text-lg font-semibold text-slate-800 ml-2">Customer Signature</Text>
        </View>
        <View className="bg-white rounded-xl p-4 shadow-sm">
          {!hasSignature || showSignaturePad ? (
            <View>
              {/* Signature Canvas */}
              <View className="border-2 border-slate-300 rounded-xl overflow-hidden mb-4" style={{ height: 250 }}>
                {isWeb ? (
                  <SignatureCanvas
                    ref={signatureRef}
                    onBegin={handleSignatureBegin}
                    onEnd={handleSignatureEnd}
                    penColor="black"
                    minWidth={0.5}
                    maxWidth={2.5}
                    dotSize={1}
                    velocityFilterWeight={0.5}
                    throttle={8}
                    canvasProps={{
                      className: 'signature-canvas',
                      style: { width: '100%', height: '100%', touchAction: 'none' }
                    }}
                  />
                ) : (
                  <SignatureScreen
                    ref={signatureRef}
                    onOK={handleSignatureOK}
                    onBegin={handleSignatureBegin}
                    onEnd={handleSignatureEnd}
                    webStyle={style}
                    descriptionText="Sign above"
                    minWidth={0.5}
                    maxWidth={2.5}
                    penColor="black"
                    // throttle={8}
                  />
                )}
              </View>
              {/* Action Buttons */}
              <View className="flex-row space-x-2">
                <TouchableOpacity
                  onPress={handleSignatureClear}
                  className="flex-1 bg-slate-200 rounded-lg py-2 px-4 flex-row items-center justify-center mr-2"
                  disabled={!canSaveSignature || isSignatureEmpty}
                  style={{ opacity: canSaveSignature && !isSignatureEmpty ? 1 : 0.5 }}
                >
                  <Ionicons name="trash-outline" size={18} color="#475569" />
                  <Text className="text-slate-700 font-medium ml-2">Clear</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={isWeb ? handleSaveSignature : () => signatureRef.current?.readSignature()}
                  className="flex-1 bg-[#0092ce] rounded-lg py-2 px-4 flex-row items-center justify-center"
                  disabled={!canSaveSignature || isSignatureEmpty}
                  style={{ opacity: canSaveSignature && !isSignatureEmpty ? 1 : 0.5 }}
                >
                  <Ionicons name="checkmark" size={18} color="#fff" />
                  <Text className="text-white font-medium ml-2">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              {/* Display Captured Signature */}
              <View className="border-2 border-slate-300 rounded-xl overflow-hidden mb-4" style={{ height: 200 }}>
                <Image
                  source={{ uri: (pendingSignature || localSignature) as string }}
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>

              {/* Signature Date */}
              {signatureDate && (
                <View className="flex-row items-center mb-3">
                  <Ionicons name="time-outline" size={16} color="#64748b" />
                  <Text className="text-sm text-slate-600 ml-2">
                    Signed on {formatDateTime(signatureDate)}
                  </Text>
                </View>
              )}

              {/* Retake Signature Button */}
              <TouchableOpacity
                onPress={handleRetakeSignature}
                className="bg-slate-200 rounded-lg py-2 px-4 flex-row items-center justify-center"
                disabled={!canSaveSignature}
                style={{ opacity: canSaveSignature ? 1 : 0.5 }}
              >
                <Ionicons name="refresh" size={18} color="#475569" />
                <Text className="text-slate-700 font-medium ml-2">Retake Signature</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {/* Complete Job Button */}
      <TouchableOpacity
        onPress={handleCompleteJob}
        className="rounded-xl py-4 items-center justify-center flex-row mb-6"
        disabled={!canCompleteJob}
        style={{ opacity: canCompleteJob ? 1 : 0.5, backgroundColor: '#77DD77' }}
      >
        <Ionicons name="checkmark-done-circle" size={24} color="#fff" />
        <Text className="text-white font-semibold text-lg ml-2">Complete Job</Text>
      </TouchableOpacity>

      {/* Signature Saved Modal */}
      <SuccessModal
        visible={showSignatureSavedModal}
        title="Success"
        message="Signature saved successfully"
        buttonText="OK"
        onClose={() => setShowSignatureSavedModal(false)}
      />

      {/* Complete Job Confirmation Modal */}
      <Modal
        visible={showCompleteJobModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !completing && setShowCompleteJobModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <Text className="text-2xl font-bold text-slate-800 mb-4">Complete Job</Text>
            <Text className="text-base text-slate-600 mb-4">
              Are you sure you want to complete this job?
            </Text>

            <Text className="text-sm font-semibold text-slate-700 mb-2">Please note:</Text>
            <View className="mb-6">
              <View className="flex-row items-start mb-2">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">This action cannot be undone</Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">You won't be able to edit job after completion</Text>
              </View>
              <View className="flex-row items-start">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">All data will be finalized</Text>
              </View>
            </View>

            <View className="flex-row">
              <TouchableOpacity
                onPress={() => setShowCompleteJobModal(false)}
                className="flex-1 bg-slate-200 rounded-xl py-3 items-center mr-3"
                disabled={completing}
              >
                <Text className="text-slate-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmComplete}
                className="flex-1 rounded-xl py-3 items-center"
                disabled={completing}
                style={{ opacity: completing ? 0.5 : 1, backgroundColor: '#77DD77' }}
              >
                {completing ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text className="text-white font-semibold">Complete</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Congratulations Modal */}
      <Modal
        visible={showCongratulationsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCongratulationsModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center px-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-4">
              <Ionicons name="checkmark-circle" size={64} color="#77DD77" />
            </View>
            <Text className="text-2xl font-bold text-slate-800 mb-4 text-center">Congratulations!</Text>
            <Text className="text-base text-slate-600 mb-4 text-center">
              Job has been successfully completed.
            </Text>

            <Text className="text-sm font-semibold text-slate-700 mb-2">Important:</Text>
            <View className="mb-6">
              <View className="flex-row items-start mb-2">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">All job details are now finalized</Text>
              </View>
              <View className="flex-row items-start mb-2">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">You can view this job in your completed jobs history</Text>
              </View>
              {/* <View className="flex-row items-start">
                <Text className="text-slate-600 mr-2">•</Text>
                <Text className="text-sm text-slate-600 flex-1">A confirmation email will be sent to all relevant parties</Text>
              </View> */}
            </View>

            <TouchableOpacity
              onPress={() => setShowCongratulationsModal(false)}
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
