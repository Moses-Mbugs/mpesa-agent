import './bootstrap';
import React from 'react';
import { createRoot } from 'react-dom/client';
import Dashboard from './components/Dashboard';

const appElement = document.getElementById('app');

if (appElement) {
    const root = createRoot(appElement);
    root.render(
        <React.StrictMode>
            <Dashboard />
        </React.StrictMode>
    );
}
