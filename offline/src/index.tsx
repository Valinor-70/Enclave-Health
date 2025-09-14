import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'

// Hide loading screen when React app loads
const hideLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen');
  if (loadingScreen) {
    loadingScreen.style.opacity = '0';
    setTimeout(() => {
      loadingScreen.style.display = 'none';
    }, 300);
  }
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Hide loading screen after React renders
setTimeout(hideLoadingScreen, 100);