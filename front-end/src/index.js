import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './components/App/App';
import Navbar from './components/Navbar/Navbar';
import reportWebVitals from './reportWebVitals';

// 👇 MUI theme provider stuff
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

export const themeOptions = {
  palette: {
    mode: 'light',
    primary: {
      main: '#ff3b59',
    },
    secondary: {
      main: '#5e5e5e',
    },
  },
};

export const theme = createTheme(themeOptions);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      
      <Navbar />

      <App />

    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
