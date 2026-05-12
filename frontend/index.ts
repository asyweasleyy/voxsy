import 'react-native-gesture-handler';
import { registerRootComponent } from 'expo';

import App from './App';

console.log('[Voxsy] index.ts loaded');
registerRootComponent(App);
console.log('[Voxsy] registerRootComponent called');
