import React, { useState } from 'react'
import { Box, Button, Paper, Stack, TextField, Typography, Alert } from '@mui/material'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../lib/api'
import { useAuth } from '../state/AuthContext.jsx'

export default function Register() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const { login } = useAuth()
  const nav = useNavigate()

  const onSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post('/api/auth/register', { name, email, password })
      login(res.data.token, res.data.user)
      nav('/')
    } catch (e) {
      setError(e?.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <Box display="flex" justifyContent="center" mt={8}>
      <Paper sx={{ p: 3, width: 400 }} className="glass">
        <Typography variant="h5" gutterBottom>Register</Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={onSubmit}>
          <Stack spacing={2}>
            <TextField label="Full name" value={name} onChange={(e)=>setName(e.target.value)} required fullWidth />
            <TextField label="Email" type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required fullWidth />
            <TextField label="Password" type="password" value={password} onChange={(e)=>setPassword(e.target.value)} required fullWidth />
            <Button type="submit" className="btn-gradient">Create account</Button>
            <Typography variant="body2">Have an account? <Link to="/login">Login</Link></Typography>
          </Stack>
        </form>
      </Paper>
    </Box>
  )
}
