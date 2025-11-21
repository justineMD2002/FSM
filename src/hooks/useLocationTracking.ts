import { useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import { updateTechnicianCurrentLocation } from '@/services/locationTechnicians.service';
import { updateCurrentLocation } from '@/services/locations.service';

/**
 * Hook to track technician's location in real-time and update both tables
 * @param technicianId - The technician ID to track
 * @param locationId - The location ID to update (for jobs table)
 * @param isTracking - Whether to actively track location
 * @param intervalMs - How often to update location in milliseconds (default: 30000 = 30 seconds)
 */
export const useLocationTracking = (
  technicianId: string | null,
  locationId: string | null,
  isTracking: boolean,
  intervalMs: number = 30000
) => {
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const locationSubscriptionRef = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    if (!isTracking || !technicianId) {
      // Stop tracking if not active
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
      return;
    }

    const startTracking = async () => {
      try {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Location permission not granted');
          return;
        }

        // Update location periodically
        const updateLocation = async () => {
          try {
            const location = await Location.getCurrentPositionAsync({
              accuracy: Location.Accuracy.High,
            });

            const { latitude, longitude } = location.coords;

            // Update location_technicians table
            const techResult = await updateTechnicianCurrentLocation(
              technicianId,
              latitude,
              longitude
            );

            if (techResult.error) {
              console.error('Error updating technician location:', techResult.error);
            }

            // Update locations table if locationId is provided
            if (locationId) {
              const locResult = await updateCurrentLocation(
                locationId,
                latitude,
                longitude
              );

              if (locResult.error) {
                console.error('Error updating location table:', locResult.error);
              }
            }
          } catch (error) {
            console.error('Error getting current position:', error);
          }
        };

        // Update immediately
        await updateLocation();

        // Then update periodically
        intervalRef.current = setInterval(updateLocation, intervalMs);
      } catch (error) {
        console.error('Error starting location tracking:', error);
      }
    };

    startTracking();

    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (locationSubscriptionRef.current) {
        locationSubscriptionRef.current.remove();
        locationSubscriptionRef.current = null;
      }
    };
  }, [technicianId, locationId, isTracking, intervalMs]);
};
