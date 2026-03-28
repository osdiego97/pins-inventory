import { useState, useRef, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

const MAP_DELTA = { latitudeDelta: 0.01, longitudeDelta: 0.01 };

function LocationMap({ latitude, longitude }: { latitude: number; longitude: number }) {
  return (
    <View collapsable={false} className="rounded-xl overflow-hidden mt-2" style={{ height: 130 }}>
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude, longitude, ...MAP_DELTA }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        mapType="standard"
        userInterfaceStyle="dark"
      >
        <Marker coordinate={{ latitude, longitude }}>
          <Ionicons name="location-sharp" size={28} color="#e8c97e" />
        </Marker>
      </MapView>
    </View>
  );
}

interface Prediction {
  placeId: string;
  description: string; // from structuredFormat or text
}

interface PlaceResult {
  name: string;
  latitude: number;
  longitude: number;
}

interface Props {
  value: PlaceResult | null;
  onChange: (place: PlaceResult | null) => void;
  hasExistingCoords?: boolean;
  existingLatitude?: number | null;
  existingLongitude?: number | null;
}


export default function PlaceSearch({ value, onChange, hasExistingCoords, existingLatitude, existingLongitude }: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reverseGeocodedName, setReverseGeocodedName] = useState<string | null>(null);
  const [reverseGeocoding, setReverseGeocoding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!hasExistingCoords || !existingLatitude || !existingLongitude || !PLACES_API_KEY) return;
    setReverseGeocoding(true);
    fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${existingLatitude},${existingLongitude}&key=${PLACES_API_KEY}&language=es`
    )
      .then((r) => r.json())
      .then((data) => {
        const name = data.results?.[0]?.formatted_address ?? null;
        setReverseGeocodedName(name);
      })
      .catch(() => {})
      .finally(() => setReverseGeocoding(false));
  }, [hasExistingCoords, existingLatitude, existingLongitude]);

  const search = useCallback(async (text: string) => {
    if (!PLACES_API_KEY) {
      setError('Clave de API no configurada.');
      return;
    }
    if (text.length < 2) {
      setPredictions([]);
      return;
    }
    setSearching(true);
    setError(null);
    try {
      const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': PLACES_API_KEY,
        },
        body: JSON.stringify({ input: text, languageCode: 'es' }),
      });
      const data = await res.json();
      if (data.suggestions) {
        setPredictions(
          data.suggestions
            .filter((s: any) => s.placePrediction)
            .map((s: any) => ({
              placeId: s.placePrediction.placeId,
              description: s.placePrediction.text?.text ?? s.placePrediction.placeId,
            }))
        );
      } else {
        setPredictions([]);
      }
    } catch {
      setError('No se pudo cargar el buscador de ubicaciones.');
      setPredictions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  function handleChangeText(text: string) {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(text), 300);
  }

  async function handleSelect(prediction: Prediction) {
    if (!PLACES_API_KEY) return;
    setPredictions([]);
    setQuery('');
    setSearching(true);
    try {
      const res = await fetch(
        `https://places.googleapis.com/v1/places/${prediction.placeId}?fields=location`,
        {
          headers: {
            'X-Goog-Api-Key': PLACES_API_KEY,
          },
        }
      );
      const data = await res.json();
      const loc = data.location;
      if (loc) {
        onChange({ name: prediction.description, latitude: loc.latitude, longitude: loc.longitude });
      } else {
        setError('No se pudo obtener la ubicación.');
      }
    } catch {
      setError('No se pudo obtener la ubicación.');
    } finally {
      setSearching(false);
    }
  }

  function handleClear() {
    onChange(null);
    setQuery('');
    setPredictions([]);
    setError(null);
  }

  // Selected state
  if (value) {
    return (
      <View>
        <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="location" size={16} color="#e8c97e" style={{ marginRight: 8 }} />
          <Text className="text-text-primary text-sm flex-1" numberOfLines={1}>
            {value.name}
          </Text>
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#606060" />
          </TouchableOpacity>
        </View>
        <LocationMap latitude={value.latitude} longitude={value.longitude} />
      </View>
    );
  }

  // Pre-existing coords (edit mode, no name stored)
  if (hasExistingCoords && !value) {
    return (
      <View>
        <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-center">
          <Ionicons name="location" size={16} color="#e8c97e" style={{ marginRight: 8 }} />
          {reverseGeocoding ? (
            <ActivityIndicator size="small" color="#606060" style={{ flex: 1 }} />
          ) : (
            <Text className="text-text-primary text-sm flex-1" numberOfLines={1}>
              {reverseGeocodedName ?? 'Posición guardada'}
            </Text>
          )}
          <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="close-circle" size={18} color="#606060" />
          </TouchableOpacity>
        </View>
        {existingLatitude != null && existingLongitude != null && (
          <LocationMap latitude={existingLatitude} longitude={existingLongitude} />
        )}
      </View>
    );
  }

  return (
    <View>
      <View className="bg-surface-card rounded-xl px-4 flex-row items-center">
        <Ionicons name="search-outline" size={16} color="#606060" style={{ marginRight: 8 }} />
        <TextInput
          className="flex-1 py-3 text-text-primary text-sm"
          placeholder="Buscar lugar (ej. Hard Rock Cafe Madrid)..."
          placeholderTextColor="#606060"
          value={query}
          onChangeText={handleChangeText}
          autoCorrect={false}
        />
        {searching && <ActivityIndicator size="small" color="#606060" />}
      </View>

      {error && (
        <Text className="text-danger text-xs mt-1">{error}</Text>
      )}

      {predictions.length > 0 && (
        <View className="bg-surface-card rounded-xl mt-1 overflow-hidden">
          {predictions.map((p, i) => (
            <TouchableOpacity
              key={p.placeId}
              onPress={() => handleSelect(p)}
              className={`px-4 py-3 flex-row items-center ${
                i < predictions.length - 1 ? 'border-b border-surface-elevated' : ''
              }`}
            >
              <Ionicons name="location-outline" size={14} color="#606060" style={{ marginRight: 8 }} />
              <Text className="text-text-primary text-sm flex-1" numberOfLines={2}>
                {p.description}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}
