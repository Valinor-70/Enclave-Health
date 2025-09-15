import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// More robust loading screen hiding function
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    try {
      loadingScreen.style.opacity = '0';
      setTimeout(() => {
        try {
          if (loadingScreen.parentNode) {
            loadingScreen.style.display = 'none';
          }
        } catch (e) {
          console.warn('Could not hide loading screen:', e);
        }
      }, 300);
    } catch (e) {
      console.warn('Could not set loading screen opacity:', e);
      // Fallback: immediately hide
      try {
        loadingScreen.style.display = 'none';
      } catch (e2) {
        console.warn('Could not hide loading screen at all:', e2);
      }
    }
  }
};

// Ensure loading screen is hidden when DOM is ready
const ensureLoadingScreenHidden = () => {
  // Hide loading screen after a reasonable timeout regardless of React state
  setTimeout(hideLoadingScreen, 2000);
};

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )

  // Hide loading screen after React renders
  setTimeout(hideLoadingScreen, 100);
  
  // Backup timeout to ensure loading screen is always hidden
  ensureLoadingScreenHidden();
} catch (error) {
  console.error('Failed to render React app:', error);
  // Still hide loading screen even if React fails
  hideLoadingScreen();
}