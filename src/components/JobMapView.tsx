import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/constants/config';

interface JobMapViewProps {
  address: string;
  isHistoryJob: boolean;
  onArrival?: () => void;
  destinationLatitude?: string | null;
  destinationLongitude?: string | null;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function JobMapView({ address, isHistoryJob, onArrival, destinationLatitude, destinationLongitude }: JobMapViewProps) {
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasArrived, setHasArrived] = useState(false);
  const mapRef = React.useRef<MapView>(null);

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = useCallback((coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180;
    const φ2 = (coord2.latitude * Math.PI) / 180;
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  }, []);

  // Check if user has arrived at destination (within 50 meters)
  useEffect(() => {
    if (!currentLocation || !destination || isHistoryJob || hasArrived) return;

    const distance = calculateDistance(currentLocation, destination);
    const ARRIVAL_THRESHOLD = 50; // meters

    if (distance <= ARRIVAL_THRESHOLD) {
      setHasArrived(true);
      onArrival?.();
    }
  }, [currentLocation, destination, isHistoryJob, hasArrived, calculateDistance, onArrival]);

  // Geocode the address to get coordinates
  const geocodeAddress = useCallback(async (addr: string) => {
    try {
      const geocoded = await Location.geocodeAsync(addr);
      if (geocoded.length > 0) {
        return {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
      }
      throw new Error('Address not found');
    } catch (err) {
      console.error('Geocoding error:', err);
      throw err;
    }
  }, []);

  // Get user's current location
  const getCurrentLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission denied');
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      return {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };
    } catch (err) {
      console.error('Location error:', err);
      throw err;
    }
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use destination coordinates from locations table if available, otherwise geocode the address
        let destCoords: Coordinates | null = null;

        if (destinationLatitude && destinationLongitude) {
          // Parse coordinates from locations table
          destCoords = {
            latitude: parseFloat(destinationLatitude),
            longitude: parseFloat(destinationLongitude),
          };
        } else {
          // Fall back to geocoding the address
          destCoords = await geocodeAddress(address);
        }

        setDestination(destCoords);

        if (!isHistoryJob) {
          // For current jobs, get user location
          try {
            const currentCoords = await getCurrentLocation();
            setCurrentLocation(currentCoords);
          } catch (locError) {
            console.error('Could not get current location:', locError);
            // Continue without current location
          }
        }
      } catch (err) {
        setError('Unable to load map location');
        console.error('Map initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    initializeMap();
  }, [address, isHistoryJob, destinationLatitude, destinationLongitude, geocodeAddress, getCurrentLocation]);

  // Continuously track user location for current jobs
  useEffect(() => {
    if (isHistoryJob || !destination) return;

    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.error('Location permission denied');
          return;
        }

        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10, // Update every 10 meters
            timeInterval: 5000, // Update every 5 seconds
          },
          (location) => {
            setCurrentLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          }
        );
      } catch (err) {
        console.error('Location tracking error:', err);
      }
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isHistoryJob, destination]);

  // Fit map to show both markers
  useEffect(() => {
    if (mapRef.current && destination) {
      if (!isHistoryJob && currentLocation) {
        // Fit to show both current location and destination
        mapRef.current.fitToCoordinates([currentLocation, destination], {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      } else {
        // Just show destination
        mapRef.current.animateToRegion({
          ...destination,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    }
  }, [destination, currentLocation, isHistoryJob]);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Text className="text-red-500">Google Maps API key not configured</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <ActivityIndicator size="large" color="#0092ce" />
        <Text className="text-slate-600 mt-2">Loading map...</Text>
      </View>
    );
  }

  if (error || !destination) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Text className="text-slate-600">{error || 'Unable to load location'}</Text>
      </View>
    );
  }

  const initialRegion = {
    ...(currentLocation || destination),
    latitudeDelta: 0.02,
    longitudeDelta: 0.02,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={!isHistoryJob}
        showsMyLocationButton={!isHistoryJob}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={destination}
          title="Destination"
          description={address}
          pinColor="red"
        />

        {/* Current Location Marker (only for current jobs) */}
        {!isHistoryJob && currentLocation && (
          <Marker
            coordinate={currentLocation}
            title="Your Location"
            pinColor="blue"
          />
        )}

        {/* Directions Route (only for current jobs) */}
        {!isHistoryJob && currentLocation && GOOGLE_MAPS_API_KEY && (
          <MapViewDirections
            origin={currentLocation}
            destination={destination}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={4}
            strokeColor="#0092ce"
            onError={(error) => {
              console.error('Directions error:', error);
            }}
          />
        )}
      </MapView>
    </View>
  );
}
