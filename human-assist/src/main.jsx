import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Frame from './components/Bar.jsx';
import { ToastProvider } from './components/Toast.jsx';
import Callbacks from './pages/Callbacks.jsx';
import Console from './pages/Console.jsx';
import { AssistProvider } from './store.jsx';
import './styles/assist.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AssistProvider>
        <ToastProvider>
          <Frame>
            <Routes>
              <Route path="/callbacks" element={<Callbacks />} />
              <Route path="*" element={<Console />} />
            </Routes>
          </Frame>
        </ToastProvider>
      </AssistProvider>
    </BrowserRouter>
  </StrictMode>,
);
