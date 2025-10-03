import React from 'react'
import { AppBar, Toolbar, Typography, Button, Box } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../state/AuthContext.jsx'
import logoUrl from '../logo/logo.png'

export default function NavBar() {
  const { user, logout, token } = useAuth()
  const nav = useNavigate()

  return (
    <AppBar position="static" className="navbar-blur" elevation={0} color="transparent">
      <Toolbar>
        <Box component={Link} to="/" sx={{ display: 'flex', alignItems: 'center', gap: 1.5, textDecoration: 'none', color: 'inherit', flexGrow: 1 }}>
          <Box component="img" src={logoUrl} alt="Triage Bot" sx={{ height: 64, width: 100, borderRadius: '8px' }} />
          {/* <Typography variant="h6">Triage Bot</Typography> */}
        </Box>
        {!token ? (
          <Box display="flex" gap={2}>
            <Button
              variant="contained"
              component={Link}
              to="/login"
              sx={{
                background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                color: '#fff',
                textTransform: 'none',
                boxShadow: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.75,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Login
            </Button>
            <Button
              variant="contained"
              component={Link}
              to="/register"
              sx={{
                background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 50%, #60a5fa 100%)',
                color: '#fff',
                textTransform: 'none',
                boxShadow: 'none',
                borderRadius: '8px',
                px: 2,
                py: 0.75,
                transition: 'all 0.2s ease',
                '&:hover': {
                  background: 'linear-gradient(90deg, #1d4ed8 0%, #2563eb 50%, #3b82f6 100%)',
                  boxShadow: '0 4px 14px rgba(37,99,235,0.4)',
                  transform: 'translateY(-1px)'
                }
              }}
            >
              Register
            </Button>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={2}>
            <Button color="inherit" onClick={() => nav('/history')} title="View your history">
              {user?.name}
            </Button>
            <Button color="inherit" onClick={() => { logout(); nav('/login') }}>Logout</Button>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  )
}
