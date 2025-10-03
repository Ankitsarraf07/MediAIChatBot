import React, { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from '@mui/material'
import { api } from '../lib/api'
import Lottie from 'react-lottie-player'

export default function Chat() {
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!scrollRef.current) return
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const send = async () => {
    const text = input.trim()
    if (!text) return
    setInput('')
    setError('')
    setLoading(true)

    try {
      if (!conversationId) {
        const res = await api.post('/api/triage/start', { message: text })
        setConversationId(res.data.conversationId)
        setMessages((prev) => [...prev, { role: 'user', content: text }, { role: 'assistant', content: res.data.message }])
      } else {
        setMessages((prev) => [...prev, { role: 'user', content: text }])
        const res = await api.post('/api/triage/message', { conversationId, message: text })
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data.message }])
      }
    } catch (e) {
      setError(e?.response?.data?.error || 'Failed to send message')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = (e) => {
    e.preventDefault()
    send()
  }

  return (
    <Stack spacing={2} className="chat-container">
      <Paper sx={{ p: 2 }} className="glass">
        <Typography variant="h5">Healthcare Triage Chat</Typography>
        <Typography className="disclaimer">
          This tool provides general triage guidance only and is not a substitute for professional medical advice, diagnosis, or treatment. If you are experiencing a medical emergency, call your local emergency number immediately.
        </Typography>
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="messages glass" ref={scrollRef}>
        <Box display="flex" flexDirection="column">
          {messages.map((m, i) => (
            <Box key={i} className={`msg ${m.role}`}>{m.content}</Box>
          ))}
          {loading && (
            <Box className={`msg assistant`} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Lottie
                loop
                play
                src="https://assets9.lottiefiles.com/packages/lf20_p8bfn5to.json"
                style={{ width: 64, height: 64 }}
              />
              <Typography variant="body2" color="text.secondary">Thinking…</Typography>
            </Box>
          )}
        </Box>
      </Paper>

      <form onSubmit={onSubmit} className="composer">
        <TextField
          placeholder="Describe your symptoms..."
          value={input}
          onChange={(e)=>setInput(e.target.value)}
          fullWidth
          multiline
          maxRows={4}
        />
        <Button type="submit" className="btn-gradient" disabled={loading}>Send</Button>
      </form>
    </Stack>
  )
}
