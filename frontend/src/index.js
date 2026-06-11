/**
 * @file index.js
 * @description React uygulamasının ana giriş noktasıdır. HTML sayfasındaki 'root' elementine App bileşenini bağlar.
 */
import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);


reportWebVitals();
