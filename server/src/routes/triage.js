import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import { getOpenAI } from '../lib/openai.js';

const router = Router();

const startSchema = z.object({
  title: z.string().min(1).max(120).optional(),
  message: z.string().min(1),
});

const messageSchema = z.object({
  conversationId: z.string(),
  message: z.string().min(1),
});

const disclaimer =
  'You are a healthcare triage assistant. Provide general guidance and risk assessment only. ' +
  'Do NOT provide diagnoses or treatment prescriptions. If symptoms are severe or life-threatening, advise to seek emergency care. ' +
  'Keep responses concise, step-by-step, and ask clarifying questions when needed.';

router.post('/start', requireAuth, async (req, res) => {
  try {
    const { title, message } = startSchema.parse(req.body);

    const convo = await Conversation.create({
      userId: req.user.id,
      title: title || message.slice(0, 50),
      messages: [
        { role: 'system', content: disclaimer },
        { role: 'user', content: message },
      ],
    });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.2,
    });

    const ai = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';

    convo.messages.push({ role: 'assistant', content: ai });
    await convo.save();

    res.status(201).json({ conversationId: convo._id, message: ai });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Invalid input', details: err.issues });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/message', requireAuth, async (req, res) => {
  try {
    const { conversationId, message } = messageSchema.parse(req.body);

    const convo = await Conversation.findOne({ _id: conversationId, userId: req.user.id });
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });

    convo.messages.push({ role: 'user', content: message });

    const openai = getOpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: convo.messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: 0.2,
    });

    const ai = completion.choices?.[0]?.message?.content?.trim() || 'I could not generate a response.';
    convo.messages.push({ role: 'assistant', content: ai });
    await convo.save();

    res.json({ message: ai });
  } catch (err) {
    if (err?.issues) return res.status(400).json({ error: 'Invalid input', details: err.issues });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversations', requireAuth, async (req, res) => {
  try {
    const items = await Conversation.find({ userId: req.user.id })
      .sort({ updatedAt: -1 })
      .select({ messages: { $slice: -1 }, title: 1, updatedAt: 1 });
    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/conversations/:id', requireAuth, async (req, res) => {
  try {
    const convo = await Conversation.findOne({ _id: req.params.id, userId: req.user.id });
    if (!convo) return res.status(404).json({ error: 'Conversation not found' });
    res.json({ conversation: convo });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
