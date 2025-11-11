import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/constants/config';

interface JobMapViewProps {
  address: string;
  isHistoryJob: boolean;
  onArrival?: () => void;
  destinationLatitude?: string | null;
  destinationLongitude?: string | null;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

// Debounce delay for route recalculation (in milliseconds)
const ROUTE_UPDATE_DELAY = 5000; // 5 seconds

export default function JobMapView({ address, isHistoryJob, onArrival, destinationLatitude, destinationLongitude }: JobMapViewProps) {
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  const watchIdRef = useRef<number | null>(null);
  const routeUpdateTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Calculate distance between two coordinates in meters (Haversine formula)
  const calculateDistance = useCallback((coord1: Coordinates, coord2: Coordinates): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (coord1.lat * Math.PI) / 180;
    const φ2 = (coord2.lat * Math.PI) / 180;
    const Δφ = ((coord2.lat - coord1.lat) * Math.PI) / 180;
    const Δλ = ((coord2.lng - coord1.lng) * Math.PI) / 180;

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
      const geocoder = new google.maps.Geocoder();
      const result = await geocoder.geocode({ address: addr });

      if (result.results[0]) {
        const location = result.results[0].geometry.location;
        return {
          lat: location.lat(),
          lng: location.lng(),
        };
      }
      throw new Error('Address not found');
    } catch (err) {
      console.error('Geocoding error:', err);
      throw err;
    }
  }, []);

  // Get user's current location (one-time)
  const getCurrentLocation = useCallback(() => {
    return new Promise<Coordinates>((resolve, reject) => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  }, []);

  // Get directions from current location to destination
  const getDirections = useCallback(async (origin: Coordinates, dest: Coordinates) => {
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      });
      setDirections(result);
    } catch (err) {
      console.error('Directions error:', err);
    }
  }, []);

  // Initialize map data only after Google Maps API is loaded
  useEffect(() => {
    if (!isGoogleMapsLoaded) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Use destination coordinates from locations table if available, otherwise geocode the address
        let destCoords: Coordinates | null = null;

        if (destinationLatitude && destinationLongitude) {
          // Parse coordinates from locations table
          destCoords = {
            lat: parseFloat(destinationLatitude),
            lng: parseFloat(destinationLongitude),
          };
        } else {
          // Fall back to geocoding the address
          destCoords = await geocodeAddress(address);
        }

        setDestination(destCoords);

        if (!isHistoryJob) {
          // For current jobs, get user location and directions
          try {
            const currentCoords = await getCurrentLocation();
            setCurrentLocation(currentCoords);
            await getDirections(currentCoords, destCoords);
          } catch (locError) {
            console.error('Could not get current location:', locError);
            // Continue without current location and directions
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
  }, [address, isHistoryJob, isGoogleMapsLoaded, destinationLatitude, destinationLongitude, geocodeAddress, getCurrentLocation, getDirections]);

  // Continuously track user location for current jobs
  useEffect(() => {
    // Only track location for current jobs (not history jobs) and after map is loaded
    if (isHistoryJob || !isGoogleMapsLoaded || !destination) return;

    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return;
    }

    // Start watching user's position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Coordinates = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        // Update current location marker
        setCurrentLocation(newLocation);

        // Debounce route updates to avoid too many API calls
        if (routeUpdateTimerRef.current) {
          clearTimeout(routeUpdateTimerRef.current);
        }

        routeUpdateTimerRef.current = setTimeout(() => {
          // Recalculate route with new location
          getDirections(newLocation, destination);
        }, ROUTE_UPDATE_DELAY);
      },
      (error) => {
        console.error('Location tracking error:', error);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 5000,
      }
    );

    // Cleanup function: stop watching location when component unmounts
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (routeUpdateTimerRef.current) {
        clearTimeout(routeUpdateTimerRef.current);
        routeUpdateTimerRef.current = null;
      }
    };
  }, [isHistoryJob, isGoogleMapsLoaded, destination, getDirections]);

  const handleGoogleMapsLoad = useCallback(() => {
    setIsGoogleMapsLoaded(true);
  }, []);

  if (!GOOGLE_MAPS_API_KEY) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Text className="text-red-500">Google Maps API key not configured</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <LoadScript
        googleMapsApiKey={GOOGLE_MAPS_API_KEY}
        onLoad={handleGoogleMapsLoad}
      >
        {loading ? (
          <View className="flex-1 items-center justify-center bg-slate-100">
            <ActivityIndicator size="large" color="#0092ce" />
            <Text className="text-slate-600 mt-2">Loading map...</Text>
          </View>
        ) : error || !destination ? (
          <View className="flex-1 items-center justify-center bg-slate-100">
            <Text className="text-slate-600">{error || 'Unable to load location'}</Text>
          </View>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentLocation || destination}
            zoom={14}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {/* Destination Marker */}
            <Marker
              position={destination}
              label="Destination"
              icon={{
                url: 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
              }}
            />

            {/* Current Location Marker (only for current jobs) */}
            {!isHistoryJob && currentLocation && (
              <Marker
                position={currentLocation}
                label="You"
                icon={{
                  url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                }}
              />
            )}

            {/* Directions Route (only for current jobs) */}
            {!isHistoryJob && directions && (
              <DirectionsRenderer
                directions={directions}
                options={{
                  suppressMarkers: true,
                  polylineOptions: {
                    strokeColor: '#0092ce',
                    strokeWeight: 5,
                  },
                }}
              />
            )}
          </GoogleMap>
        )}
      </LoadScript>
    </View>
  );
}
