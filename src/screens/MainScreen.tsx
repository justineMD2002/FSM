import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import HomeScreen from './HomeScreen';
import ProfileScreen from './ProfileScreen';
import DashboardHeader from '@/components/DashboardHeader';
import FooterNav from '@/components/FooterNav';
import { Tab } from '@/enums';
import { useNavigationStore } from '@/store';
import CustomersScreen from './CustomersScreen';
import { useInactivityLogout } from '@/hooks';

interface TabConfig {
  title: string;
  screen: React.ReactNode;
  showMapIcon?: boolean;
}

export default function MainScreen() {
  const { activeTab, setActiveTab, showMapView, selectedJob } = useNavigationStore();

  // Setup auto-logout after 1 hour of inactivity
  const { resetTimer } = useInactivityLogout(60 * 60 * 1000); // 1 hour

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

  // Show header/footer except when in map view (map view screens have their own headers)
  // When a job is selected from map view, JobDetailsScreen has its own header, so hide DashboardHeader
  const shouldShowHeaderFooter = !showMapView;

  // Handle user activity - reset inactivity timer on any touch
  const handleUserActivity = () => {
    resetTimer();
  };

  // Create a tap gesture that runs simultaneously with other gestures (won't block scrolling)
  const tapGesture = Gesture.Tap()
    .onStart(() => {
      handleUserActivity();
    })
    .runOnJS(true)
    .shouldCancelWhenOutside(false);

  // Create a pan gesture that also resets the timer (for scrolling detection)
  const panGesture = Gesture.Pan()
    .onStart(() => {
      handleUserActivity();
    })
    .runOnJS(true);

  // Combine gestures to run simultaneously (won't interfere with ScrollView)
  const combinedGesture = Gesture.Simultaneous(tapGesture, panGesture);

  return (
    <SafeAreaView className="flex-1 bg-slate-50" edges={['top', 'left', 'right']}>
      <GestureDetector gesture={combinedGesture}>
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
      </GestureDetector>
    </SafeAreaView>
  );
}
