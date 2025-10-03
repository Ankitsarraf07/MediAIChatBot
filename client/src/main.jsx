import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material'
import App from './App.jsx'
import { AuthProvider } from './state/AuthContext.jsx'
import './styles.css'

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' }, // healthcare blue
    secondary: { main: '#00bfa6' }, // teal accent
    background: {
      default: '#f5fbff',
    },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiPaper: { styleOverrides: { root: { borderRadius: 14 } } },
    MuiButton: { defaultProps: { variant: 'contained' } },
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
)
