import '@expo/metro-runtime';
import 'react-native-gesture-handler';

if (typeof document !== 'undefined') {
  // Web: explicitly create root element and mount
  const React = require('react');
  const { createRoot } = require('react-dom/client');
  const App = require('./App').default;

  const style = document.createElement('style');
  style.textContent = 'html,body,#root{width:100%;height:100%;margin:0;padding:0;background:#080810;}';
  document.head.appendChild(style);

  let rootEl = document.getElementById('root');
  if (!rootEl) {
    rootEl = document.createElement('div');
    rootEl.id = 'root';
    document.body.appendChild(rootEl);
  }

  createRoot(rootEl).render(React.createElement(App));
} else {
  // Native
  const { registerRootComponent } = require('expo');
  const App = require('./App').default;
  registerRootComponent(App);
}
