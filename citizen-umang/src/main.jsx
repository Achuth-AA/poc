import { StrictMode, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Site from './Site.jsx';
import Widget from './widget/Widget.jsx';
import './styles/site.css';

function App() {
  const widgetRef = useRef(null);
  // Page buttons (search, service tiles, "Call the assistant", …) open the assistant through this.
  const assistant = useMemo(() => ({ open: (opts) => widgetRef.current?.open(opts) }), []);
  return (
    <>
      <Site assistant={assistant} />
      <Widget ref={widgetRef} />
    </>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
