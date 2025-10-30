import React, { useState } from 'react';
import { View } from 'react-native';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import Header from '@/components/Header';
import DashboardHeader from '@/components/DashboardHeader';
import FooterNav from '@/components/FooterNav';
import { Tab } from '@/enums';
import Technicians from './TechniciansScreen';
import { NavigationProvider } from '@/contexts/NavigationContext';

interface TabConfig {
  title: string;
  screen: React.ReactNode;
  useCustomHeader?: boolean;
}

export default function MainScreen() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.HOME);

  const tabConfig: Record<Tab, TabConfig> = {
    [Tab.HOME]: {
      title: 'FSM Dashboard',
      screen: <HomeScreen />,
      useCustomHeader: true,
    },
    [Tab.TECHNICIANS]: {
      title: 'Technicicans',
      screen: <Technicians />,
    },
    [Tab.PROFILE]: {
      title: 'Profile',
      screen: <ProfileScreen />,
    },
  };

  const currentTab = tabConfig[activeTab];

  return (
    <NavigationProvider>
      <View className="flex-1 bg-slate-50">
        {currentTab.useCustomHeader ? <DashboardHeader /> : <Header title={currentTab.title} />}
        {currentTab.screen}
        <FooterNav activeTab={activeTab} onTabChange={setActiveTab} />
      </View>
    </NavigationProvider>
  );
}
