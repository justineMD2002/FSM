import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    const { error } = await signIn(email, password);
    setLoading(false);

    if (error) {
      Alert.alert('Login Failed', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-slate-50"
    >
      <View className="flex-1 justify-center px-8">
        <View className="bg-white rounded-3xl shadow-lg p-8">
          <View className="mb-8">
            <Text className="text-3xl font-bold text-slate-800 text-center mb-2">
              Welcome Back
            </Text>
            <Text className="text-base text-slate-500 text-center">
              Sign in to continue
            </Text>
          </View>

          <View className="mb-4">
            <Text className="text-sm font-medium text-slate-700 mb-2">
              Email
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
              placeholder="Enter your email"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              editable={!loading}
            />
          </View>

          <View className="mb-6">
            <Text className="text-sm font-medium text-slate-700 mb-2">
              Password
            </Text>
            <TextInput
              className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-800 text-base"
              placeholder="Enter your password"
              placeholderTextColor="#94a3b8"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className={`rounded-xl py-4 shadow-md ${loading ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#1a338f' }}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <Text className="text-slate-400 text-center mt-6 text-sm">
          FSM Field Service Management
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}
