import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal, Image, Alert, ActivityIndicator, Platform, Pressable, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import DateTimePicker from '@react-native-community/datetimepicker';
import { JobTask, Followup, JobImage } from '@/types';
import { getTasksByJobId, createJobTask } from '@/services/jobTasks.service';
import { getFollowupsByJobId, createFollowup } from '@/services/followups.service';
import { getImagesByJobId, uploadMediaAndCreateRecord } from '@/services/jobImages.service';
import { getTechnicianJobById, updateServiceReportSubmission } from '@/services/technicianJobs.service';
import { checkClockInStatus, getTechnicianStatus } from '@/services/attendance.service';
import { useAuthStore, useServiceTabStore } from '@/store';
import { formatDate, formatDateTime } from '@/utils/dateFormat';

interface Task extends JobTask {
  isNew?: boolean; // Flag to identify newly added tasks (not yet saved to backend)
}

interface FollowUp extends Omit<Followup, 'technician'> {
  isNew?: boolean; // Flag to identify newly added followups (not yet saved to backend)
}

interface ServiceImage extends JobImage {
  isNew?: boolean; // Flag to identify newly added media (not yet saved to backend)
  localUri?: string; // Store local URI for upload
  fileExtension?: string; // Store file extension for proper upload
}

interface ServiceTabProps {
  jobId: string;
  technicianJobId: string | null;
  onSubmit: () => void;
  isHistoryJob: boolean;
  isJobStarted: boolean;
}

