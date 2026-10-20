import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initMobileTouchFeedback } from './utils/haptics.ts';

// Initialize mobile tactile haptic feedback & touch sensations
initMobileTouchFeedback();

createRoot(document.getElementById('root')!).render(<App />);
