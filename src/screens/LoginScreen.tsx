import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Updates from 'expo-updates';
import { useAuthStore } from '@/store';

const REMEMBER_ME_KEY = '@remember_me';
const SAVED_EMAIL_KEY = '@saved_email';
const SAVED_PASSWORD_KEY = '@saved_password';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const signIn = useAuthStore((state) => state.signIn);

  // Get version info
  const getVersionInfo = () => {
    const appVersion = Constants.expoConfig?.version || '1.0.0';

    // In production builds, show update ID if available
    if (!__DEV__ && Updates.updateId) {
      const updateIdShort = Updates.updateId.substring(0, 8);
      return `v${appVersion} (${updateIdShort})`;
    }

    // In development or if no update, just show app version
    return `v${appVersion}${__DEV__ ? ' (dev)' : ''}`;
  };

  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const loadSavedCredentials = async () => {
    try {
      const savedRememberMe = await AsyncStorage.getItem(REMEMBER_ME_KEY);
      if (savedRememberMe === 'true') {
        const savedEmail = await AsyncStorage.getItem(SAVED_EMAIL_KEY);
        const savedPassword = await AsyncStorage.getItem(SAVED_PASSWORD_KEY);
        if (savedEmail) setEmail(savedEmail);
        if (savedPassword) setPassword(savedPassword);
        setRememberMe(true);
      }
    } catch (error) {
      console.error('Error loading saved credentials:', error);
    }
  };

  const saveCredentials = async () => {
    try {
      if (rememberMe) {
        await AsyncStorage.setItem(REMEMBER_ME_KEY, 'true');
        await AsyncStorage.setItem(SAVED_EMAIL_KEY, email);
        await AsyncStorage.setItem(SAVED_PASSWORD_KEY, password);
      } else {
        await AsyncStorage.removeItem(REMEMBER_ME_KEY);
        await AsyncStorage.removeItem(SAVED_EMAIL_KEY);
        await AsyncStorage.removeItem(SAVED_PASSWORD_KEY);
      }
    } catch (error) {
      console.error('Error saving credentials:', error);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    setLoading(true);
    setError('');
    const { error: authError } = await signIn(email, password);
    setLoading(false);

    if (authError) {
      if (authError.message.includes('Invalid login credentials')) {
        setError('Invalid email or password. Please try again.');
      } else if (authError.message.includes('Email not confirmed')) {
        setError('Please verify your email address before logging in.');
      } else {
        setError(authError.message || 'Login failed. Please try again.');
      }
    } else {
      await saveCredentials();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-8">
        <View className="mb-10 items-center">
          <Image
            source={require('../../assets/SAS-LOGO.png')}
            style={{ width: 250, height: 130, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text className="text-base font-semibold text-slate-500 text-center mb-2">
            Streamline Your Field Service Operations
          </Text>
          <Text className="text-2xl font-bold text-slate-800 text-center">
            Log in
          </Text>
        </View>

        <View>
          <View className="mb-4">
            <View className="relative flex-row items-center">
              <Ionicons
                name="mail-outline"
                size={20}
                color="#64748b"
                style={{ position: 'absolute', left: 16, zIndex: 1 }}
              />
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-slate-800 text-base flex-1"
                placeholder="Enter your email"
                placeholderTextColor="#94a3b8"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  setError(''); 
                }}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
              />
            </View>
          </View>

          <View className="mb-4">
            <View className="relative flex-row items-center">
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color="#64748b"
                style={{ position: 'absolute', left: 16, zIndex: 1 }}
              />
              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-12 py-3.5 text-slate-800 text-base flex-1"
                placeholder="Enter your password"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  setError(''); 
                }}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity
                style={{ position: 'absolute', right: 16 }}
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={22}
                  color="#64748b"
                />
              </TouchableOpacity>
            </View>
          </View>

          {error ? (
            <View className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#ef4444" style={{ marginRight: 8 }} />
              <Text className="text-red-600 text-sm flex-1">{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => setRememberMe(!rememberMe)}
            activeOpacity={0.7}
          >
            <View
              className={`w-5 h-5 rounded border-2 mr-2 items-center justify-center ${
                rememberMe ? 'border-slate-800 bg-slate-800' : 'border-slate-300 bg-transparent'
              }`}
            >
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color="#ffffff" />
              )}
            </View>
            <Text className="text-slate-700 text-sm">Remember me</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className={`rounded-xl py-4 shadow-md ${loading ? 'opacity-70' : ''}`}
            style={{ backgroundColor: '#0092ce' }}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white text-center font-bold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          <Text className="text-slate-500 text-center mt-6 text-sm">
            Need technical support? {' '}
            <Text className="text-[#0092ce]">Contact IT</Text>
          </Text>
        </View>

        <View className="items-center mt-8">
          <Text className="text-slate-400 text-center text-xs">
            {getVersionInfo()}
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
