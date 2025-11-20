import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';
import { useJobMessages } from '@/hooks';

const { width: screenWidth } = Dimensions.get('window');

// Component for rendering message images with proper loading and error states
const MessageImage = ({ imageUrl }: { imageUrl: string }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  return (
    <View style={{ width: '100%', height: 192, backgroundColor: '#f1f5f9' }}>
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
          style={{ width: '100%', height: 192, resizeMode: 'cover' }}
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
    </View>
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
  const scrollViewRef = useRef<ScrollView>(null);

  // Fetch messages using the hook
  const { messages, loading, error, sendMessage } = useJobMessages(jobId, technicianJobId);

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

    try {
      await sendMessage(newMessage.trim());
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      alert(`Failed to send message: ${error.message}`);
    }
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
    const isCurrentUser = message.sender_type === 'TECHNICIAN' &&
                          message.technician_job?.technician?.full_name === userName;

    // Get the actual sender's name from the message data
    const senderName = message.sender_type === 'TECHNICIAN'
      ? (message.technician_job?.technician?.full_name || 'Technician')
      : 'Admin';

    const displayName = senderName;

    return (
      <View
        key={message.id}
        className={`flex-row mb-4 ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Receiver avatar on the left */}
        {!isCurrentUser && (
          <View className="mr-2">
            <View className="w-10 h-10 rounded-full bg-slate-300 items-center justify-center">
              <Ionicons name="person" size={24} color="#64748b" />
            </View>
          </View>
        )}

        {/* Message bubble */}
        <View className={`max-w-[70%] ${isCurrentUser ? 'items-end' : 'items-start'}`}>
          {/* Sender name */}
          <Text className="text-xs text-slate-600 mb-1 px-1 font-semibold">
            {displayName}
          </Text>

          <View
            className={`rounded-2xl overflow-hidden ${
              isCurrentUser ? 'bg-[#0092ce]' : 'bg-white'
            }`}
            style={{
              borderBottomRightRadius: isCurrentUser ? 4 : 16,
              borderBottomLeftRadius: isCurrentUser ? 16 : 4,
            }}
          >
            {/* Image if available */}
            {message.image_url && (
              <MessageImage imageUrl={message.image_url} />
            )}

            {/* Text message - show 'message' for pure text, 'message_text' for image captions */}
            {(message.message || message.message_text) && (
              <View className="px-4 py-3">
                <Text
                  className={`text-base ${isCurrentUser ? 'text-white' : 'text-slate-800'}`}
                >
                  {message.message || message.message_text}
                </Text>
              </View>
            )}
          </View>

          {/* Timestamp */}
          <Text className="text-xs text-slate-500 mt-1 px-1">
            {formatTime(message.created_at)}
          </Text>
        </View>

        {/* User avatar on the right */}
        {isCurrentUser && (
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

      {/* Message Input - Fixed */}
      <View className="bg-white rounded-xl p-3 shadow-sm mb-10">
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
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
