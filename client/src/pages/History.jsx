import React, { useEffect, useState } from 'react'
import { Alert, Box, CircularProgress, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from '@mui/material'
import { api } from '../lib/api'

function flattenPairs(conversation) {
  const out = []
  const msgs = conversation?.messages || []
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i]
    if (m.role === 'user') {
      let reply = null
      for (let j = i + 1; j < msgs.length; j++) {
        if (msgs[j].role === 'assistant') { reply = msgs[j]; break }
      }
      out.push({
        conversationId: conversation._id,
        conversationTitle: conversation.title,
        askedAt: m.at || conversation.createdAt,
        question: m.content,
        repliedAt: reply?.at || null,
        answer: reply?.content || null,
        updatedAt: conversation.updatedAt,
      })
    }
  }
  return out
}

export default function History() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [rows, setRows] = useState([])
  const [q, setQ] = useState('')
  const [expanded, setExpanded] = useState(new Set())

  const toggleExpanded = (idx) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(idx)) next.delete(idx)
      else next.add(idx)
      return next
    })
  }

  useEffect(() => {
    const run = async () => {
      setLoading(true)
      setError('')
      try {
        // Get the list of conversations for the user
        const list = await api.get('/api/triage/conversations')
        const items = list.data.items || []
        // Fetch each conversation detail in parallel
        const details = await Promise.all(
          items.map((it) => api.get(`/api/triage/conversations/${it._id || it.id || it.conversationId || it?.conversation?._id || ''}`).catch(() => null))
        )
        const convos = details
          .map((r) => r?.data?.conversation)
          .filter(Boolean)
        const pairs = convos.flatMap(flattenPairs)
        // Sort by updatedAt desc
        pairs.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        setRows(pairs)
      } catch (e) {
        setError(e?.response?.data?.error || 'Failed to load history')
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [])

  const filtered = q
    ? rows.filter((r) =>
        (r.question && r.question.toLowerCase().includes(q.toLowerCase())) ||
        (r.answer && r.answer.toLowerCase().includes(q.toLowerCase()))
      )
    : rows

  return (
    <Stack spacing={2}>
      <Paper sx={{ p: 2 }} className="glass">
        <Typography variant="h5">Your History</Typography>
        <Typography variant="body2" color="text.secondary">Asked questions and assistant replies</Typography>
      </Paper>

      <Paper sx={{ p: 2 }} className="glass">
        <TextField
          placeholder="Search your history by question or answer"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          fullWidth
          size="small"
        />
      </Paper>

      {error && <Alert severity="error">{error}</Alert>}

      <Paper className="glass">
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Asked</TableCell>
                <TableCell>Replied</TableCell>
                <TableCell>Question</TableCell>
                <TableCell>Answer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box display="flex" alignItems="center" gap={1}><CircularProgress size={18} /> Loading...</Box>
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" color="text.secondary">No results</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row, idx) => {
                  const isOpen = expanded.has(idx)
                  return (
                  <TableRow key={idx} hover>
                    <TableCell>{row.askedAt ? new Date(row.askedAt).toLocaleString() : '—'}</TableCell>
                    <TableCell>{row.repliedAt ? new Date(row.repliedAt).toLocaleString() : '—'}</TableCell>
                    <TableCell style={{ maxWidth: 400 }}>
                      <Typography variant="body2" noWrap title={row.question}>{row.question}</Typography>
                    </TableCell>
                    <TableCell
                      onClick={() => toggleExpanded(idx)}
                      style={{
                        maxWidth: isOpen ? '100%' : 400,
                        maxHeight: isOpen ? 'none' : 120,
                        overflow: isOpen ? 'visible' : 'hidden',
                        cursor: 'pointer',
                        transition: 'all 180ms ease',
                      }}
                      title={isOpen ? '' : 'Click to expand'}
                    >
                      <Typography
                        variant="body2"
                        noWrap={!isOpen}
                        title={row.answer || ''}
                        sx={{ whiteSpace: isOpen ? 'normal' : 'nowrap' }}
                      >
                        {row.answer || '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                )})
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Stack>
  )
}
