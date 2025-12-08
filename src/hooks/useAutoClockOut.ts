import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { AttendanceRecord } from '@/types';
import { supabase } from '@/lib/supabase';

/**
 * Custom hook to automatically clock out user after being clocked in for 24 hours
 * @param currentAttendance - The current active attendance record
 * @param onAutoClockOut - Callback function to execute when auto clock-out occurs
 * @param maxClockInDuration - Maximum clock-in duration in milliseconds (default: 24 hours)
 */
export const useAutoClockOut = (
  currentAttendance: AttendanceRecord | null,
  onAutoClockOut: () => Promise<void>,
  maxClockInDuration: number = 12 * 60 * 60 * 1000 // 12 hours
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const clockInTimeRef = useRef<number | null>(null);

  // Check if clock-in duration has exceeded the max duration
  const checkClockInDuration = async () => {
    if (!currentAttendance?.clock_in) return;

    const clockInTime = new Date(currentAttendance.clock_in).getTime();
    const now = Date.now();
    const duration = now - clockInTime;

    if (duration >= maxClockInDuration) {
      console.log('Auto clock-out: User has been clocked in for 24 hours. Clocking out...');
      await performAutoClockOut();
    }
  };

  // Perform the auto clock-out
  const performAutoClockOut = async () => {
    if (!currentAttendance?.id) return;

    try {
      const clockOutTime = new Date().toISOString();
      const clockInTime = new Date(currentAttendance.clock_in).getTime();
      const durationMinutes = Math.floor((Date.now() - clockInTime) / (1000 * 60));

      console.log('Auto clocking out attendance:', currentAttendance.id);

      const { error } = await supabase
        .from('attendance')
        .update({
          clock_out: clockOutTime,
          duration_minutes: durationMinutes,
        })
        .eq('id', currentAttendance.id);

      if (error) {
        console.error('Auto clock-out error:', error);
        return;
      }

      console.log('Auto clock-out successful');

      // Call the callback to update UI state
      await onAutoClockOut();
    } catch (error: any) {
      console.error('Error during auto clock-out:', error);
    }
  };

  // Set up the auto clock-out timer
  const setupTimer = () => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (!currentAttendance?.clock_in) {
      clockInTimeRef.current = null;
      return;
    }

    const clockInTime = new Date(currentAttendance.clock_in).getTime();
    clockInTimeRef.current = clockInTime;
    const now = Date.now();
    const elapsed = now - clockInTime;
    const remaining = maxClockInDuration - elapsed;

    // If already exceeded, clock out immediately
    if (remaining <= 0) {
      performAutoClockOut();
      return;
    }

    // Set timeout for the remaining time
    timeoutRef.current = setTimeout(() => {
      console.log('Auto clock-out timer expired. Clocking out...');
      performAutoClockOut();
    }, remaining);
  };

  useEffect(() => {
    // Only activate if user is clocked in
    if (!currentAttendance?.clock_in || currentAttendance?.clock_out) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      clockInTimeRef.current = null;
      return;
    }

    // Initialize the timer
    setupTimer();

    // Handle app state changes (foreground/background)
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      const previousState = appStateRef.current;
      appStateRef.current = nextAppState;

      // App coming to foreground from background
      if (previousState.match(/inactive|background/) && nextAppState === 'active') {
        // Check if we need to auto clock-out
        checkClockInDuration();
      }
    });

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      subscription.remove();
    };
  }, [currentAttendance, maxClockInDuration]);

  return { checkClockInDuration };
};