export default function ServiceTab({ jobId, technicianJobId, onSubmit, isHistoryJob, isJobStarted }: ServiceTabProps) {
  const user = useAuthStore((state) => state.user);
  const { getDraft, saveDraft, clearDraft } = useServiceTabStore();

  // Service tab states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [images, setImages] = useState<ServiceImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [hasSubmittedReport, setHasSubmittedReport] = useState(false);

  // Attendance states
  const [isClockedIn, setIsClockedIn] = useState(false);
  const [isOnBreak, setIsOnBreak] = useState(false);

  // Task form states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDescription, setTaskDescription] = useState('');

  // Follow-up form states
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpType, setFollowUpType] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState('');
  const [followUpPriority, setFollowUpPriority] = useState<'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'>('NORMAL');
  const [followUpStatus, setFollowUpStatus] = useState<'ALL' | 'LOGGED' | 'IN_PROGRESS' | 'CLOSED' | 'CANCELLED' | 'COMPLETED' | 'OPEN'>('OPEN');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [editingFollowUpId, setEditingFollowUpId] = useState<string | null>(null);

  // Media form states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageDescription, setImageDescription] = useState('');
  const [selectedImages, setSelectedImages] = useState<Array<{ uri: string; type?: 'IMAGE' | 'VIDEO'; fileExtension?: string }>>([]);
  const [selectedMediaType, setSelectedMediaType] = useState<'IMAGE' | 'VIDEO'>('IMAGE');
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  // Fetch existing data on mount
  useEffect(() => {
    const fetchData = async () => {
      // Guard: Don't fetch if jobId is not valid
      if (!jobId || jobId === 'undefined') {
        console.warn('ServiceTab: Invalid jobId, skipping data fetch. jobId:', jobId);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        console.log('ServiceTab: Fetching data for jobId:', jobId);

        // Fetch tasks from backend
        const tasksResult = await getTasksByJobId(jobId);
        const backendTasks = tasksResult.error || !tasksResult.data ? [] : tasksResult.data.map(task => ({ ...task, isNew: false }));

        // Fetch followups from backend
        const followupsResult = await getFollowupsByJobId(jobId);
        const backendFollowups = followupsResult.error || !followupsResult.data ? [] : followupsResult.data.map(followup => ({ ...followup, isNew: false }));

        // Fetch images from backend
        const imagesResult = await getImagesByJobId(jobId);
        const backendImages = imagesResult.error || !imagesResult.data ? [] : imagesResult.data.map(image => ({ ...image, isNew: false }));

        // Load draft data (newly added items that haven't been submitted)
        const draft = getDraft(jobId);

        // Merge backend data with draft data (draft items are new, unsaved items)
        setTasks([...backendTasks, ...draft.tasks]);
        setFollowUps([...backendFollowups, ...draft.followups]);
        setImages([...backendImages, ...draft.images]);

        // Fetch service report submission status from technician_jobs table
        if (technicianJobId) {
          const technicianJobResult = await getTechnicianJobById(technicianJobId);
          if (!technicianJobResult.error && technicianJobResult.data) {
            setHasSubmittedReport(technicianJobResult.data.is_service_report_submitted ?? false);
          }
        } else {
          // If no technician job ID, default to false
          setHasSubmittedReport(false);
        }
      } catch (error) {
        console.error('Error fetching service data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [jobId, technicianJobId, getDraft]);

  // Save draft whenever tasks, followups, or images change (only new items)
  useEffect(() => {
    if (!jobId || jobId === 'undefined' || loading) return;

    // Filter only new items (not yet saved to backend)
    const draftTasks = tasks.filter(task => task.isNew);
    const draftFollowups = followUps.filter(followup => followup.isNew);
    const draftImages = images.filter(image => image.isNew);

    // Save draft to store
    saveDraft(jobId, {
      tasks: draftTasks,
      followups: draftFollowups,
      images: draftImages,
    });
  }, [tasks, followUps, images, jobId, loading, saveDraft]);

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

    // Optionally, check status periodically (every 30 seconds)
    const interval = setInterval(checkAttendanceStatus, 30000);

    return () => clearInterval(interval);
  }, [user]);

  // Task handlers
  const handleAddTask = () => {
    if (taskTitle.trim()) {
      const newTask: Task = {
        id: `temp_${Date.now()}`, // Temporary ID for frontend
        job_id: jobId,
        task_name: taskTitle,
        task_description: taskDescription || null,
        task_order: tasks.length,
        is_required: false,
        is_completed: false,
        isNew: true, // Mark as new (not yet saved to backend)
      };
      setTasks([...tasks, newTask]);
      setTaskTitle('');
      setTaskDescription('');
      setShowTaskForm(false);
    }
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };

  // Follow-up handlers
  const handleAddFollowUp = () => {
    if (followUpTitle.trim()) {
      if (!user) return;

      if (editingFollowUpId) {
        // Update existing follow-up
        setFollowUps(followUps.map(followUp =>
          followUp.id === editingFollowUpId
            ? {
                ...followUp,
                type: followUpType || null,
                status: followUpStatus || null,
                priority: followUpPriority || null,
                notes: followUpTitle.trim() || null,
                due_date: followUpDueDate || null,
                updated_at: new Date().toISOString(),
              }
            : followUp
        ));
        setEditingFollowUpId(null);
      } else {
        // Add new follow-up
        const newFollowUp: FollowUp = {
          id: `temp_${Date.now()}`, // Temporary ID for frontend
          job_id: jobId,
          user_id: user.id,
          technician_id: null,
          type: followUpType || null,
          status: followUpStatus || null,
          priority: followUpPriority || null,
          notes: followUpTitle.trim() || null,
          due_date: followUpDueDate || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          deleted_at: null,
          isNew: true, // Mark as new (not yet saved to backend)
        };
        setFollowUps([...followUps, newFollowUp]);
      }
      setFollowUpTitle('');
      setFollowUpType('');
      setFollowUpDueDate('');
      setFollowUpPriority('NORMAL');
      setFollowUpStatus('OPEN');
      setShowDatePicker(false);
      setSelectedDate(new Date());
      setShowFollowUpForm(false);
    }
  };

  const handleEditFollowUp = (followUp: FollowUp) => {
    setEditingFollowUpId(followUp.id);
    setFollowUpTitle(followUp.notes || '');
    setFollowUpType(followUp.type || '');
    setFollowUpDueDate(followUp.due_date || '');
    setFollowUpPriority((followUp as any).priority || 'NORMAL');
    setFollowUpStatus((followUp as any).status || 'OPEN');
    if (followUp.due_date) {
      setSelectedDate(new Date(followUp.due_date));
    } else {
      setSelectedDate(new Date());
    }
    setShowFollowUpForm(true);
  };

  const handleDeleteFollowUp = (followUpId: string) => {
    setFollowUps(followUps.filter(followUp => followUp.id !== followUpId));
  };

  const handleToggleFollowUpStatus = (followUpId: string) => {
    setFollowUps(followUps.map(followUp =>
      followUp.id === followUpId
        ? {
            ...followUp,
            status: followUp.status === 'OPEN' ? 'COMPLETED' : 'OPEN',
            updated_at: new Date().toISOString(),
          }
        : followUp
    ));
  };

  // Media handlers
  const handlePickMedia = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant permission to access your media library');
        return;
      }

      const mediaTypes = selectedMediaType === 'VIDEO'
        ? ImagePicker.MediaTypeOptions.Videos
        : ImagePicker.MediaTypeOptions.Images;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsMultipleSelection: selectedMediaType === 'IMAGE', // Allow multiple selection only for images
        allowsEditing: false, // Disable editing when selecting multiple
        quality: selectedMediaType === 'IMAGE' ? 0.8 : 0.7, // Slightly lower quality for videos
        videoMaxDuration: 60, // Max 60 seconds for videos
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const newSelectedImages = result.assets.map(asset => {
          // Extract file extension from URI
          const uriParts = asset.uri.split('.');
          const fileExtension = uriParts[uriParts.length - 1].toLowerCase();

          return {
            uri: asset.uri,
            type: asset.type === 'video' ? 'VIDEO' as const : 'IMAGE' as const,
            fileExtension,
          };
        });

        setSelectedImages(newSelectedImages);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media');
    }
  };

  const handleAddImage = () => {
    if (selectedImages.length > 0 && imageDescription.trim()) {
      if (!user) return;

      // Create a new image entry for each selected image with the same description
      const newImages: ServiceImage[] = selectedImages.map((selectedImage, index) => ({
        id: `temp_${Date.now()}_${index}`, // Unique temporary ID for each image
        job_id: jobId,
        technician_job_id: null,
        image_url: selectedImage.uri, // Local URI for preview
        description: imageDescription,
        media_type: selectedImage.type || 'IMAGE', // Set media type
        created_by: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        isNew: true, // Mark as new (not yet saved to backend)
        localUri: selectedImage.uri, // Store local URI for upload
        fileExtension: selectedImage.fileExtension, // Store file extension
      }));

      setImages([...images, ...newImages]);
      setImageDescription('');
      setSelectedImages([]);
      setSelectedMediaType('IMAGE'); // Reset to IMAGE
      setShowImageModal(false);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setImages(images.filter(image => image.id !== imageId));
  };

  // Check if service report has content (at least one of: tasks, followups, or images)
  const hasServiceReportContent = tasks.length > 0 || followUps.length > 0 || images.length > 0;

  // Submit service report handler
  const handleSubmitServiceReport = async () => {
    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    if (!hasServiceReportContent) {
      Alert.alert('Error', 'Please add at least one task, follow-up, or image before submitting');
      return;
    }

    try {
      setSubmitting(true);

      // Save new tasks to backend
      const newTasks = tasks.filter(task => task.isNew);
      for (const task of newTasks) {
        const { id, isNew, ...taskData } = task; // Remove temporary fields
        const result = await createJobTask(taskData);
        if (result.error) {
          console.error('Error creating task:', result.error);
          Alert.alert('Error', `Failed to save task: ${result.error.message}`);
          return;
        }
      }

      // Save new followups to backend
      const newFollowUps = followUps.filter(followUp => followUp.isNew);
      for (const followUp of newFollowUps) {
        const { id, isNew, ...followUpData } = followUp; // Remove temporary fields
        const result = await createFollowup(followUpData);
        if (result.error) {
          console.error('Error creating followup:', result.error);
          Alert.alert('Error', `Failed to save followup: ${result.error.message}`);
          return;
        }
      }

      // Upload new media (images/videos) to backend and save to database
      const newImages = images.filter(image => image.isNew);

      for (const image of newImages) {
        if (image.localUri) {
          const mediaType = image.media_type || 'IMAGE';
          const fileExtension = image.fileExtension || 'png';

          const result = await uploadMediaAndCreateRecord(
            jobId,
            null, // technician_job_id - can be set if needed
            image.localUri, // Pass the local URI instead of base64
            image.description,
            user.id,
            mediaType,
            fileExtension
          );
          if (result.error) {
            console.error(`Error uploading ${mediaType}:`, result.error);
            Alert.alert('Error', `Failed to upload ${mediaType}: ${result.error.message}`);
            return;
          }
          console.log(`${mediaType} uploaded and saved successfully:`, result.data);
        }
      }

      // Update service report submission status in technician_jobs table
      if (technicianJobId) {
        const updateResult = await updateServiceReportSubmission(technicianJobId, true);
        if (updateResult.error) {
          console.error('Error updating service report submission status:', updateResult.error);
          Alert.alert('Warning', 'Service report saved but failed to update submission status');
        } else {
          console.log('Service report submission status updated successfully');
        }
      }

      // Mark report as submitted
      setHasSubmittedReport(true);

      // Clear draft after successful submission
      clearDraft(jobId);

      Alert.alert('Success', 'Service report submitted successfully', [
        { text: 'OK', onPress: onSubmit }
      ]);
    } catch (error: any) {
      console.error('Error submitting service report:', error);
      Alert.alert('Error', error.message || 'Failed to submit service report');
    } finally {
      setSubmitting(false);
    }
  };

  // Determine which error to show (prioritized)
  const getErrorMessage = () => {
    if (isHistoryJob || hasSubmittedReport) return null;

    // Priority 1: Not clocked in
    if (!isClockedIn) {
      return {
        icon: 'time-outline',
        title: 'Not Clocked In',
        message: 'You must clock in before submitting a service report',
      };
    }

    // Priority 2: On break
    if (isOnBreak) {
      return {
        icon: 'cafe-outline',
        title: 'On Break',
        message: 'You cannot submit a service report while on break',
      };
    }

    // Priority 3: Job not started
    if (!isJobStarted) {
      return {
        icon: 'warning-outline',
        title: 'Job Not Started',
        message: 'You must start this job before you can add tasks, follow-ups, or images.',
      };
    }

    // Priority 4: No content
    if (!hasServiceReportContent) {
      return {
        icon: 'information-circle-outline',
        title: 'No Content',
        message: 'Add at least one task, follow-up, or media to submit the service report',
      };
    }

    return null;
  };

  const errorMessage = getErrorMessage();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <ActivityIndicator size="large" color="#0092ce" />
        <Text className="text-slate-500 mt-4">Loading service data...</Text>
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

      {/* Tasks Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="clipboard-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Tasks</Text>
          </View>
          {!isHistoryJob && !hasSubmittedReport && isJobStarted && (
            <TouchableOpacity
              onPress={() => setShowTaskForm(!showTaskForm)}
              className="w-8 h-8 rounded-full bg-[#0092ce] items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Task Form */}
        {showTaskForm && (
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <TextInput
              className="border border-slate-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Task title"
              value={taskTitle}
              onChangeText={setTaskTitle}
            />
            <TextInput
              className="border border-slate-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Task description (optional)"
              value={taskDescription}
              onChangeText={setTaskDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                onPress={() => {
                  setShowTaskForm(false);
                  setTaskTitle('');
                  setTaskDescription('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 mr-2"
              >
                <Text className="text-slate-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddTask}
                className="px-4 py-2 rounded-lg bg-[#0092ce]"
              >
                <Text className="text-white font-medium">Add Task</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Task List */}
        {tasks.length === 0 && !showTaskForm ? (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <Ionicons name="list-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-2">No tasks added yet</Text>
          </View>
        ) : (
          tasks.map((task) => (
            <View
              key={task.id}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-start justify-between">
                {task.is_completed && (
                  <View className="mr-3 mt-0.5">
                    <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                  </View>
                )}
                <View className="flex-1">
                  <Text
                    className="text-base font-semibold text-slate-800 mb-1"
                    style={task.is_completed ? { textDecorationLine: 'line-through', color: '#94a3b8' } : undefined}
                  >
                    {task.task_name}
                  </Text>
                  {task.task_description && (
                    <Text
                      className="text-sm text-slate-600 mb-2"
                      style={task.is_completed ? { textDecorationLine: 'line-through', color: '#94a3b8' } : undefined}
                    >
                      {task.task_description}
                    </Text>
                  )}
                  {/* <Text className="text-xs text-slate-500">
                    {task.is_required ? 'Required' : 'Optional'}
                  </Text> */}
                </View>
                {/* Show delete button only for newly added tasks and report not submitted */}
                {task.isNew && !isHistoryJob && !hasSubmittedReport && (
                  <TouchableOpacity
                    onPress={() => handleDeleteTask(task.id)}
                    className="ml-3 bg-red-500 rounded-full p-2"
                  >
                    <Ionicons name="trash-outline" size={18} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))
        )}
      </View>

      {/* Follow-ups Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="flag-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Follow Ups</Text>
          </View>
          {!isHistoryJob && !hasSubmittedReport && isJobStarted && (
            <TouchableOpacity
              onPress={() => setShowFollowUpForm(!showFollowUpForm)}
              className="w-8 h-8 rounded-full bg-[#0092ce] items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Follow-up Form */}
        {showFollowUpForm && (
          <View className="bg-white rounded-xl p-4 mb-3 shadow-sm">
            <TextInput
              className="border border-slate-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Follow-up description"
              value={followUpTitle}
              onChangeText={setFollowUpTitle}
            />
            <View className="mb-3">
              <Text className="text-sm text-slate-600 mb-2">Type</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                {[
                  'appointment',
                  'repair',
                  'contract',
                  'verify customer',
                  'closed',
                  'done',
                  'a new task is created!',
                  'new!',
                  'break'
                ].map((type) => (
                  <TouchableOpacity
                    key={type}
                    onPress={() => setFollowUpType(type)}
                    className={`px-4 py-2 rounded-full mr-2 ${
                      followUpType === type ? 'bg-[#0092ce]' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`font-medium text-sm ${
                        followUpType === type ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            <View className="mb-3">
              <Text className="text-sm text-slate-600 mb-2">Due Date</Text>
              <TouchableOpacity
                onPress={() => setShowDatePicker(true)}
                className="border border-slate-300 rounded-lg px-4 py-3 flex-row justify-between items-center"
              >
                <Text className={followUpDueDate ? 'text-slate-800' : 'text-slate-400'}>
                  {followUpDueDate || 'Select date...'}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#64748b" />
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    setShowDatePicker(Platform.OS === 'ios');
                    if (date) {
                      setSelectedDate(date);
                      // Format date as YYYY-MM-DD
                      const year = date.getFullYear();
                      const month = String(date.getMonth() + 1).padStart(2, '0');
                      const day = String(date.getDate()).padStart(2, '0');
                      setFollowUpDueDate(`${year}-${month}-${day}`);
                    }
                  }}
                />
              )}
            </View>
            <View className="mb-3">
              <Text className="text-sm text-slate-600 mb-2">Priority</Text>
              <View className="flex-row space-x-2">
                {(['LOW', 'NORMAL', 'HIGH', 'URGENT'] as const).map((priority) => (
                  <TouchableOpacity
                    key={priority}
                    onPress={() => setFollowUpPriority(priority as any)}
                    className={`flex-1 py-2 rounded-lg ${
                      followUpPriority === priority ? 'bg-[#0092ce]' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium text-xs ${
                        followUpPriority === priority ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {priority}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="mb-3">
              <Text className="text-sm text-slate-600 mb-2">Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {(['OPEN', 'LOGGED', 'IN_PROGRESS', 'CLOSED', 'CANCELLED', 'COMPLETED'] as const).map((status) => (
                  <TouchableOpacity
                    key={status}
                    onPress={() => setFollowUpStatus(status)}
                    className={`px-3 py-2 rounded-lg ${
                      followUpStatus === status ? 'bg-[#0092ce]' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium text-xs ${
                        followUpStatus === status ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {status.replace('_', ' ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-row justify-end">
              <TouchableOpacity
                onPress={() => {
                  setShowFollowUpForm(false);
                  setFollowUpTitle('');
                  setFollowUpType('');
                  setFollowUpDueDate('');
                  setFollowUpPriority('NORMAL');
                  setFollowUpStatus('OPEN');
                  setShowDatePicker(false);
                  setSelectedDate(new Date());
                  setEditingFollowUpId(null);
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 mr-2"
              >
                <Text className="text-slate-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFollowUp}
                className="px-4 py-2 rounded-lg bg-[#0092ce]"
              >
                <Text className="text-white font-medium">{editingFollowUpId ? 'Update Follow-up' : 'Add Follow-up'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Follow-up List */}
        {followUps.length === 0 && !showFollowUpForm ? (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <Ionicons name="calendar-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-2">No follow-ups added yet</Text>
          </View>
        ) : (
          followUps.map((followUp) => (
            <View key={followUp.id} className="bg-white rounded-xl mb-3 shadow-sm overflow-hidden">
              <View className="flex-row">
                <View className="w-1 bg-[#0092ce]" />
                <View className="flex-1 p-4">
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-row flex-wrap">
                      {/* Status Badge */}
                      <View
                        style={{
                          backgroundColor:
                            followUp.status === 'COMPLETED' ? '#77DD77' :
                            followUp.status === 'CLOSED' ? '#77DD77' :
                            followUp.status === 'IN_PROGRESS' ? '#6A89CC' :
                            followUp.status === 'LOGGED' ? '#FFD580' :
                            followUp.status === 'CANCELLED' ? '#FF6961' :
                            followUp.status === 'OPEN' ? '#FFD580' : '#FFD580'
                        }}
                        className="px-3 py-1.5 rounded-lg mr-2 mb-2"
                      >
                        <Text className="text-xs font-medium text-white">
                          {followUp.status ? followUp.status.replace('_', ' ') : 'OPEN'}
                        </Text>
                      </View>
                      {/* Priority Badge */}
                      <View
                        style={{
                          backgroundColor: followUp.priority === 'URGENT' ? '#FF6961' :
                            followUp.priority === 'HIGH' ? '#FF6961' :
                            followUp.priority === 'NORMAL' ? '#6A89CC' : '#77DD77'
                        }}
                        className="px-3 py-1.5 rounded-lg mb-2"
                      >
                        <Text className="text-xs font-medium text-white">
                          {followUp.priority || 'MEDIUM'}
                        </Text>
                      </View>
                    </View>
                    {/* Show edit and delete buttons only for newly added followups and report not submitted */}
                    {followUp.isNew && !isHistoryJob && !hasSubmittedReport && (
                      <View className="flex-row">
                        <TouchableOpacity
                          onPress={() => handleEditFollowUp(followUp)}
                          className="bg-[#0092ce] rounded-full p-2 mr-2"
                        >
                          <Ionicons name="pencil-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteFollowUp(followUp.id)}
                          className="bg-red-500 rounded-full p-2"
                        >
                          <Ionicons name="trash-outline" size={18} color="#fff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Type */}
                  {followUp.type && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="pricetag-outline" size={16} color="#64748b" />
                      <Text className="text-sm text-slate-600 ml-1">Type: {followUp.type}</Text>
                    </View>
                  )}

                  {/* Notes */}
                  {followUp.notes && (
                    <View className="mb-2 bg-slate-50 rounded-lg p-3">
                      <View className="flex-row items-start mb-1">
                        <Ionicons name="document-text-outline" size={16} color="#64748b" />
                        <Text className="text-xs font-semibold text-slate-700 ml-1">Notes:</Text>
                      </View>
                      <Text className="text-sm text-slate-600 ml-5">{followUp.notes}</Text>
                    </View>
                  )}

                  {/* Due Date */}
                  {followUp.due_date && (
                    <View className="flex-row items-center mb-2">
                      <Ionicons name="calendar-outline" size={16} color="#64748b" />
                      <Text className="text-sm text-slate-600 ml-1">
                        Due: {formatDate(followUp.due_date)}
                      </Text>
                    </View>
                  )}

                  {/* Created Date */}
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-500 ml-1">
                      Created: {formatDateTime(followUp.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Media Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="videocam-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Media</Text>
          </View>
          {!isHistoryJob && !hasSubmittedReport && isJobStarted && (
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              className="w-8 h-8 rounded-full bg-[#0092ce] items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Media List */}
        {images.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <Ionicons name="film-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-2">No media uploaded yet</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap">
            {images.map((image) => (
              <View key={image.id} className="w-1/2 p-1">
                <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {/* Media Preview with Delete Button */}
                  <View className="bg-slate-200 h-32 items-center justify-center relative">
                    {image.image_url ? (
                      image.media_type === 'VIDEO' ? (
                        <Video
                          source={{ uri: image.image_url }}
                          className="w-full h-full"
                          resizeMode={ResizeMode.COVER}
                          shouldPlay={false}
                          useNativeControls
                        />
                      ) : (
                        <TouchableOpacity
                          onPress={() => setExpandedImage(image.image_url)}
                          activeOpacity={0.8}
                          className="w-full h-full"
                        >
                          <Image
                            source={{ uri: image.image_url }}
                            className="w-full h-full"
                            resizeMode="cover"
                          />
                        </TouchableOpacity>
                      )
                    ) : (
                      <Ionicons name={image.media_type === 'VIDEO' ? 'videocam' : 'image'} size={48} color="#94a3b8" />
                    )}
                    {/* Media type badge */}
                    {image.media_type === 'VIDEO' && image.image_url && (
                      <View className="absolute top-2 left-2 bg-black/60 rounded-full px-2 py-1">
                        <Ionicons name="play" size={12} color="#fff" />
                      </View>
                    )}
                    {/* Show delete button only for newly added media and report not submitted */}
                    {image.isNew && !isHistoryJob && !hasSubmittedReport && (
                      <TouchableOpacity
                        onPress={() => handleDeleteImage(image.id)}
                        className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                        style={{ width: 28, height: 28 }}
                      >
                        <Ionicons name="trash" size={18} color="#fff" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Description and DateTime */}
                  <View className="p-3">
                    <Text className="text-xs text-slate-700 mb-2" numberOfLines={2}>
                      {image.description || 'No description'}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {formatDateTime(image.created_at)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Submit Button */}
      {!isHistoryJob && (
        <TouchableOpacity
          onPress={handleSubmitServiceReport}
          disabled={submitting || hasSubmittedReport || !hasServiceReportContent || !isClockedIn || isOnBreak || !isJobStarted}
          className={`rounded-xl py-4 items-center justify-center flex-row mb-6 ${
            submitting || hasSubmittedReport || !hasServiceReportContent || !isClockedIn || isOnBreak || !isJobStarted ? 'bg-slate-400' : 'bg-[#0092ce]'
          }`}
        >
          {submitting ? (
            <>
              <ActivityIndicator size="small" color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">Submitting...</Text>
            </>
          ) : hasSubmittedReport ? (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">Service Report Submitted</Text>
            </>
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text className="text-white font-semibold text-lg ml-2">Submit Service Report</Text>
            </>
          )}
        </TouchableOpacity>
      )}

      {/* Media Upload Modal */}
      <Modal
        visible={showImageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">Upload Media</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled={true}
              keyboardShouldPersistTaps="handled"
              scrollEventThrottle={16}
            >
              {/* Media Type Selector */}
              <Text className="text-sm font-semibold text-slate-700 mb-2">Media Type</Text>
              <View className="flex-row mb-4">
                <TouchableOpacity
                  onPress={() => setSelectedMediaType('IMAGE')}
                  className={`flex-1 py-3 rounded-lg mr-2 flex-row items-center justify-center ${
                    selectedMediaType === 'IMAGE' ? 'bg-[#0092ce]' : 'bg-slate-200'
                  }`}
                >
                  <Ionicons name="image" size={20} color={selectedMediaType === 'IMAGE' ? '#fff' : '#64748b'} />
                  <Text className={`ml-2 font-medium ${
                    selectedMediaType === 'IMAGE' ? 'text-white' : 'text-slate-700'
                  }`}>Image</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setSelectedMediaType('VIDEO')}
                  className={`flex-1 py-3 rounded-lg flex-row items-center justify-center ${
                    selectedMediaType === 'VIDEO' ? 'bg-[#0092ce]' : 'bg-slate-200'
                  }`}
                >
                  <Ionicons name="videocam" size={20} color={selectedMediaType === 'VIDEO' ? '#fff' : '#64748b'} />
                  <Text className={`ml-2 font-medium ${
                    selectedMediaType === 'VIDEO' ? 'text-white' : 'text-slate-700'
                  }`}>Video</Text>
                </TouchableOpacity>
              </View>

              {/* Media Picker */}
              <TouchableOpacity
                onPress={handlePickMedia}
                className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl items-center justify-center mb-4"
                style={{ minHeight: selectedImages.length > 0 ? 'auto' : 192 }}
              >
                {selectedImages.length > 0 ? (
                  <View className="w-full p-4">
                    <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="flex-row"
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                      {selectedImages.map((selectedImage, index) => (
                        <View key={index} className="mr-2 relative">
                          {selectedImage.type === 'VIDEO' ? (
                            <Video
                              source={{ uri: selectedImage.uri }}
                              style={{ width: 120, height: 120, borderRadius: 8 }}
                              resizeMode={ResizeMode.COVER}
                              shouldPlay={false}
                              useNativeControls
                            />
                          ) : (
                            <Image
                              source={{ uri: selectedImage.uri }}
                              style={{ width: 120, height: 120, borderRadius: 8 }}
                              resizeMode="cover"
                            />
                          )}
                          <View className="absolute bottom-1 right-1 bg-black/60 rounded-full px-2 py-1">
                            <Text className="text-white text-xs font-semibold">{index + 1}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                    <Text className="text-slate-600 text-sm mt-3 text-center">
                      {selectedImages.length} {selectedImages.length === 1 ? 'image' : 'images'} selected - Tap to change
                    </Text>
                  </View>
                ) : (
                  <View className="py-12 items-center">
                    <Ionicons name="cloud-upload-outline" size={48} color="#94a3b8" />
                    <Text className="text-slate-500 mt-2 text-center">
                      Tap to select {selectedMediaType === 'IMAGE' ? 'images (multiple)' : 'video'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Description */}
              <Text className="text-sm font-semibold text-slate-700 mb-2">
                Description {selectedImages.length > 1 && `(applies to all ${selectedImages.length} images)`}
              </Text>
              <TextInput
                className="border border-slate-300 rounded-lg px-4 py-3 mb-4"
                placeholder={selectedImages.length > 1
                  ? `Enter description for all ${selectedImages.length} images`
                  : `Enter ${selectedMediaType.toLowerCase()} description`}
                value={imageDescription}
                onChangeText={setImageDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 100 }}
              />

              {/* Buttons */}
              <View className="flex-row justify-end">
                <TouchableOpacity
                  onPress={() => {
                    setShowImageModal(false);
                    setImageDescription('');
                    setSelectedImages([]);
                    setSelectedMediaType('IMAGE');
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-200 mr-3"
                >
                  <Text className="text-slate-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleAddImage}
                  disabled={selectedImages.length === 0 || !imageDescription.trim()}
                  className={`px-6 py-3 rounded-lg flex-row items-center ${
                    selectedImages.length === 0 || !imageDescription.trim() ? 'bg-slate-400' : 'bg-[#0092ce]'
                  }`}
                >
                  <Ionicons name="add-circle" size={20} color="#fff" />
                  <Text className="text-white font-medium ml-2">
                    Add {selectedImages.length > 1 ? `${selectedImages.length} Images` : 'Media'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={expandedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setExpandedImage(null)}
      >
        <Pressable
          className="flex-1 bg-black/90"
          onPress={() => setExpandedImage(null)}
        >
          <View className="flex-1 justify-center items-center">
            {/* Close button */}
            <TouchableOpacity
              className="absolute top-12 right-4 z-10 bg-white/20 rounded-full p-2"
              onPress={() => setExpandedImage(null)}
            >
              <Ionicons name="close" size={32} color="#ffffff" />
            </TouchableOpacity>

            {/* Full-size image */}
            {expandedImage && (
              <View className="px-6 py-20">
                <Image
                  source={{ uri: expandedImage }}
                  style={{
                    width: Dimensions.get('window').width - 48,
                    height: Dimensions.get('window').height - 160,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}