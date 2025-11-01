import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/constants/config';

interface JobMapViewProps {
  address: string;
  isHistoryJob: boolean;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

export default function JobMapView({ address, isHistoryJob }: JobMapViewProps) {
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = React.useRef<MapView>(null);

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

        // Geocode the job address
        const destCoords = await geocodeAddress(address);
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
  }, [address, isHistoryJob, geocodeAddress, getCurrentLocation]);

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
