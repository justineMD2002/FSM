import React, { useState, useEffect, useCallback } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE, Callout } from 'react-native-maps';
import MapViewDirections from 'react-native-maps-directions';
import * as Location from 'expo-location';
import { GOOGLE_MAPS_API_KEY } from '@/constants/config';
import { Job } from '@/types';

interface MultipleJobsMapViewProps {
  jobs: Job[];
  onJobMarkerPress?: (job: Job) => void;
  focusedJobId?: string;
}

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface JobWithCoordinates extends Job {
  coordinates: Coordinates;
  colorIndex?: number;
}

export const ROUTE_COLORS = ['#0092ce', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MultipleJobsMapView({ jobs, onJobMarkerPress, focusedJobId }: MultipleJobsMapViewProps) {
  const [jobsWithCoords, setJobsWithCoords] = useState<JobWithCoordinates[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const mapRef = React.useRef<MapView>(null);
  const [initialFitDone, setInitialFitDone] = React.useState(false);

  // Geocode the address to get coordinates
  const geocodeAddress = useCallback(async (addr: string): Promise<Coordinates | null> => {
    try {
      const geocoded = await Location.geocodeAsync(addr);
      if (geocoded.length > 0) {
        return {
          latitude: geocoded[0].latitude,
          longitude: geocoded[0].longitude,
        };
      }
      return null;
    } catch (err) {
      console.error('Geocoding error for address:', addr, err);
      return null;
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
      return null;
    }
  }, []);

  useEffect(() => {
    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current location
        const currentCoords = await getCurrentLocation();
        if (currentCoords) {
          setCurrentLocation(currentCoords);
        }

        // Geocode all job addresses
        const jobsWithCoordinates: JobWithCoordinates[] = [];
        for (const job of jobs) {
          const coords = await geocodeAddress(job.address);
          if (coords) {
            jobsWithCoordinates.push({
              ...job,
              coordinates: coords,
            });
          }
        }

        setJobsWithCoords(jobsWithCoordinates);
      } catch (err) {
        setError('Unable to load map locations');
        console.error('Map initialization error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (jobs.length > 0) {
      initializeMap();
    } else {
      setLoading(false);
    }
  }, [jobs, geocodeAddress, getCurrentLocation]);

  // Fit map to show all markers initially
  useEffect(() => {
    if (mapRef.current && jobsWithCoords.length > 0 && !initialFitDone) {
      const allCoordinates = jobsWithCoords.map(job => job.coordinates);
      if (currentLocation) {
        allCoordinates.push(currentLocation);
      }

      if (allCoordinates.length > 0) {
        mapRef.current.fitToCoordinates(allCoordinates, {
          edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
          animated: true,
        });
        setInitialFitDone(true);
      }
    }
  }, [jobsWithCoords, currentLocation, initialFitDone]);

  // Zoom to focused job when it changes
  useEffect(() => {
    if (mapRef.current && focusedJobId && jobsWithCoords.length > 0) {
      const focusedJob = jobsWithCoords.find(job => job.id === focusedJobId);
      if (focusedJob) {
        setTimeout(() => {
          mapRef.current?.animateCamera({
            center: focusedJob.coordinates,
            zoom: 16,
            pitch: 0,
            heading: 0,
          }, { duration: 800 });
        }, 100);
      }
    }
  }, [focusedJobId, jobsWithCoords]);

  // All jobs in this view are PENDING status only
  const getMarkerColor = () => '#0092ce';

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

  if (error || jobsWithCoords.length === 0) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-100">
        <Text className="text-slate-600">
          {error || 'No job locations to display'}
        </Text>
      </View>
    );
  }


  const initialRegion = {
    ...(currentLocation || jobsWithCoords[0].coordinates),
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={{ flex: 1 }}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
      >
        {/* Job Markers */}
        {jobsWithCoords.map((job) => (
          <Marker
            key={job.id}
            coordinate={job.coordinates}
            pinColor={getMarkerColor()}
            onPress={() => onJobMarkerPress?.(job)}
          >
            <Callout>
              <View style={{ width: 200 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 14 }}>{job.jobName}</Text>
                <Text style={{ fontSize: 12, color: '#64748b' }}>{job.jobCode}</Text>
                <Text style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                  {job.customer}
                </Text>
                <Text style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                  {job.date} • {job.time}
                </Text>
              </View>
            </Callout>
          </Marker>
        ))}

        {/* Show routes to ALL jobs */}
        {currentLocation && GOOGLE_MAPS_API_KEY && jobsWithCoords.map((job) => (
          <MapViewDirections
            key={job.id}
            origin={currentLocation}
            destination={job.coordinates}
            apikey={GOOGLE_MAPS_API_KEY}
            strokeWidth={3}
            strokeColor={ROUTE_COLORS[(job.colorIndex ?? 0) % ROUTE_COLORS.length]}
            onError={(error) => {
              console.error('Directions error for job:', job.id, error);
            }}
          />
        ))}
      </MapView>
    </View>
  );
}
