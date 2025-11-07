import React from 'react';
import { View } from 'react-native';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import DashboardHeader from '@/components/DashboardHeader';
import FooterNav from '@/components/FooterNav';
import { Tab } from '@/enums';
import { useNavigationStore } from '@/store';
import CustomersScreen from './CustomersScreen';

interface TabConfig {
  title: string;
  screen: React.ReactNode;
  showMapIcon?: boolean;
}

export default function MainScreen() {
  const { activeTab, setActiveTab, showMapView, selectedJob } = useNavigationStore();

  const tabConfig: Record<Tab, TabConfig> = {
    [Tab.HOME]: {
      title: 'My Jobs',
      screen: <HomeScreen />,
      showMapIcon: true,
    },
    [Tab.CUSTOMERS]: {
      title: 'Customers',
      screen: <CustomersScreen />,
      showMapIcon: false,
    },
    [Tab.PROFILE]: {
      title: 'Profile',
      screen: <ProfileScreen />,
      showMapIcon: false,
    },
  };

  const currentTab = tabConfig[activeTab];

  // Show header/footer when viewing job details even from map view
  const shouldShowHeaderFooter = !showMapView || selectedJob !== null;

  return (
    <View className="flex-1 bg-slate-50">
      {shouldShowHeaderFooter && (
        <DashboardHeader
          title={currentTab.title}
          showMapIcon={currentTab.showMapIcon}
        />
      )}
      {currentTab.screen}
      {shouldShowHeaderFooter && <FooterNav activeTab={activeTab} onTabChange={setActiveTab} />}
    </View>
  );
}
