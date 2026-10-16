/**
 * @format
 */

// Mapbox token must be set before any MapView renders
import './src/config/mapbox';

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
