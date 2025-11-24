import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { useJobMessages } from '@/hooks';

const IMAGE_SIZE = Dimensions.get('window').width * 0.4;

// Component for rendering message images with proper loading and error states
const MessageImage = ({ imageUrl, onPress }: { imageUrl: string; onPress: () => void }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={{ width: IMAGE_SIZE, height: IMAGE_SIZE, backgroundColor: '#f1f5f9' }}
    >
      {imageLoading && !imageError && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="small" color="#0092ce" />
        </View>
      )}
      {imageError ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Ionicons name="image-outline" size={48} color="#94a3b8" />
          <Text style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>Failed to load image</Text>
        </View>
      ) : (
        <Image
          source={{ uri: imageUrl }}
          style={{ width: '100%', height: 192 }}
          resizeMode="cover"
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
          onError={(error) => {
            console.error('Image load error:', error.nativeEvent.error);
            console.log('Failed image URL:', imageUrl);
            setImageError(true);
            setImageLoading(false);
          }}
          onLoad={() => {
            console.log('Image loaded successfully:', imageUrl);
            setImageError(false);
          }}
        />
      )}
    </TouchableOpacity>
  );
};

interface ChatTabProps {
  jobId: string;
  technicianJobId: string | null;
}

export default function ChatTab({ jobId, technicianJobId }: ChatTabProps) {
  const user = useAuthStore((state) => state.user);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('You');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Selection and delete state
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedMessages, setSelectedMessages] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Edit message state
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Fetch messages using the hook
  const { messages, loading, error, sendMessage, updateMessage, deleteMessages } = useJobMessages(jobId, technicianJobId);

  // Fetch user's name from technicians table
  useEffect(() => {
    const fetchUserName = async () => {
      if (user) {
        try {
          const { data, error } = await supabase
            .from('technicians')
            .select('full_name')
            .eq('user_id', user.id)
            .single();

          if (!error && data) {
            setUserName(data.full_name);
          }
        } catch (error) {
          console.error('Error fetching user name:', error);
        }
      }
    };

    fetchUserName();
  }, [user]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' || !technicianJobId) return;

    // If editing, update the message
    if (editingMessageId) {
      try {
        await updateMessage(editingMessageId, newMessage.trim());
        setNewMessage('');
        setEditingMessageId(null);
        setEditingText('');
      } catch (error: any) {
        console.error('Error updating message:', error);
        alert(`Failed to update message: ${error.message}`);
      }
      return;
    }

    // Otherwise, send a new message
    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    }
  };

  const handleLongPress = (messageId: string) => {
    setSelectionMode(true);
    setSelectedMessages(new Set([messageId]));
  };

  const handleMessageSelect = (messageId: string) => {
    if (!selectionMode) return;

    const newSelection = new Set(selectedMessages);
    if (newSelection.has(messageId)) {
      newSelection.delete(messageId);
    } else {
      newSelection.add(messageId);
    }
    setSelectedMessages(newSelection);

    // Exit selection mode if no messages selected
    if (newSelection.size === 0) {
      setSelectionMode(false);
    }
  };

  const handleCancelSelection = () => {
    setSelectionMode(false);
    setSelectedMessages(new Set());
  };

  const handleDeleteConfirm = async (deleteType: 'everyone' | 'you') => {
    try {
      await deleteMessages(Array.from(selectedMessages), deleteType);
      setShowDeleteModal(false);
      setSelectionMode(false);
      setSelectedMessages(new Set());
    } catch (error: any) {
      console.error('Error deleting messages:', error);
      alert(`Failed to delete messages: ${error.message}`);
    }
  };

  const handleEditMessage = (message: typeof messages[0]) => {
    setEditingMessageId(message.id);
    setEditingText(message.message || message.message_text || '');
    setNewMessage(message.message || message.message_text || '');
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditingText('');
    setNewMessage('');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessage = (message: typeof messages[0]) => {
    // Check if this message was sent by the current user by comparing technician_job_id
    const isCurrentUser = message.sender_type === 'TECHNICIAN' &&
                          message.technician_job_id === technicianJobId;

    // Get the actual sender's name from the message data
    const senderName = message.sender_type === 'TECHNICIAN'
      ? (message.technician_job?.technician?.full_name || 'Technician')
      : 'Admin';

    const displayName = isCurrentUser ? 'You' : senderName;
    const isSelected = selectedMessages.has(message.id);

    return (
      <View
        key={message.id}
        className={`flex-row mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Checkbox for selection (on the left) */}
        {selectionMode && (
          <TouchableOpacity
            onPress={() => handleMessageSelect(message.id)}
            className="mr-2 justify-center items-center"
            style={{ width: 30, height: 30 }}
          >
            <View
              className={`w-6 h-6 rounded-full border-2 items-center justify-center ${
                isSelected ? 'bg-[#0092ce] border-[#0092ce]' : 'bg-white border-slate-300'
              }`}
            >
              {isSelected && <Ionicons name="checkmark" size={16} color="#ffffff" />}
            </View>
          </TouchableOpacity>
        )}

        {/* Receiver avatar on the left */}
        {!isCurrentUser && !selectionMode && (
          <View className="mr-2">
            <View className="w-10 h-10 rounded-full bg-slate-300 items-center justify-center">
              <Ionicons name="person" size={24} color="#64748b" />
            </View>
          </View>
        )}

        {/* Message bubble with long press */}
        <TouchableOpacity
          onLongPress={() => handleLongPress(message.id)}
          onPress={() => {
            if (selectionMode) {
              handleMessageSelect(message.id);
            }
          }}
          activeOpacity={0.7}
          disabled={!isCurrentUser && !selectionMode}
          className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}
        >
          {/* Sender name */}
          <Text className="text-xs text-slate-600 mb-1 px-1 font-semibold">
            {displayName}
          </Text>

          {/* Image bubble - separate from text */}
          {message.image_url && (
            <View
              className="rounded-2xl overflow-hidden bg-slate-200 mb-2"
              style={{
                borderBottomRightRadius: isCurrentUser ? 4 : 16,
                borderBottomLeftRadius: isCurrentUser ? 16 : 4,
              }}
            >
              <MessageImage
                imageUrl={message.image_url}
                onPress={() => setSelectedImage(message.image_url)}
              />
            </View>
          )}

          {/* Text message - separate bubble below image */}
          {(message.message || message.message_text) && (
            <View
              className={`rounded-2xl px-4 py-3 ${
                isCurrentUser ? 'bg-[#0092ce]' : 'bg-white'
              }`}
              style={{
                borderBottomRightRadius: isCurrentUser ? 4 : 16,
                borderBottomLeftRadius: isCurrentUser ? 16 : 4,
              }}
            >
              <Text
                className={`text-base ${isCurrentUser ? 'text-white' : 'text-slate-800'}`}
              >
                {message.message || message.message_text}
              </Text>
            </View>
          )}

          {/* Timestamp and Edit indicator */}
          <View className="flex-row items-center mt-1 px-1">
            <Text className="text-xs text-slate-500">
              {formatTime(message.created_at)}
            </Text>
            {message.updated_at !== message.created_at && (
              <Text className="text-xs text-slate-400 ml-2">(edited)</Text>
            )}
          </View>

          {/* Edit button - only for current user's text messages */}
          {isCurrentUser && !selectionMode && message.message && (
            <TouchableOpacity
              onPress={() => handleEditMessage(message)}
              className="mt-1 px-1"
            >
              <Text className="text-xs text-[#0092ce] font-semibold">Edit</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* User avatar on the right */}
        {isCurrentUser && !selectionMode && (
          <View className="ml-2">
            <View className="w-10 h-10 rounded-full bg-[#0092ce] items-center justify-center">
              <Ionicons name="person" size={24} color="#ffffff" />
            </View>
          </View>
        )}
      </View>
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="#0092ce" />
        <Text className="text-slate-600 mt-4">Loading messages...</Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View className="flex-1 justify-center items-center px-6">
        <Ionicons name="alert-circle-outline" size={64} color="#ef4444" />
        <Text className="text-slate-800 text-lg font-semibold mt-4">Error Loading Messages</Text>
        <Text className="text-slate-600 text-center mt-2">{error.message}</Text>
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        {/* Chat Header - Fixed */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
          <View className="flex-row items-center">
            <Ionicons name="chatbubbles-outline" size={24} color="#0092ce" />
            <Text className="text-lg font-semibold text-slate-800 ml-2">
              Job Chat
            </Text>
          </View>
          <Text className="text-sm text-slate-500 mt-2">
            Chat with Admin about this job
          </Text>
        </View>

        {/* Messages - Scrollable */}
        <ScrollView ref={scrollViewRef} className="flex-1 mb-4">
          {messages.length === 0 ? (
            <View className="flex-1 justify-center items-center py-12">
              <Ionicons name="chatbubbles-outline" size={64} color="#cbd5e1" />
              <Text className="text-slate-500 text-center mt-4">
                No messages yet. Start a conversation!
              </Text>
            </View>
          ) : (
            messages.map((message) => renderMessage(message))
          )}
        </ScrollView>

        {/* Message Input / Delete Actions - Fixed */}
        {selectionMode ? (
          // Delete actions when in selection mode
          <View className="bg-white rounded-xl p-3 shadow-sm mb-10">
            <View className="flex-row items-center justify-between">
              <Text className="text-slate-700 font-semibold">
                {selectedMessages.size} selected
              </Text>
              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={handleCancelSelection}
                  className="px-4 py-2 rounded-lg mr-2 bg-slate-100"
                  activeOpacity={0.7}
                >
                  <Text className="text-slate-700 font-semibold">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(true)}
                  className="px-4 py-2 rounded-lg bg-red-500"
                  activeOpacity={0.7}
                >
                  <View className="flex-row items-center">
                    <Ionicons name="trash-outline" size={18} color="#ffffff" />
                    <Text className="text-white font-semibold ml-2">Delete</Text>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          // Normal message input
          <View className="bg-white rounded-xl p-3 shadow-sm mb-10">
            {/* Edit mode indicator */}
            {editingMessageId && (
              <View className="flex-row items-center justify-between mb-2 px-2">
                <View className="flex-row items-center">
                  <Ionicons name="pencil" size={16} color="#0092ce" />
                  <Text className="text-sm text-[#0092ce] ml-2 font-semibold">Editing message</Text>
                </View>
                <TouchableOpacity onPress={handleCancelEdit}>
                  <Ionicons name="close" size={20} color="#64748b" />
                </TouchableOpacity>
              </View>
            )}

            <View className="flex-row items-center">
              <View className="flex-1 bg-slate-100 rounded-full px-4 py-3 mr-2">
                <TextInput
                  className="text-slate-800"
                  placeholder="Type a message..."
                  placeholderTextColor="#94a3b8"
                  value={newMessage}
                  onChangeText={setNewMessage}
                  multiline
                  maxLength={500}
                />
              </View>
              <TouchableOpacity
                onPress={handleSendMessage}
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: newMessage.trim() && technicianJobId ? '#0092ce' : '#cbd5e1' }}
                disabled={!newMessage.trim() || !technicianJobId}
                activeOpacity={0.7}
              >
                <Ionicons name={editingMessageId ? "checkmark" : "send"} size={20} color="#ffffff" />
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>

      {/* Full-screen Image Viewer Modal */}
      <Modal
        visible={selectedImage !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <Pressable
          className="flex-1 bg-black/90"
          onPress={() => setSelectedImage(null)}
        >
          <View className="flex-1 justify-center items-center">
            {/* Close button */}
            <TouchableOpacity
              className="absolute top-12 right-4 z-10 bg-white/20 rounded-full p-2"
              onPress={() => setSelectedImage(null)}
            >
              <Ionicons name="close" size={32} color="#ffffff" />
            </TouchableOpacity>

            {/* Full-size image */}
            {selectedImage && (
              <View className="px-6 py-20">
                <Image
                  source={{ uri: selectedImage }}
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

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 bg-black/50"
          onPress={() => setShowDeleteModal(false)}
        >
          <View className="flex-1 justify-end">
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View className="bg-white rounded-t-3xl p-6 pb-10">
                {/* Header */}
                <View className="items-center mb-6">
                  <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                    <Ionicons name="trash-outline" size={32} color="#ef4444" />
                  </View>
                  <Text className="text-xl font-bold text-slate-800 mb-2">
                    Delete Messages
                  </Text>
                  <Text className="text-sm text-slate-600 text-center">
                    Choose how you want to delete {selectedMessages.size} {selectedMessages.size === 1 ? 'message' : 'messages'}
                  </Text>
                </View>

                {/* Delete Options */}
                <View className="space-y-3">
                  {/* Delete for You */}
                  <TouchableOpacity
                    onPress={() => handleDeleteConfirm('you')}
                    className="bg-slate-100 rounded-2xl p-4 border border-slate-200"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-slate-200 items-center justify-center mr-3">
                        <Ionicons name="eye-off-outline" size={20} color="#475569" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-slate-800 mb-1">
                          Delete for You
                        </Text>
                        <Text className="text-xs text-slate-600">
                          Only you won't see {selectedMessages.size === 1 ? 'this message' : 'these messages'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>

                  {/* Delete for Everyone */}
                  <TouchableOpacity
                    onPress={() => handleDeleteConfirm('everyone')}
                    className="bg-red-50 rounded-2xl p-4 border border-red-200"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-center">
                      <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                        <Ionicons name="trash-outline" size={20} color="#ef4444" />
                      </View>
                      <View className="flex-1">
                        <Text className="text-base font-semibold text-red-600 mb-1">
                          Delete for Everyone
                        </Text>
                        <Text className="text-xs text-red-600">
                          {selectedMessages.size === 1 ? 'This message' : 'These messages'} will be removed for everyone
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Cancel Button */}
                <TouchableOpacity
                  onPress={() => setShowDeleteModal(false)}
                  className="mt-4 py-3 rounded-2xl bg-slate-100"
                  activeOpacity={0.7}
                >
                  <Text className="text-center text-slate-700 font-semibold text-base">
                    Cancel
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}