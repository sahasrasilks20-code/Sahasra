import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically prepend production backend URL to relative image assets globally
const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  set(val) {
    if (val && typeof val === 'string' && !val.startsWith('http') && !val.startsWith('data:') && !val.startsWith('blob:')) {
      const backendUrl = import.meta.env.VITE_API_URL || '';
      if (backendUrl) {
        val = `${backendUrl.replace(/\/$/, '')}/${val.replace(/^\//, '')}`;
      }
    }
    originalSrcSetter.call(this, val);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
