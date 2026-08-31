import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './i18n';
import App from './App';
import './index.css';

// React.StrictMode is intentionally omitted: it double-mounts components in
// development, which calls Leaflet's map.remove() at the wrong time and
// detaches the map panes that React still tracks, crashing with
// "NotFoundError: Failed to execute 'removeChild' on 'Node'". This is a known
// incompatibility between react-leaflet v4 and React 18 StrictMode.
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <App />
    <ToastContainer position="top-right" autoClose={4000} hideProgressBar newestOnTop closeOnClick pauseOnHover limit={3} />
  </BrowserRouter>
);
