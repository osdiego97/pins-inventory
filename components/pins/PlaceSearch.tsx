import { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface Prediction {
  place_id: string;
  description: string;
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
}

export default function PlaceSearch({ value, onChange, hasExistingCoords }: Props) {
  const [query, setQuery] = useState('');
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(text)}&key=${PLACES_API_KEY}&language=es`
      );
      const data = await res.json();
      if (data.status === 'OK' || data.status === 'ZERO_RESULTS') {
        setPredictions(data.predictions ?? []);
      } else {
        setError('No se pudo cargar el buscador de ubicaciones.');
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
        `https://maps.googleapis.com/maps/api/place/details/json?place_id=${prediction.place_id}&fields=geometry&key=${PLACES_API_KEY}`
      );
      const data = await res.json();
      const loc = data.result?.geometry?.location;
      if (loc) {
        onChange({ name: prediction.description, latitude: loc.lat, longitude: loc.lng });
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
      <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-center">
        <Ionicons name="location" size={16} color="#e8c97e" style={{ marginRight: 8 }} />
        <Text className="text-text-primary text-sm flex-1" numberOfLines={1}>
          {value.name}
        </Text>
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color="#606060" />
        </TouchableOpacity>
      </View>
    );
  }

  // Pre-existing coords (edit mode, no name stored)
  if (hasExistingCoords && !value) {
    return (
      <View className="bg-surface-card rounded-xl px-4 py-3 flex-row items-center">
        <Ionicons name="location" size={16} color="#e8c97e" style={{ marginRight: 8 }} />
        <Text className="text-text-secondary text-sm flex-1">Posición guardada</Text>
        <TouchableOpacity onPress={handleClear} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="close-circle" size={18} color="#606060" />
        </TouchableOpacity>
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
              key={p.place_id}
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
