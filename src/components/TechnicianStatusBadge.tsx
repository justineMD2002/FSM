import React from 'react';
import { View, Text } from 'react-native';
import { useTechnicianStatus } from '@/hooks';

interface TechnicianStatusBadgeProps {
  technicianId: string;
}

export default function TechnicianStatusBadge({ technicianId }: TechnicianStatusBadgeProps) {
  const { status } = useTechnicianStatus(technicianId);

  const getStatusColor = () => {
    switch (status) {
      case 'Online':
        return '#22c55e'; // Green
      case 'Break':
        return '#f59e0b'; // Orange
      case 'Offline':
        return '#94a3b8'; // Gray
      default:
        return '#94a3b8';
    }
  };

  return (
    <View className="flex-row items-center">
      <View
        className="w-2 h-2 rounded-full mr-1"
        style={{ backgroundColor: getStatusColor() }}
      />
      <Text
        className="text-xs font-medium"
        style={{ color: getStatusColor() }}
      >
        {status}
      </Text>
    </View>
  );
}
