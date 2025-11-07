import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/store';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string;
  sender: 'user' | 'receiver';
  text: string;
  timestamp: Date;
  senderName: string;
  avatarUrl?: string;
}

export default function ChatTab() {
  const user = useAuthStore((state) => state.user);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [userName, setUserName] = useState('You');

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

  // Dummy chat data - initialize with existing messages
  useEffect(() => {
    setMessages([
      {
        id: '1',
        sender: 'receiver',
        text: 'Hello! I noticed you completed the service. Everything looks good?',
        timestamp: new Date('2024-01-15T10:30:00'),
        senderName: 'Admin',
        avatarUrl: undefined,
      },
      {
        id: '2',
        sender: 'user',
        text: 'Yes, all tasks completed successfully. The air conditioning unit is working perfectly now.',
        timestamp: new Date('2024-01-15T10:32:00'),
        senderName: userName,
        avatarUrl: undefined,
      },
      {
        id: '3',
        sender: 'receiver',
        text: 'Great! Did you replace the air filter?',
        timestamp: new Date('2024-01-15T10:33:00'),
        senderName: 'Admin',
        avatarUrl: undefined,
      },
      {
        id: '4',
        sender: 'user',
        text: 'Yes, the air filter was replaced with a new one. Also cleaned the condenser coils and checked the refrigerant levels.',
        timestamp: new Date('2024-01-15T10:35:00'),
        senderName: userName,
        avatarUrl: undefined,
      },
      {
        id: '5',
        sender: 'receiver',
        text: 'Perfect! Thank you for the detailed work. I really appreciate your service.',
        timestamp: new Date('2024-01-15T10:36:00'),
        senderName: 'Admin',
        avatarUrl: undefined,
      },
      {
        id: '6',
        sender: 'user',
        text: 'You\'re welcome! If you have any issues or questions, feel free to reach out.',
        timestamp: new Date('2024-01-15T10:37:00'),
        senderName: userName,
        avatarUrl: undefined,
      },
    ]);
  }, [userName]);

  const handleSendMessage = () => {
    if (newMessage.trim() === '') return;

    const message: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: newMessage.trim(),
      timestamp: new Date(),
      senderName: userName,
      avatarUrl: undefined,
    };

    setMessages([...messages, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const renderMessage = (message: Message) => {
    const isUser = message.sender === 'user';

    return (
      <View
        key={message.id}
        className={`flex-row mb-4 ${isUser ? 'justify-end' : 'justify-start'}`}
      >
        {/* Receiver avatar on the left */}
        {!isUser && (
          <View className="mr-2">
            {message.avatarUrl ? (
              <Image
                source={{ uri: message.avatarUrl }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-slate-300 items-center justify-center">
                <Ionicons name="person" size={24} color="#64748b" />
              </View>
            )}
          </View>
        )}

        {/* Message bubble */}
        <View className={`max-w-[70%] ${isUser ? 'items-end' : 'items-start'}`}>
          {/* Sender name */}
          <Text className="text-xs text-slate-600 mb-1 px-1 font-semibold">
            {message.senderName}
          </Text>

          <View
            className={`rounded-2xl px-4 py-3 ${
              isUser ? 'bg-[#0092ce]' : 'bg-white'
            }`}
            style={{
              borderBottomRightRadius: isUser ? 4 : 16,
              borderBottomLeftRadius: isUser ? 16 : 4,
            }}
          >
            <Text
              className={`text-base ${isUser ? 'text-white' : 'text-slate-800'}`}
            >
              {message.text}
            </Text>
          </View>

          {/* Timestamp */}
          <Text className="text-xs text-slate-500 mt-1 px-1">
            {formatTime(message.timestamp)}
          </Text>
        </View>

        {/* User avatar on the right */}
        {isUser && (
          <View className="ml-2">
            {message.avatarUrl ? (
              <Image
                source={{ uri: message.avatarUrl }}
                className="w-10 h-10 rounded-full"
              />
            ) : (
              <View className="w-10 h-10 rounded-full bg-[#0092ce] items-center justify-center">
                <Ionicons name="person" size={24} color="#ffffff" />
              </View>
            )}
          </View>
        )}
      </View>
    );
  };

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
      <ScrollView className="flex-1 mb-4">
        {messages.map((message) => renderMessage(message))}
      </ScrollView>

      {/* Message Input - Fixed */}
      <View className="bg-white rounded-xl p-3 shadow-sm">
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
            style={{ backgroundColor: newMessage.trim() ? '#0092ce' : '#cbd5e1' }}
            disabled={!newMessage.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name="send" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
