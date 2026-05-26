import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Automatically prepend production backend URL to relative database-uploaded images globally
const originalSrcSetter = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src').set;
Object.defineProperty(HTMLImageElement.prototype, 'src', {
  set(val) {
    if (val && typeof val === 'string' && !val.startsWith('data:') && !val.startsWith('blob:')) {
      try {
        // 1. Optimize static images: intercept any static assets containing "/static/" and force them to load directly from the local frontend origin
        if (val.includes('/static/')) {
          const staticIdx = val.indexOf('/static/');
          const pathnameAndQuery = val.substring(staticIdx);
          val = `${window.location.origin}${pathnameAndQuery}`;
        } else {
          // 2. Intercept GridFS database uploads (/image/*) to route them through the remote/production Express backend
          const urlObj = new URL(val, window.location.href);
          if (urlObj.origin === window.location.origin) {
            const pathname = urlObj.pathname;
            if (pathname.startsWith('/image') && !pathname.startsWith('/api/')) {
              const backendUrl = import.meta.env.VITE_API_URL || '/api';
              val = `${urlObj.origin}${backendUrl}${pathname}${urlObj.search}`;
            }
          }
        }
      } catch (e) {}
    }
    originalSrcSetter.call(this, val);
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
