import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import { ToastProvider } from './components/Toast.jsx';
import { StoreProvider } from './store.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Knowledge from './pages/Knowledge.jsx';
import EditLibrary from './pages/EditLibrary.jsx';
import Models from './pages/Models.jsx';
import Calls from './pages/Calls.jsx';
import Evaluation from './pages/Evaluation.jsx';
import './styles/admin.css';
import './styles/pages.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <StoreProvider>
        <ToastProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="knowledge" element={<Knowledge />} />
              <Route path="knowledge/edit" element={<EditLibrary />} />
              <Route path="models" element={<Models />} />
              <Route path="providers" element={<Navigate to="/models" replace />} />
              <Route path="calls" element={<Calls />} />
              <Route path="evaluation" element={<Evaluation />} />
              <Route path="*" element={<Dashboard />} />
            </Route>
          </Routes>
        </ToastProvider>
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>,
);
