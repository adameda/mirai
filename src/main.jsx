import React from 'react';
import ReactDOM from 'react-dom/client';
import MiraiApp from '../mirai-platform.jsx';
import './global.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MiraiApp />
  </React.StrictMode>,
);