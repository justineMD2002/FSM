import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: 'default' | 'destructive';
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  visible,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmStyle = 'default',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const confirmButtonColor =
    confirmStyle === 'destructive' ? 'bg-red-600' : 'bg-blue-600';
  const confirmButtonActiveColor =
    confirmStyle === 'destructive' ? 'bg-red-700' : 'bg-blue-700';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View className="flex-1 bg-black/50 items-center justify-center px-6">
          <TouchableWithoutFeedback>
            <View className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
              {/* Title */}
              <Text className="text-xl font-bold text-slate-800 mb-3">
                {title}
              </Text>

              {/* Message */}
              <Text className="text-slate-600 text-base mb-6">
                {message}
              </Text>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                {/* Cancel Button */}
                <TouchableOpacity
                  className="flex-1 bg-slate-100 rounded-xl px-4 py-3"
                  onPress={onCancel}
                  activeOpacity={0.7}
                >
                  <Text className="text-slate-800 font-semibold text-base text-center">
                    {cancelText}
                  </Text>
                </TouchableOpacity>

                {/* Confirm Button */}
                <TouchableOpacity
                  className={`flex-1 ${confirmButtonColor} rounded-xl px-4 py-3`}
                  onPress={onConfirm}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold text-base text-center">
                    {confirmText}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
