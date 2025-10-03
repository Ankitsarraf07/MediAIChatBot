import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Container, Box, Typography } from '@mui/material'
import Login from './pages/Login.jsx'
import Register from './pages/Register.jsx'
import Chat from './pages/Chat.jsx'
import History from './pages/History.jsx'
import NavBar from './components/NavBar.jsx'
import { useAuth } from './state/AuthContext.jsx'

function Protected({ children }) {
  const { token } = useAuth()
  if (!token) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <>
      <NavBar />
      <Container maxWidth="lg" sx={{ mt: 3 }}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <Protected>
                <Chat />
              </Protected>
            }
          />
          <Route
            path="/history"
            element={
              <Protected>
                <History />
              </Protected>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Container>
      <Box component="footer" sx={{ textAlign: 'center', py: 2, opacity: 0.9 }}>
        <Typography variant="body2">@TeamAlphaDev</Typography>
      </Box>
    </>
  )
}
