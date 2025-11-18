import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { GoogleMap, LoadScript, Marker, DirectionsRenderer } from '@react-google-maps/api';
import { GOOGLE_MAPS_API_KEY } from '@/constants/config';
import { Job } from '@/types';

interface MultipleJobsMapViewProps {
  jobs: Job[];
  onJobMarkerPress?: (job: Job) => void;
  focusedJobId?: string;
}

interface Coordinates {
  lat: number;
  lng: number;
}

interface JobWithCoordinates extends Job {
  coordinates: Coordinates;
  colorIndex?: number;
}

interface JobDirections {
  jobId: string;
  directions: google.maps.DirectionsResult;
}

const containerStyle = {
  width: '100%',
  height: '100%',
};

export const ROUTE_COLORS = ['#0092ce', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function MultipleJobsMapView({ jobs, onJobMarkerPress, focusedJobId }: MultipleJobsMapViewProps) {
  const [jobsWithCoords, setJobsWithCoords] = useState<JobWithCoordinates[]>([]);
  const [currentLocation, setCurrentLocation] = useState<Coordinates | null>(null);
  const [allDirections, setAllDirections] = useState<JobDirections[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const [initialFitDone, setInitialFitDone] = useState(false);

  // Geocode the address to get coordinates
  const geocodeAddress = useCallback(async (addr: string): Promise<Coordinates | null> => {
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
      return null;
    } catch (err) {
      console.error('Geocoding error for address:', addr, err);
      return null;
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
  const getDirections = useCallback(async (origin: Coordinates, dest: Coordinates, jobId: string) => {
    try {
      const directionsService = new google.maps.DirectionsService();
      const result = await directionsService.route({
        origin: new google.maps.LatLng(origin.lat, origin.lng),
        destination: new google.maps.LatLng(dest.lat, dest.lng),
        travelMode: google.maps.TravelMode.DRIVING,
      });
      return { jobId, directions: result };
    } catch (err) {
      console.error('Directions error for job:', jobId, err);
      return null;
    }
  }, []);

  // Initialize map data
  useEffect(() => {
    if (!isGoogleMapsLoaded) return;

    const initializeMap = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current location
        let currentCoords: Coordinates | null = null;
        try {
          currentCoords = await getCurrentLocation();
          setCurrentLocation(currentCoords);
        } catch (err) {
          console.error('Could not get current location:', err);
        }

        // Get coordinates for all jobs
        // First, fetch destination coordinates from database for all jobs
        const { supabase } = await import('@/lib/supabase');
        const jobIds = jobs.map(j => j.id);

        const { data: dbJobs } = await supabase
          .from('jobs')
          .select(`
            id,
            location:location_id (
              destination_latitude,
              destination_longitude
            )
          `)
          .in('id', jobIds) as any;

        // Create a map of job IDs to their coordinates
        const coordsMap = new Map<string, Coordinates>();
        if (dbJobs) {
          for (const dbJob of dbJobs) {
            if (dbJob.location?.destination_latitude && dbJob.location?.destination_longitude) {
              coordsMap.set(dbJob.id, {
                lat: parseFloat(dbJob.location.destination_latitude),
                lng: parseFloat(dbJob.location.destination_longitude),
              });
            }
          }
        }

        // Build job list with coordinates
        const jobsWithCoordinates: JobWithCoordinates[] = [];
        for (const job of jobs) {
          let coords: any = coordsMap.get(job.id);

          // If no coordinates from database, geocode the address
          if (!coords) {
            coords = await geocodeAddress(job.address);
          }

          if (coords) {
            jobsWithCoordinates.push({
              ...job,
              coordinates: coords,
            });
          }
        }

        setJobsWithCoords(jobsWithCoordinates);

        // Get directions to ALL jobs
        if (currentCoords && jobsWithCoordinates.length > 0) {
          const directionsPromises = jobsWithCoordinates.map(job =>
            getDirections(currentCoords, job.coordinates, job.id)
          );

          const allDirectionsResults = await Promise.all(directionsPromises);
          const validDirections = allDirectionsResults.filter(
            (result): result is JobDirections => result !== null
          );

          setAllDirections(validDirections);
        }
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
  }, [jobs, isGoogleMapsLoaded, geocodeAddress, getCurrentLocation, getDirections]);

  // Fit map to show all markers initially
  useEffect(() => {
    if (mapRef.current && jobsWithCoords.length > 0 && !initialFitDone) {
      const bounds = new google.maps.LatLngBounds();

      jobsWithCoords.forEach(job => {
        bounds.extend(job.coordinates);
      });

      if (currentLocation) {
        bounds.extend(currentLocation);
      }

      mapRef.current.fitBounds(bounds);
      setInitialFitDone(true);
    }
  }, [jobsWithCoords, currentLocation, initialFitDone]);

  // Zoom to focused job when it changes
  useEffect(() => {
    if (mapRef.current && focusedJobId && jobsWithCoords.length > 0) {
      const focusedJob = jobsWithCoords.find(job => job.id === focusedJobId);
      if (focusedJob) {
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.panTo(focusedJob.coordinates);
            mapRef.current.setZoom(16);
          }
        }, 100);
      }
    }
  }, [focusedJobId, jobsWithCoords]);

  const handleGoogleMapsLoad = useCallback(() => {
    setIsGoogleMapsLoaded(true);
  }, []);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // All jobs in this view are current jobs (CREATED, SCHEDULED, RESCHEDULED, IN_PROGRESS)
  const getMarkerIcon = () => 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png';

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
        ) : error || jobsWithCoords.length === 0 ? (
          <View className="flex-1 items-center justify-center bg-slate-100">
            <Text className="text-slate-600">
              {error || 'No job locations to display'}
            </Text>
          </View>
        ) : (
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={currentLocation || jobsWithCoords[0].coordinates}
            zoom={12}
            onLoad={onMapLoad}
            options={{
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: false,
              fullscreenControl: true,
            }}
          >
            {currentLocation && (
              <Marker
                position={currentLocation}
                icon={{
                  path: google.maps.SymbolPath.CIRCLE,
                  scale: 10,
                  fillColor: '#3b82f6',
                  fillOpacity: 1,
                  strokeColor: '#ffffff',
                  strokeWeight: 3,
                }}
                title="Your Location"
              />
            )}

            {/* Job Markers */}
            {jobsWithCoords.map((job) => (
              <Marker
                key={job.id}
                position={job.coordinates}
                icon={{
                  url: getMarkerIcon(),
                }}
                title={job.jobName}
                onClick={() => onJobMarkerPress?.(job)}
              />
            ))}

            {/* Directions Routes to ALL jobs */}
            {allDirections.map((jobDirection) => {
              const job = jobsWithCoords.find(j => j.id === jobDirection.jobId);
              const colorIndex = job?.colorIndex ?? 0;
              return (
                <DirectionsRenderer
                  key={jobDirection.jobId}
                  directions={jobDirection.directions}
                  options={{
                    suppressMarkers: true,
                    polylineOptions: {
                      strokeColor: ROUTE_COLORS[colorIndex % ROUTE_COLORS.length],
                      strokeWeight: 4,
                      strokeOpacity: 0.7,
                    },
                  }}
                />
              );
            })}
          </GoogleMap>
        )}
      </LoadScript>
    </View>
  );
}
