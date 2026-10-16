import Mapbox from '@rnmapbox/maps';
import {ENV} from './env';

if (!ENV.mapboxToken) {
  console.warn('⚠️ MAPBOX_TOKEN missing in .env');
}

Mapbox.setAccessToken(ENV.mapboxToken);
Mapbox.setTelemetryEnabled(false);

export default Mapbox;
