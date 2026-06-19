import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import App from './App';
import { ThemeProvider } from './contexts/ThemeContext';
import { wakeUpServer } from './services/api';
import './index.css';

// Giữ Render.com server luôn "tỉnh" bằng cách ping /health mỗi 14 phút
// Render Free tier tự ngủ sau 15 phút không có request
wakeUpServer(); // ping ngay khi mở app
setInterval(wakeUpServer, 14 * 60 * 1000); // ping định kỳ mỗi 14 phút

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </Provider>
  </React.StrictMode>
);
