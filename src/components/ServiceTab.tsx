import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  createdBy: string;
  createdAt: Date;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

interface FollowUp {
  id: string;
  title: string;
  dueDate: string;
  urgency: 'Low' | 'Medium' | 'High';
  status: 'Repair' | 'Logged';
  createdBy: string;
  createdAt: Date;
  lastUpdatedAt: Date;
  lastUpdatedBy: string;
}

interface ServiceImage {
  id: string;
  url: string;
  description: string;
  createdBy: string;
  createdAt: Date;
}

interface ServiceTabProps {
  onSubmit: () => void;
  isHistoryJob: boolean;
}

export default function ServiceTab({ onSubmit, isHistoryJob }: ServiceTabProps) {
  // Service tab states
  const [tasks, setTasks] = useState<Task[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [images, setImages] = useState<ServiceImage[]>([]);

  // Task form states
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');

  // Follow-up form states
  const [showFollowUpForm, setShowFollowUpForm] = useState(false);
  const [followUpTitle, setFollowUpTitle] = useState('');
  const [followUpDueDate, setFollowUpDueDate] = useState('');
  const [followUpUrgency, setFollowUpUrgency] = useState<'Low' | 'Medium' | 'High'>('Medium');

  // Image form states
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageDescription, setImageDescription] = useState('');

  // Task handlers
  const handleAddTask = () => {
    if (taskTitle.trim()) {
      const now = new Date();
      const newTask: Task = {
        id: Date.now().toString(),
        title: taskTitle,
        completed: false,
        createdBy: 'Current User', // Replace with actual user
        createdAt: now,
        lastUpdatedAt: now,
        lastUpdatedBy: 'Current User',
      };
      setTasks([...tasks, newTask]);
      setTaskTitle('');
      setShowTaskForm(false);
    }
  };

  const handleToggleTask = (taskId: string) => {
    setTasks(tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            completed: !task.completed,
            lastUpdatedAt: new Date(),
            lastUpdatedBy: 'Current User',
          }
        : task
    ));
  };

  // Follow-up handlers
  const handleAddFollowUp = () => {
    if (followUpTitle.trim() && followUpDueDate.trim()) {
      const now = new Date();
      const newFollowUp: FollowUp = {
        id: Date.now().toString(),
        title: followUpTitle,
        dueDate: followUpDueDate,
        urgency: followUpUrgency,
        status: 'Repair',
        createdBy: 'Current User', // Replace with actual user
        createdAt: now,
        lastUpdatedAt: now,
        lastUpdatedBy: 'Current User',
      };
      setFollowUps([...followUps, newFollowUp]);
      setFollowUpTitle('');
      setFollowUpDueDate('');
      setFollowUpUrgency('Medium');
      setShowFollowUpForm(false);
    }
  };

  const handleToggleFollowUpStatus = (followUpId: string) => {
    setFollowUps(followUps.map(followUp =>
      followUp.id === followUpId
        ? {
            ...followUp,
            status: followUp.status === 'Repair' ? 'Logged' : 'Repair',
            lastUpdatedAt: new Date(),
            lastUpdatedBy: 'Current User',
          }
        : followUp
    ));
  };

  // Image handlers
  const handleUploadImage = () => {
    // TODO: Implement Supabase storage upload
    // For now, just add a placeholder
    if (imageDescription.trim()) {
      const newImage: ServiceImage = {
        id: Date.now().toString(),
        url: 'https://via.placeholder.com/150', // Replace with actual uploaded URL
        description: imageDescription,
        createdBy: 'Current User',
        createdAt: new Date(),
      };
      setImages([...images, newImage]);
      setImageDescription('');
      setShowImageModal(false);
    }
  };

  const handleDeleteImage = (imageId: string) => {
    setImages(images.filter(image => image.id !== imageId));
  };

  return (
    <View>
      {/* Tasks Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="clipboard-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Tasks</Text>
          </View>
          {!isHistoryJob && (
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
            <View className="flex-row justify-end space-x-2">
              <TouchableOpacity
                onPress={() => {
                  setShowTaskForm(false);
                  setTaskTitle('');
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
            <TouchableOpacity
              key={task.id}
              onPress={() => handleToggleTask(task.id)}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
            >
              <View className="flex-row items-start">
                <View className="mr-3 mt-0.5">
                  <Ionicons
                    name={task.completed ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={task.completed ? '#22c55e' : '#94a3b8'}
                  />
                </View>
                <View className="flex-1">
                  <Text
                    className={`text-base mb-1 ${
                      task.completed ? 'text-slate-400 line-through' : 'text-slate-800'
                    }`}
                  >
                    {task.title}
                  </Text>
                  <Text className="text-xs text-slate-500 mb-1">
                    Created by {task.createdBy} at {task.createdAt.toLocaleString()}
                  </Text>
                  <Text className="text-xs text-slate-500">
                    Last updated {task.lastUpdatedAt.toLocaleString()} by {task.lastUpdatedBy}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
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
          {!isHistoryJob && (
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
              placeholder="Follow-up title"
              value={followUpTitle}
              onChangeText={setFollowUpTitle}
            />
            <TextInput
              className="border border-slate-300 rounded-lg px-4 py-3 mb-3"
              placeholder="Due date (e.g., 2024-12-31)"
              value={followUpDueDate}
              onChangeText={setFollowUpDueDate}
            />
            <View className="mb-3">
              <Text className="text-sm text-slate-600 mb-2">Urgency</Text>
              <View className="flex-row space-x-2">
                {(['Low', 'Medium', 'High'] as const).map((urgency) => (
                  <TouchableOpacity
                    key={urgency}
                    onPress={() => setFollowUpUrgency(urgency)}
                    className={`flex-1 py-2 rounded-lg ${
                      followUpUrgency === urgency ? 'bg-[#0092ce]' : 'bg-slate-200'
                    }`}
                  >
                    <Text
                      className={`text-center font-medium ${
                        followUpUrgency === urgency ? 'text-white' : 'text-slate-700'
                      }`}
                    >
                      {urgency}
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
                  setFollowUpDueDate('');
                }}
                className="px-4 py-2 rounded-lg bg-slate-200 mr-2"
              >
                <Text className="text-slate-700 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAddFollowUp}
                className="px-4 py-2 rounded-lg bg-[#0092ce]"
              >
                <Text className="text-white font-medium">Add Follow-up</Text>
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
                  {/* Status Buttons */}
                  <View className="flex-row mb-3">
                    <TouchableOpacity
                      onPress={() => handleToggleFollowUpStatus(followUp.id)}
                      className={`px-3 py-1.5 rounded-lg mr-2 ${
                        followUp.status === 'Repair' ? 'bg-red-500' : 'bg-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          followUp.status === 'Repair' ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        Repair
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleToggleFollowUpStatus(followUp.id)}
                      className={`px-3 py-1.5 rounded-lg ${
                        followUp.status === 'Logged' ? 'bg-[#0092ce]' : 'bg-slate-200'
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          followUp.status === 'Logged' ? 'text-white' : 'text-slate-600'
                        }`}
                      >
                        Logged
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Title */}
                  <Text className="text-base font-semibold text-slate-800 mb-3">
                    {followUp.title}
                  </Text>

                  {/* Due Date and Urgency */}
                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="calendar-outline" size={16} color="#64748b" />
                      <Text className="text-sm text-slate-600 ml-1">{followUp.dueDate}</Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons
                        name="alert-circle-outline"
                        size={16}
                        color={
                          followUp.urgency === 'High'
                            ? '#ef4444'
                            : followUp.urgency === 'Medium'
                            ? '#f59e0b'
                            : '#22c55e'
                        }
                      />
                      <Text
                        className="text-sm font-medium ml-1"
                        style={{
                          color:
                            followUp.urgency === 'High'
                              ? '#ef4444'
                              : followUp.urgency === 'Medium'
                              ? '#f59e0b'
                              : '#22c55e',
                        }}
                      >
                        {followUp.urgency}
                      </Text>
                    </View>
                  </View>

                  {/* Created By */}
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="person-outline" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-500 ml-1">
                      Created by: {followUp.createdBy}
                    </Text>
                  </View>

                  {/* Last Updated */}
                  <View className="flex-row items-center">
                    <Ionicons name="time-outline" size={14} color="#64748b" />
                    <Text className="text-xs text-slate-500 ml-1">
                      Last updated {followUp.lastUpdatedAt.toLocaleString()} by{' '}
                      {followUp.lastUpdatedBy}
                    </Text>
                  </View>
                </View>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Images Section */}
      <View className="mb-6">
        <View className="flex-row justify-between items-center mb-4">
          <View className="flex-row items-center">
            <Ionicons name="camera-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">Images</Text>
          </View>
          {!isHistoryJob && (
            <TouchableOpacity
              onPress={() => setShowImageModal(true)}
              className="w-8 h-8 rounded-full bg-[#0092ce] items-center justify-center"
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        {/* Image List */}
        {images.length === 0 ? (
          <View className="bg-white rounded-xl p-6 items-center justify-center">
            <Ionicons name="image-outline" size={48} color="#cbd5e1" />
            <Text className="text-slate-400 mt-2">No images uploaded yet</Text>
          </View>
        ) : (
          <View className="flex-row flex-wrap">
            {images.map((image) => (
              <View key={image.id} className="w-1/2 p-1">
                <View className="bg-white rounded-xl overflow-hidden shadow-sm">
                  {/* Image with Delete Button */}
                  <View className="bg-slate-200 h-32 items-center justify-center relative">
                    <Ionicons name="image" size={48} color="#94a3b8" />
                    <TouchableOpacity
                      onPress={() => handleDeleteImage(image.id)}
                      className="absolute top-2 right-2 bg-red-500 rounded-full p-1"
                      style={{ width: 28, height: 28 }}
                    >
                      <Ionicons name="trash" size={16} color="#fff" />
                    </TouchableOpacity>
                  </View>
                  {/* Description and DateTime */}
                  <View className="p-3">
                    <Text className="text-xs text-slate-700 mb-2" numberOfLines={2}>
                      {image.description}
                    </Text>
                    <Text className="text-xs text-slate-500">
                      {image.createdAt.toLocaleString()}
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
          onPress={onSubmit}
          className="bg-[#0092ce] rounded-xl py-4 items-center justify-center flex-row mb-6"
        >
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
          <Text className="text-white font-semibold text-lg ml-2">Submit Service Report</Text>
        </TouchableOpacity>
      )}

      {/* Image Upload Modal */}
      <Modal
        visible={showImageModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowImageModal(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6" style={{ maxHeight: '80%' }}>
            <View className="flex-row justify-between items-center mb-6">
              <Text className="text-xl font-bold text-slate-800">Upload Image</Text>
              <TouchableOpacity onPress={() => setShowImageModal(false)}>
                <Ionicons name="close" size={28} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {/* Image Picker Placeholder */}
              <TouchableOpacity className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-xl h-48 items-center justify-center mb-4">
                <Ionicons name="cloud-upload-outline" size={48} color="#94a3b8" />
                <Text className="text-slate-500 mt-2">Tap to select image</Text>
              </TouchableOpacity>

              {/* Description */}
              <Text className="text-sm font-semibold text-slate-700 mb-2">Description</Text>
              <TextInput
                className="border border-slate-300 rounded-lg px-4 py-3 mb-4"
                placeholder="Enter image description"
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
                  }}
                  className="px-6 py-3 rounded-lg bg-slate-200 mr-3"
                >
                  <Text className="text-slate-700 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleUploadImage}
                  className="px-6 py-3 rounded-lg bg-[#0092ce] flex-row items-center"
                >
                  <Ionicons name="cloud-upload" size={20} color="#fff" />
                  <Text className="text-white font-medium ml-2">Upload</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
