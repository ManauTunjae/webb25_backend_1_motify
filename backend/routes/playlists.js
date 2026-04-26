import { Router } from 'express';
import Playlist from '../models/Playlist.js';
import { requireAuth } from '../middleware/auth.js';
import { isPlaylistOwner, isPlaylistSharedWithUser } from '../middleware/ownership.js';
import User from '../models/User.js';

const router = Router();

router.get('/latest', async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: null })
      .sort({ _id: -1 })
      .limit(5)
      .populate('songs', 'title');
    res.json(playlists);
  } catch (err) {
    console.error('Latest playlists failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Current user’s playlists (requires Bearer token; optionalAuth + requireAuth).
 * Registered before GET /:id so "my" is not captured as an :id.
 */
router.get('/my', requireAuth, async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user._id })
      .populate('songs', 'title artist durationSeconds')
      .populate('user', 'email');
    res.json(playlists);
  } catch (err) {
    console.error('My playlists failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get all playlists that are publicly accessible
 */
router.get('/', async (req, res) => {
  try {
    const playlists = await Playlist.find({
      user: null,
    })
      .populate('songs', 'title artist durationSeconds')
      .populate('user', 'email');
    res.json(playlists);
  } catch (err) {
    console.error('Playlists list failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post('/my', requireAuth, async (req, res) => {
  try {
    const body = {
      name: req.body.name,
      description: req.body.description,
      songs: req.body.songs || [],
      user: req.body.user ?? req.user._id,
    };
    const playlist = await Playlist.create(body);
    await playlist.populate('songs', 'title artist durationSeconds');
    await playlist.populate('user', 'email');
    res.status(201).json(playlist);
  } catch (err) {
    console.error('Create playlist failed:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.put('/my/:id', requireAuth, isPlaylistOwner, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate('songs', 'title artist durationSeconds')
      .populate('user', 'email');
    if (!playlist) {
      console.error('Update playlist: Playlist not found');
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (err) {
    console.error('Update playlist failed:', err.message);
    res.status(400).json({ error: err.message });
  }
});

router.delete('/my/:id', requireAuth, isPlaylistOwner, async (req, res) => {
  try {
    const playlist = await Playlist.findByIdAndDelete(req.params.id);
    if (!playlist) {
      console.error('Delete playlist: Playlist not found');
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.status(204).send();
  } catch (err) {
    console.error('Delete playlist failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

/**
 * Get a publicly accessible playlist by ID (user must be null on the document).
 * Must be registered after /my so /my is not interpreted as an id.
 */
router.get('/:id', async (req, res) => {
  if(req.params.id.startsWith('shared-with-') || req.params.id.startsWith('my/')) {
    return res.status(404).json({ error: 'Endpoint not implemented correctly' });
  }
  try {
    const playlist = await Playlist.findOne({
      _id: req.params.id,
      user: null,
    })
      .populate({ path: 'songs', populate: { path: 'artist', select: 'name' } });
    if (!playlist) {
      console.error('Playlist by ID: Playlist not found');
      return res.status(404).json({ error: 'Playlist not found' });
    }
    res.json(playlist);
  } catch (err) {
    console.error('Playlist by ID failed:', err.message);
    res.status(500).json({ error: err.message });
  }
});

//TODO: add routes for
//? sahring a playlist with a user based on their email /playlists/my/:id/share
//? getting all playlists shared with "me" /playlists/shared-with-me

export default router;
