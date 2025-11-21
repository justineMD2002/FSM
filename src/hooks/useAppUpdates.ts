import { useEffect, useState } from 'react';
import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

/**
 * Hook to check for and apply EAS Updates
 * Automatically checks for updates on mount and allows manual checking
 */
export const useAppUpdates = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  // Check for updates on app start
  useEffect(() => {
    if (__DEV__) {
      // Skip update checks in development mode
      return;
    }

    checkForUpdates();
  }, []);

  /**
   * Check if an update is available
   */
  const checkForUpdates = async () => {
    if (__DEV__ || isChecking) {
      return;
    }

    setIsChecking(true);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateAvailable(true);
        // Automatically download and prompt user
        await downloadAndPromptUpdate();
      } else {
        console.log('No updates available');
        setUpdateAvailable(false);
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      // Don't show error to user - fail silently for better UX
    } finally {
      setIsChecking(false);
    }
  };

  /**
   * Download update and prompt user to restart
   */
  const downloadAndPromptUpdate = async () => {
    setIsUpdating(true);

    try {
      // Download the update
      const result = await Updates.fetchUpdateAsync();

      if (result.isNew) {
        // Show alert to user
        Alert.alert(
          'Update Available',
          'A new version of the app is available. Would you like to restart and apply the update now?',
          [
            {
              text: 'Later',
              style: 'cancel',
              onPress: () => {
                setIsUpdating(false);
                setUpdateAvailable(false);
              },
            },
            {
              text: 'Restart Now',
              onPress: async () => {
                try {
                  // Reload the app with the new update
                  await Updates.reloadAsync();
                } catch (error) {
                  console.error('Error reloading app:', error);
                  Alert.alert('Error', 'Failed to apply update. Please restart the app manually.');
                  setIsUpdating(false);
                }
              },
            },
          ],
          { cancelable: false }
        );
      }
    } catch (error) {
      console.error('Error downloading update:', error);
      Alert.alert(
        'Update Failed',
        'Failed to download the update. Please check your internet connection and try again.'
      );
      setIsUpdating(false);
    }
  };

  /**
   * Manually check for updates (can be triggered by user action)
   */
  const manualCheckForUpdates = async () => {
    if (__DEV__) {
      Alert.alert(
        'Development Mode',
        'Updates are not available in development mode. Build a production app to test EAS Updates.'
      );
      return;
    }

    setIsChecking(true);

    try {
      const update = await Updates.checkForUpdateAsync();

      if (update.isAvailable) {
        setUpdateAvailable(true);
        await downloadAndPromptUpdate();
      } else {
        Alert.alert('No Updates', 'You are already using the latest version of the app.');
      }
    } catch (error) {
      console.error('Error checking for updates:', error);
      Alert.alert(
        'Update Check Failed',
        'Failed to check for updates. Please check your internet connection and try again.'
      );
    } finally {
      setIsChecking(false);
    }
  };

  return {
    isChecking,
    isUpdating,
    updateAvailable,
    checkForUpdates: manualCheckForUpdates,
  };
};
