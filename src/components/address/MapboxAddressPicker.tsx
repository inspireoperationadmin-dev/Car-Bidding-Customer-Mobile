import React, {useState, useCallback, useEffect, useRef, useMemo} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Platform,
} from 'react-native';
import MapboxGL from '@rnmapbox/maps';
import Icon from 'react-native-vector-icons/Feather';
import {theme} from '../../theme';
import geoApi, {Coordinates} from '../../api/services/geoApi';
import {ENV} from '../../config/env';

const DEFAULT_MAP_CENTER: [number, number] = [-0.1276, 51.5074];
const DEFAULT_ZOOM = 12;

MapboxGL.setAccessToken(ENV.mapboxToken);

export interface AddressData {
  address: string;
  postalCode: string;
  coordinates?: Coordinates;
}

interface MapboxAddressPickerProps {
  value?: AddressData;
  onChange: (data: AddressData) => void;
  disabled?: boolean;
}

interface Suggestion {
  id: string;
  address: string;
  coordinates: Coordinates;
}

const MapboxAddressPicker: React.FC<MapboxAddressPickerProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const safeValue = value || {address: '', postalCode: '', coordinates: undefined};

  const [addressInput, setAddressInput] = useState(safeValue.address || '');
  const [postalCode, setPostalCode] = useState(safeValue.postalCode || '');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);

  const [mapCenter, setMapCenter] = useState<[number, number]>(
    safeValue.coordinates
      ? [safeValue.coordinates.lng, safeValue.coordinates.lat]
      : DEFAULT_MAP_CENTER,
  );
  const [markerCoordinates, setMarkerCoordinates] = useState<[number, number] | null>(
    safeValue.coordinates
      ? [safeValue.coordinates.lng, safeValue.coordinates.lat]
      : null,
  );

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraRef = useRef<MapboxGL.Camera>(null);

  useEffect(() => {
    if (!value) return;
    setAddressInput(value.address || '');
    setPostalCode(value.postalCode || '');
    if (value.coordinates) {
      const newCoords: [number, number] = [value.coordinates.lng, value.coordinates.lat];
      setMarkerCoordinates(newCoords);
      setMapCenter(newCoords);
    }
  }, [value]);

  const canInteract = !disabled;

  const progressText = useMemo(() => {
    if (loading) return 'Searching...';
    if (markerCoordinates) return 'Pin set';
    return 'No pin';
  }, [loading, markerCoordinates]);

  const searchAddresses = useCallback(
    async (query: string) => {
      if (query.length < 3) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        setLoading(true);
        const results = await geoApi.searchAddress(query, ENV.mapboxToken);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Address search error:', error);
        setSuggestions([]);
        setShowSuggestions(false);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  const handleAddressChange = useCallback(
    (text: string) => {
      setAddressInput(text);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        searchAddresses(text);
      }, 450);
    },
    [searchAddresses],
  );

  const handleSelectSuggestion = useCallback(
    async (suggestion: Suggestion) => {
      setAddressInput(suggestion.address);
      setShowSuggestions(false);
      setSuggestions([]);

      const newCoords: [number, number] = [suggestion.coordinates.lng, suggestion.coordinates.lat];
      setMarkerCoordinates(newCoords);
      setMapCenter(newCoords);

      cameraRef.current?.setCamera({
        centerCoordinate: newCoords,
        zoomLevel: 15,
        animationDuration: 500,
      });

      try {
        const reverseResult = await geoApi.reverseGeocode(
          suggestion.coordinates.lat,
          suggestion.coordinates.lng,
          ENV.mapboxToken,
        );
        setPostalCode(reverseResult.postalCode || '');
        onChange({
          address: suggestion.address,
          postalCode: reverseResult.postalCode || postalCode,
          coordinates: suggestion.coordinates,
        });
      } catch {
        onChange({
          address: suggestion.address,
          postalCode: postalCode,
          coordinates: suggestion.coordinates,
        });
      }
    },
    [onChange, postalCode],
  );

  const handleMapPress = useCallback(
    async (event: any) => {
      if (disabled) return;
      const coordinates = event.geometry.coordinates as [number, number];
      setMarkerCoordinates(coordinates);

      try {
        setLoading(true);
        const result = await geoApi.reverseGeocode(
          coordinates[1],
          coordinates[0],
          ENV.mapboxToken,
        );
        setAddressInput(result.address);
        setPostalCode(result.postalCode || '');
        onChange({
          address: result.address,
          postalCode: result.postalCode || '',
          coordinates: {lat: coordinates[1], lng: coordinates[0]},
        });
      } catch (error) {
        console.error('Reverse geocode error:', error);
      } finally {
        setLoading(false);
      }
    },
    [disabled, onChange],
  );

  const handleMarkerDragEnd = useCallback(
    async (event: any) => {
      const coordinates = event.geometry.coordinates as [number, number];
      setMarkerCoordinates(coordinates);

      try {
        setLoading(true);
        const result = await geoApi.reverseGeocode(
          coordinates[1],
          coordinates[0],
          ENV.mapboxToken,
        );
        setAddressInput(result.address);
        setPostalCode(result.postalCode || '');
        onChange({
          address: result.address,
          postalCode: result.postalCode || '',
          coordinates: {lat: coordinates[1], lng: coordinates[0]},
        });
      } catch (error) {
        console.error('Reverse geocode error:', error);
      } finally {
        setLoading(false);
      }
    },
    [onChange],
  );

  const handlePostalCodeChange = useCallback(
    (text: string) => {
      setPostalCode(text);
      onChange({
        address: addressInput,
        postalCode: text,
        coordinates: markerCoordinates
          ? {lat: markerCoordinates[1], lng: markerCoordinates[0]}
          : undefined,
      });
    },
    [addressInput, markerCoordinates, onChange],
  );

  const handleAddressBlur = useCallback(async () => {
    setShowSuggestions(false);
    if (addressInput.length > 5 && !markerCoordinates) {
      try {
        setLoading(true);
        const result = await geoApi.validateAddress(addressInput);
        if (result.isValid && result.coordinates) {
          const newCoords: [number, number] = [result.coordinates.lng, result.coordinates.lat];
          setMarkerCoordinates(newCoords);
          setMapCenter(newCoords);
          if (result.normalizedAddress) setAddressInput(result.normalizedAddress);
          if (result.details?.postalCode) setPostalCode(result.details.postalCode);
          cameraRef.current?.setCamera({
            centerCoordinate: newCoords,
            zoomLevel: 15,
            animationDuration: 500,
          });
          onChange({
            address: result.normalizedAddress || addressInput,
            postalCode: result.details?.postalCode || postalCode,
            coordinates: result.coordinates,
          });
        }
      } catch (error) {
        console.error('Address validation error:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [addressInput, markerCoordinates, postalCode, onChange]);

  const clearAddress = useCallback(() => {
    if (!canInteract) return;
    setAddressInput('');
    setSuggestions([]);
    setShowSuggestions(false);
    onChange({
      address: '',
      postalCode,
      coordinates: markerCoordinates
        ? {lat: markerCoordinates[1], lng: markerCoordinates[0]}
        : undefined,
    });
  }, [canInteract, onChange, postalCode, markerCoordinates]);

  const centerToMarker = useCallback(() => {
    if (!markerCoordinates) return;
    cameraRef.current?.setCamera({
      centerCoordinate: markerCoordinates,
      zoomLevel: 15,
      animationDuration: 450,
    });
    setMapCenter(markerCoordinates);
  }, [markerCoordinates]);

  const clearPin = useCallback(() => {
    if (!canInteract) return;
    setMarkerCoordinates(null);
    setMapCenter(DEFAULT_MAP_CENTER);
    onChange({
      address: addressInput,
      postalCode,
      coordinates: undefined,
    });
    cameraRef.current?.setCamera({
      centerCoordinate: DEFAULT_MAP_CENTER,
      zoomLevel: DEFAULT_ZOOM,
      animationDuration: 450,
    });
  }, [canInteract, onChange, addressInput, postalCode]);

  const renderSuggestion = ({item}: {item: Suggestion}) => (
    <TouchableOpacity
      style={styles.suggestionItem}
      onPress={() => handleSelectSuggestion(item)}
      activeOpacity={0.9}>
      <View style={styles.sugIcon}>
        <Icon name="map-pin" size={14} color={theme.colors.primary} />
      </View>
      <View style={{flex: 1}}>
        <Text style={styles.suggestionText} numberOfLines={2}>
          {item.address}
        </Text>
        <Text style={styles.suggestionSub} numberOfLines={1}>
          Tap to select
        </Text>
      </View>
      <Icon name="chevron-right" size={18} color={theme.colors.muted} />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Address Details</Text>
        <View style={styles.statusPill}>
          <View
            style={[
              styles.statusDot,
              {backgroundColor: loading ? theme.colors.primary : markerCoordinates ? '#22C55E' : theme.colors.muted},
            ]}
          />
          <Text style={styles.statusPillText}>{progressText}</Text>
        </View>
      </View>

      {/* Info strip */}
      <View style={styles.infoStrip}>
        <View style={styles.infoIcon}>
          <Icon name="info" size={16} color={theme.colors.primary} />
        </View>
        <Text style={styles.infoText}>
          Type an address to search, or tap the map to drop a pin. Drag the pin to adjust.
        </Text>
      </View>

      {/* Address card */}
      <View style={[styles.card, {zIndex: 20}]}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBubble}>
              <Icon name="search" size={16} color={theme.colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>Address</Text>
              <Text style={styles.cardSubtitle}>Start typing to see suggestions</Text>
            </View>
          </View>

          {!!addressInput?.length && canInteract && (
            <TouchableOpacity onPress={clearAddress} style={styles.smallIconBtn} activeOpacity={0.9}>
              <Icon name="x" size={16} color={theme.colors.muted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputWrap}>
          <TextInput
            value={addressInput}
            onChangeText={handleAddressChange}
            onBlur={handleAddressBlur}
            placeholder="Enter your address"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.input}
            editable={!disabled}
            multiline
            textAlignVertical="top"
          />
          {loading && (
            <View style={styles.loadingInline}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
            </View>
          )}
        </View>

        {showSuggestions && suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={suggestions}
              keyExtractor={item => item.id}
              renderItem={renderSuggestion}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>

      {/* Postal code card */}
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBubble}>
              <Icon name="hash" size={16} color={theme.colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>Postal Code</Text>
              <Text style={styles.cardSubtitle}>Auto-filled when available</Text>
            </View>
          </View>
        </View>

        <View style={styles.inputWrapSingle}>
          <TextInput
            value={postalCode}
            onChangeText={handlePostalCodeChange}
            placeholder="Enter postal code"
            placeholderTextColor={theme.colors.mutedText}
            style={styles.inputSingle}
            editable={!disabled}
            autoCapitalize="characters"
          />
        </View>
      </View>

      {/* Map card */}
      <View style={styles.card}>
        <View style={styles.mapHeader}>
          <View style={styles.cardHeaderLeft}>
            <View style={styles.iconBubble}>
              <Icon name="map" size={16} color={theme.colors.primary} />
            </View>
            <View style={{flex: 1}}>
              <Text style={styles.cardTitle}>Pin Location</Text>
              <Text style={styles.cardSubtitle}>Tap map or drag pin</Text>
            </View>
          </View>

          <View style={{flexDirection: 'row', gap: 8}}>
            <TouchableOpacity
              onPress={centerToMarker}
              disabled={!markerCoordinates}
              style={[styles.pillBtn, !markerCoordinates && styles.btnDisabled]}
              activeOpacity={0.9}>
              <Icon name="crosshair" size={16} color={theme.colors.primary} />
              <Text style={styles.pillText}>Center</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={clearPin}
              disabled={!markerCoordinates || !canInteract}
              style={[styles.pillBtnDanger, (!markerCoordinates || !canInteract) && styles.btnDisabled]}
              activeOpacity={0.9}>
              <Icon name="trash-2" size={16} color={theme.colors.error} />
              <Text style={styles.pillTextDanger}>Clear</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mapCard}>
          <MapboxGL.MapView
            style={styles.map}
            styleURL={MapboxGL.StyleURL.Street}
            onPress={handleMapPress}
            attributionEnabled={false}
            logoEnabled={false}>
            <MapboxGL.Camera
              ref={cameraRef}
              zoomLevel={DEFAULT_ZOOM}
              centerCoordinate={mapCenter}
            />

            {markerCoordinates && (
              <MapboxGL.PointAnnotation
                id="location-marker"
                coordinate={markerCoordinates}
                draggable={!disabled}
                onDragEnd={handleMarkerDragEnd}>
                <View style={styles.markerWrap}>
                  <View style={styles.markerGlow} />
                  <View style={styles.markerCore}>
                    <Icon name="map-pin" size={16} color={theme.colors.white} />
                  </View>
                  <View style={styles.markerShadow} />
                </View>
              </MapboxGL.PointAnnotation>
            )}
          </MapboxGL.MapView>

          {disabled && <View style={styles.mapOverlay} />}

          {!disabled && (
            <View style={styles.mapTip}>
              <Icon name="info" size={14} color={theme.colors.muted} />
              <Text style={styles.mapTipText}>Tap anywhere to drop a pin</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

export default MapboxAddressPicker;

const styles = StyleSheet.create({
  container: {width: '100%'},

  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  sectionTitle: {fontSize: 16, fontWeight: '800', color: theme.colors.text},

  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  statusDot: {height: 8, width: 8, borderRadius: 8},
  statusPillText: {fontSize: 12, fontWeight: '800', color: theme.colors.muted},

  infoStrip: {
    marginBottom: 12,
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    height: 34,
    width: 34,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {flex: 1, fontSize: 12, color: theme.colors.muted, fontWeight: '700', lineHeight: 18},

  card: {
    backgroundColor: theme.colors.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  cardHeaderLeft: {flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10},
  iconBubble: {
    height: 36,
    width: 36,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  cardTitle: {fontSize: 14, fontWeight: '800', color: theme.colors.text},
  cardSubtitle: {marginTop: 2, fontSize: 12, fontWeight: '600', color: theme.colors.muted},

  smallIconBtn: {
    height: 36,
    width: 36,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  inputWrap: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    padding: 12,
    minHeight: 72,
  },
  input: {fontSize: 14, color: theme.colors.text, fontWeight: '600', minHeight: 48},

  loadingInline: {position: 'absolute', right: 12, top: 12},

  suggestionsContainer: {
    marginTop: 10,
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    maxHeight: 220,
    overflow: 'hidden',
    zIndex: 999,
    ...(Platform.OS === 'android' ? {elevation: 8} : null),
  },

  suggestionItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  sugIcon: {
    height: 32,
    width: 32,
    borderRadius: 14,
    backgroundColor: 'rgba(108,99,255,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionText: {fontSize: 13, color: theme.colors.text, fontWeight: '700'},
  suggestionSub: {marginTop: 2, fontSize: 11, color: theme.colors.muted, fontWeight: '600'},

  inputWrapSingle: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.inputBackground,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10,
  },
  inputSingle: {fontSize: 14, color: theme.colors.text, fontWeight: '600'},

  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 10,
  },

  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  pillText: {fontSize: 12, fontWeight: '800', color: theme.colors.text},

  pillBtnDanger: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(255,77,77,0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255,77,77,0.22)',
  },
  pillTextDanger: {fontSize: 12, fontWeight: '800', color: theme.colors.error},

  btnDisabled: {opacity: 0.5},

  mapCard: {
    height: 230,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },

  map: {flex: 1},

  mapOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.10)',
  },

  mapTip: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  mapTipText: {fontSize: 12, fontWeight: '700', color: theme.colors.muted},

  markerWrap: {alignItems: 'center'},
  markerGlow: {
    position: 'absolute',
    top: -10,
    height: 44,
    width: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(108,99,255,0.20)',
  },
  markerCore: {
    height: 34,
    width: 34,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    borderWidth: 3,
    borderColor: theme.colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerShadow: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgba(15, 23, 42, 0.18)',
    marginTop: 4,
  },
});
