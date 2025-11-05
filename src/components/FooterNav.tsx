import React from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Tab } from '@/enums';

interface FooterNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

export default function FooterNav({ activeTab, onTabChange }: FooterNavProps) {
  const tabs = [
    { id: Tab.HOME, label: 'Home', icon: 'briefcase' as const },
    { id: Tab.TECHNICIANS, label: 'Customers', icon: 'people-outline' as const },
    { id: Tab.PROFILE, label: 'Profile', icon: 'person' as const },
  ];

  return (
    <View className="bg-white border-t border-slate-200 shadow-lg">
      <View className="flex-row justify-around items-center px-4 py-4 pb-4">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              onPress={() => onTabChange(tab.id)}
              className="flex-1 items-center"
              activeOpacity={0.7}
            >
              <View className="items-center justify-center">
                <Ionicons
                  name={tab.icon}
                  size={24}
                  color={isActive ? '#0092ce' : '#64748b'}
                />
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}
