import React, { useState } from 'react';
import { View } from 'react-native';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import Header from '@/components/Header';
import DashboardHeader from '@/components/DashboardHeader';
import FooterNav from '@/components/FooterNav';
import { Tab } from '@/enums';
import { NavigationProvider, useNavigation } from '@/contexts/NavigationContext';
import CustomersScreen from './CustomersScreen';

interface TabConfig {
  title: string;
  screen: React.ReactNode;
  useCustomHeader?: boolean;
}

function MainScreenContent() {
  const [activeTab, setActiveTab] = useState<Tab>(Tab.PROFILE);
  const { showMapView, selectedJob } = useNavigation();

  const tabConfig: Record<Tab, TabConfig> = {
    [Tab.HOME]: {
      title: 'FSM Dashboard',
      screen: <HomeScreen />,
      useCustomHeader: true,
    },
    [Tab.CUSTOMERS]: {
      title: 'Customers',
      screen: <CustomersScreen />,
    },
    [Tab.PROFILE]: {
      title: 'Profile',
      screen: <ProfileScreen />,
    },
  };

  const currentTab = tabConfig[activeTab];

  // Show header/footer when viewing job details even from map view
  const shouldShowHeaderFooter = !showMapView || selectedJob !== null;

  return (
    <View className="flex-1 bg-slate-50">
      {shouldShowHeaderFooter && (currentTab.useCustomHeader ? <DashboardHeader /> : <Header title={currentTab.title} />)}
      {currentTab.screen}
      {shouldShowHeaderFooter && <FooterNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </View>
  );
}

export default function MainScreen() {
  return (
    <NavigationProvider>
      <MainScreenContent />
    </NavigationProvider>
  );
}
