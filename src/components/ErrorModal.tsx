import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ErrorModalProps {
  visible: boolean;
  title: string;
  message: string;
  buttonText?: string;
  onClose: () => void;
}

export default function ErrorModal({
  visible,
  title,
  message,
  buttonText = 'Okay',
  onClose,
}: ErrorModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              {/* Title */}
              <Text className="text-xl font-bold text-slate-800 mb-4 text-center">
                {title}
              </Text>

              {/* Error Icon */}
              <View className="items-center mb-4">
                <View
                  className="w-20 h-20 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#ef4444' }}
                >
                  <Ionicons name="close" size={48} color="#ffffff" />
                </View>
              </View>

              {/* Message */}
              <Text className="text-slate-600 text-base mb-6 text-center">
                {message}
              </Text>

              {/* Okay Button */}
              <TouchableOpacity
                className="rounded-xl px-4 py-3"
                style={{ backgroundColor: '#ef4444' }}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text className="text-white font-semibold text-base text-center">
                  {buttonText}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
