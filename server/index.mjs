import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import {
  PreferenceModel,
  SessionModel,
  SoundPresetModel,
  TaskModel,
} from './models.mjs';

const PORT = Number(process.env.PORT || 5102);
const MONGODB_URI =
  process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tempo_timer';

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

let dbConnected = false;

async function connectDB() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 4000,
    });
    dbConnected = true;
    console.log(`[tempo-api] Connected to MongoDB at ${MONGODB_URI}`);
  } catch (err) {
    dbConnected = false;
    console.error('[tempo-api] MongoDB connection error:', err.message);
  }
}

mongoose.connection.on('disconnected', () => {
  dbConnected = false;
});
mongoose.connection.on('connected', () => {
  dbConnected = true;
});

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    mongodb: dbConnected ? 'connected' : 'disconnected',
  });
});

app.get('/api/bootstrap', async (_req, res) => {
  if (!dbConnected) {
    return res.status(503).json({ error: 'MongoDB not connected' });
  }
  try {
    const [sessions, tasks, prefsDoc, soundPresets] = await Promise.all([
      SessionModel.find().sort({ startedAt: -1 }).limit(500).lean(),
      TaskModel.find().sort({ createdAt: -1 }).lean(),
      PreferenceModel.findOne({ key: 'default' }).lean(),
      SoundPresetModel.find().sort({ createdAt: -1 }).lean(),
    ]);
    res.json({
      sessions,
      tasks,
      preferences: prefsDoc || null,
      soundPresets,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Sessions
app.post('/api/sessions', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const payload = req.body;
    const saved = await SessionModel.findOneAndUpdate(
      { id: payload.id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/sessions', async (_req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    await SessionModel.deleteMany({});
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Tasks
app.post('/api/tasks', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const payload = req.body;
    const saved = await TaskModel.findOneAndUpdate(
      { id: payload.id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.patch('/api/tasks/:id', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const updated = await TaskModel.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true },
    ).lean();
    if (!updated) return res.status(404).json({ error: 'Task not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    await TaskModel.deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Preferences & Active Ambient Mix
app.put('/api/preferences', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const updated = await PreferenceModel.findOneAndUpdate(
      { key: 'default' },
      { $set: { ...req.body, key: 'default' } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Custom Sound Mix Presets
app.get('/api/presets', async (_req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const list = await SoundPresetModel.find().sort({ createdAt: -1 }).lean();
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/presets', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    const payload = req.body;
    const saved = await SoundPresetModel.findOneAndUpdate(
      { id: payload.id },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    ).lean();
    res.status(201).json(saved);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/presets/:id', async (req, res) => {
  if (!dbConnected) return res.status(503).json({ error: 'MongoDB not connected' });
  try {
    await SoundPresetModel.deleteOne({ id: req.params.id });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[tempo-api] Listening on http://localhost:${PORT}`);
  });
});
