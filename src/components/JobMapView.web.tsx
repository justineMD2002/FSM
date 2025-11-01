import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY, DEFAULT_MAP_CENTER } from '@/constants/config';

interface JobMapViewProps {
  address: string;
  isHistoryJob: boolean;
}

interface Coordinates {
  lat: number;
  lng: number;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export default function JobMapView({ address, isHistoryJob }: JobMapViewProps) {
  const [destination, setDestination] = useState<Coordinates | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

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

  // Get user's current location
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

        // Geocode the job address
        const destCoords = await geocodeAddress(address);
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
  }, [address, isHistoryJob, isGoogleMapsLoaded, geocodeAddress, getCurrentLocation, getDirections]);

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
