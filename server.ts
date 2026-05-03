import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { fileURLToPath } from 'url';
import * as mm from 'music-metadata';
import { initDB, User, Song, Like, Comment, Follow, Playlist, PlayHistory, sequelize } from './src/server/models';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JWT_SECRET = process.env.JWT_SECRET || 'sreedhar-play-secret-key-premium-vibes';

async function startServer() {
  // Ensure static directories exist
  const dirs = ['static/profile_pics', 'static/music', 'static/cover_art'];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  try {
    await initDB();
    console.log('Database initialized successfully');
  } catch (e) {
    console.error('Failed to initialize database:', e);
    // Continue starting server even if DB fails, so we can see the app
  }
  
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());
  app.use('/static', express.static(path.join(__dirname, 'static')));

  // Auth Middleware
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, async (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      
      // Verify user actually exists in DB
      try {
        const dbUser = await User.findByPk(user.userId);
        if (!dbUser) return res.sendStatus(401);
        req.user = user;
        next();
      } catch (e) {
        return res.sendStatus(500);
      }
    });
  };

  // Optional: Global Proxy for external audio files
  app.get('/api/v1/proxy', async (req, res) => {
    try {
      const url = req.query.url as string;
      if (!url) return res.status(400).json({ error: 'URL is required' });
      const response = await fetch(url);
      if (!response.ok) return res.status(response.status).json({ error: 'Failed' });
      const arrayBuffer = await response.arrayBuffer();
      res.set('Content-Type', response.headers.get('content-type') || 'application/octet-stream');
      res.send(Buffer.from(arrayBuffer));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- API Routes ---

  // Auth
  app.post('/api/v1/auth/signup', async (req, res) => {
    try {
      const { username, email, password } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const DEFAULT_AVATARS = [
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Felix&backgroundColor=b6e3f4',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka&backgroundColor=c0aede',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Sasha&backgroundColor=d1d4f9',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Max&backgroundColor=ffd5dc',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Luna&backgroundColor=ffdfbf',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Oliver&backgroundColor=b6e3f4',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Mia&backgroundColor=c0aede',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Leo&backgroundColor=d1d4f9',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Zoe&backgroundColor=ffd5dc',
        'https://api.dicebear.com/7.x/adventurer/svg?seed=Kai&backgroundColor=ffdfbf'
      ];
      const randomAvatar = DEFAULT_AVATARS[Math.floor(Math.random() * DEFAULT_AVATARS.length)];

      const user: any = await User.create({ username, email, password: hashedPassword, image_file: randomAvatar });
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
      res.json({ message: 'User created', token, user: { id: user.id, username: user.username, email: user.email, image_file: user.image_file } });
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/v1/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user: any = await User.findOne({ where: { email } });
      if (!user || !(await bcrypt.compare(password, user.password))) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);
      res.json({ token, user: { id: user.id, username: user.username, email: user.email, image_file: user.image_file } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Profile Edit
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'avatar') {
        cb(null, 'static/profile_pics/');
      } else if (file.fieldname === 'song') {
        cb(null, 'static/music/');
      } else if (file.fieldname === 'cover') {
        cb(null, 'static/cover_art/');
      }
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      let ext = path.extname(file.originalname);
      if (!ext) {
        if (file.mimetype === 'audio/mpeg') ext = '.mp3';
        else if (file.mimetype === 'audio/wav') ext = '.wav';
        else if (file.mimetype === 'audio/ogg') ext = '.ogg';
        else ext = '.mp3'; // fallback
      }
      cb(null, uniqueSuffix + ext);
    }
  });

  const uploadMiddleware = multer({ 
    storage,
    limits: { fileSize: 250 * 1024 * 1024 }, // 250MB max
    fileFilter: (req, file, cb) => {
      if (file.fieldname === 'song') {
        const allowedExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.dsf', '.dff', '.ape', '.ogg', '.aac', '.alac'];
        const ext = path.extname(file.originalname).toLowerCase();
        
        const isAudioMime = file.mimetype.startsWith('audio/') || file.mimetype === 'video/mp4'; // Sometimes m4a is video/mp4
        const isValidExt = allowedExtensions.includes(ext);
        
        if (!isAudioMime && !isValidExt) {
           return cb(new Error('Invalid file type: Song must be an audio file.'));
        }
      }
      if (file.fieldname === 'cover' && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Invalid file type: Cover must be an image.'));
      }
      if (file.fieldname === 'avatar' && !file.mimetype.startsWith('image/')) {
        return cb(new Error('Invalid file type: Avatar must be an image.'));
      }
      cb(null, true);
    }
  });

  const uploadFields = uploadMiddleware.fields([{ name: 'song', maxCount: 1 }, { name: 'cover', maxCount: 1 }]);
  const uploadAvatar = uploadMiddleware.single('avatar');

  app.post('/api/v1/profile/edit', authenticateToken, (req: any, res: any, next: any) => {
    uploadAvatar(req, res, function (err: any) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'Avatar file is too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      const { username, bio, image_url } = req.body;
      const userId = req.user.userId;
      const user: any = await User.findByPk(userId);
      
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (username) user.username = username;
      if (bio) user.bio = bio;
      if (req.file) {
        user.image_file = `/static/profile_pics/${req.file.filename}`;
      } else if (image_url) {
        user.image_file = image_url;
      }

      await user.save();
      res.json({ message: 'Profile updated', user: { username: user.username, bio: user.bio, image_file: user.image_file } });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Playlist Management
  app.post('/api/v1/playlist/create', authenticateToken, async (req: any, res) => {
    try {
      const { name, description } = req.body;
      const playlist = await Playlist.create({ name, description, userId: req.user.userId });
      res.json(playlist);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/v1/playlist/:playlistId/update', authenticateToken, async (req: any, res) => {
    try {
      const { name, description } = req.body;
      const playlist: any = await Playlist.findOne({ where: { id: req.params.playlistId, userId: req.user.userId } });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      
      if (name) playlist.name = name;
      if (description) playlist.description = description;
      await playlist.save();
      
      res.json(playlist);
    } catch (e: any) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post('/api/v1/delete_playlist/:playlistId', authenticateToken, async (req: any, res) => {
    try {
      const { playlistId } = req.params;
      await Playlist.destroy({ where: { id: playlistId, userId: req.user.userId } });
      res.json({ message: 'Playlist deleted', playlistId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/v1/playlist/:playlistId/add_song', authenticateToken, async (req: any, res) => {
    try {
      const { playlistId } = req.params;
      const { songId } = req.body;
      const playlist: any = await Playlist.findOne({ where: { id: playlistId, userId: req.user.userId } });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      await sequelize.models.playlist_songs.create({ playlistId, songId });
      res.json({ message: 'Song added to playlist', playlistId, songId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/v1/playlist/:playlistId/remove_song', authenticateToken, async (req: any, res) => {
    try {
      const { playlistId } = req.params;
      const { songId } = req.body;
      const playlist: any = await Playlist.findOne({ where: { id: playlistId, userId: req.user.userId } });
      if (!playlist) return res.status(404).json({ error: 'Playlist not found' });
      await sequelize.models.playlist_songs.destroy({ where: { playlistId, songId } });
      res.json({ message: 'Song removed from playlist', playlistId, songId });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/songs', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = (page - 1) * limit;

      const songs = await Song.findAll({
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [{ model: User, attributes: ['username', 'image_file'] }]
      });
      res.json(songs.map((t: any) => {
        const trackData = t.toJSON();
        return {
          ...trackData,
          audioUrl: trackData.file_path,
          cover: trackData.cover_image,
        };
      }));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Check song updates
  app.post('/api/v1/songs/check_updates', async (req: any, res) => {
    try {
      const { songIds } = req.body;
      if (!songIds || !Array.isArray(songIds)) {
        return res.status(400).json({ error: 'songIds must be an array' });
      }
      
      const songs = await Song.findAll({
        where: { id: songIds },
        attributes: ['id', 'updatedAt']
      });
      
      const updates = songs.reduce((acc: any, s: any) => {
        acc[s.id] = s.updatedAt;
        return acc;
      }, {});
      
      res.json(updates);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Media Feed
  app.get('/api/v1/feed', async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const songs = await Song.findAll({ 
        order: [['createdAt', 'DESC']],
        limit,
        offset,
        include: [{ model: User, attributes: ['username', 'image_file'] }]
      });
      res.json(songs.map((s: any) => {
        const data = s.toJSON();
        return {
          ...data,
          audioUrl: data.file_path,
          cover: data.cover_image,
        };
      }));
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/v1/songs/upload', authenticateToken, (req: any, res: any, next: any) => {
    uploadFields(req, res, function (err: any) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File is too large. Maximum size is 50MB.' });
        }
        return res.status(400).json({ error: err.message });
      } else if (err) {
        return res.status(400).json({ error: err.message });
      }
      next();
    });
  }, async (req: any, res: any) => {
    try {
      const { title, artist } = req.body;
      const userId = req.user.userId;
      
      const songFile = req.files['song'] ? req.files['song'][0] : null;
      const coverFile = req.files['cover'] ? req.files['cover'][0] : null;

      if (!songFile) return res.status(400).json({ error: 'Song file is required' });

      // Extract metadata using music-metadata
      let duration = 0;
      let quality = '320kbps'; // fallback
      try {
        const metadata = await mm.parseFile(songFile.path);
        duration = Math.round(metadata.format.duration || 0);
        
        if (metadata.format.lossless) {
          quality = 'Lossless (HQ)';
        } else if (metadata.format.bitrate) {
          quality = `${Math.round(metadata.format.bitrate / 1000)}kbps`;
        }
      } catch (err) {
        console.error('Metadata extraction failed, falling back to random duration', err);
        duration = Math.floor(Math.random() * 120) + 180; // mock 3-5 mins
      }

      let file_path = `/static/music/${songFile.filename}`;
      let cover_image = coverFile ? `/static/cover_art/${coverFile.filename}` : '/static/default_cover.jpg';

      if (process.env.CLOUDINARY_URL) {
        try {
          console.log('CLOUDINARY_URL found, uploading audio and cover...');
          const audioUpload = await cloudinary.uploader.upload(songFile.path, {
            resource_type: 'video'
          });
          file_path = audioUpload.secure_url;

          if (coverFile) {
            const coverUpload = await cloudinary.uploader.upload(coverFile.path, {
              resource_type: 'image'
            });
            cover_image = coverUpload.secure_url;
          }
        } catch (err: any) {
          console.error('Cloudinary upload error:', err.message);
        }
      }

      console.log('Upload debug:', { title, artist, file_path, userId, duration, quality });
      console.log('User id exists:', !!await User.findByPk(userId));

      let song;
      try {
        song = await Song.create({
          title: title || songFile.originalname.split('.')[0],
          artist: artist || req.user.username,
          file_path,
          cover_image,
          duration,
          quality,
          userId
        });
      } catch (e: any) {
        console.error('Song.create ERROR!', e.message, 'Data:', { title, artist, userId });
        const dbUser: any = await User.findByPk(userId);
        console.error('dbUser verification at crash:', !!dbUser, dbUser?.id);
        throw e;
      }

      const songData = song.toJSON();
      res.json({
        ...songData,
        audioUrl: songData.file_path,
        cover: songData.cover_image,
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Delete Song
  app.delete('/api/v1/songs/:songId', authenticateToken, async (req: any, res) => {
    try {
      const song: any = await Song.findByPk(req.params.songId);
      if (!song) return res.status(404).json({ error: 'Song not found' });
      
      // Ensure only the owner can delete
      if (song.userId !== req.user.userId) {
        return res.status(403).json({ error: 'Unauthorized to delete this song' });
      }

      // Delete physical files
      const audioPath = path.join(__dirname, song.file_path);
      if (fs.existsSync(audioPath)) fs.unlinkSync(audioPath);
      
      if (song.cover_image && !song.cover_image.includes('default_cover')) {
        const coverPath = path.join(__dirname, song.cover_image);
        if (fs.existsSync(coverPath)) fs.unlinkSync(coverPath);
      }

      await song.destroy();
      res.json({ message: 'Song deleted successfully' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Get Comments for a Song
  app.get('/api/v1/songs/:songId/comments', async (req, res) => {
    try {
      const comments = await Comment.findAll({
        where: { songId: req.params.songId },
        include: [{ model: User, attributes: ['id', 'username', 'image_file'] }],
        order: [['createdAt', 'DESC']]
      });
      res.json(comments);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Add Comment to a Song
  app.post('/api/v1/songs/:songId/comments', authenticateToken, async (req: any, res) => {
    try {
      const { content } = req.body;
      if (!content || content.trim() === '') {
        return res.status(400).json({ error: 'Comment content is required' });
      }

      const comment: any = await Comment.create({
        content: content.trim(),
        songId: req.params.songId,
        userId: req.user.userId
      });

      // Fetch back with user details to return immediately
      const commentWithUser = await Comment.findByPk(comment.id, {
        include: [{ model: User, attributes: ['id', 'username', 'image_file'] }]
      });

      res.json(commentWithUser);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Analytics: Record Play
  app.post('/api/v1/record_play/:songId', authenticateToken, async (req: any, res) => {
    try {
      await PlayHistory.create({ userId: req.user.userId, songId: req.params.songId });
      res.json({ status: 'ok' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Dashboard for Artists
  app.get('/api/v1/dashboard', authenticateToken, async (req: any, res) => {
    try {
      const userId = req.user.userId;
      const songs: any = await Song.findAll({ where: { userId } });
      const totalSongs = songs.length;
      
      // Simple aggregation
      const songIds = songs.map((s: any) => s.id);
      const totalPlays = await PlayHistory.count({ where: { songId: songIds } });
      const followerCount = await Follow.count({ where: { followed_id: userId } });

      res.json({ 
        totalSongs, 
        totalPlays, 
        followerCount, 
        songs: songs.map((s: any) => {
          const data = s.toJSON();
          return {
            ...data,
            audioUrl: data.file_path,
            cover: data.cover_image,
          };
        }) 
      });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Profile
  app.get('/api/v1/profile/:userId', async (req, res) => {
    try {
      const user: any = await User.findByPk(req.params.userId, {
        attributes: ['id', 'username', 'bio', 'image_file'],
        include: [
            { model: Song },
            { 
              model: Playlist,
              include: [{ model: Song }]
            },
            { 
              model: Like,
              include: [{ model: Song }] 
            }
        ]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const mapTrack = (track: any) => {
        if (!track) return null;
        const t = track.toJSON ? track.toJSON() : track;
        return {
          ...t,
          audioUrl: t.file_path,
          cover: t.cover_image,
        };
      };

      const responseData = {
        id: user.id,
        username: user.username,
        bio: user.bio,
        image_file: user.image_file,
        uploads: (user.songs || []).map(mapTrack),
        playlists: user.playlists?.map((p: any) => ({
          ...p.toJSON(),
          tracks: (p.songs || []).map(mapTrack),
          songs: p.songs?.length || 0
        })) || [],
        likes: user.likes?.map((l: any) => l.song).filter(Boolean).map(mapTrack) || []
      };

      res.json(responseData);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Social: Like
  app.post('/api/v1/songs/:songId/like', authenticateToken, async (req: any, res) => {
    try {
      const { songId } = req.params;
      const userId = req.user.userId;
      const existingLike = await Like.findOne({ where: { userId, songId } });
      if (existingLike) {
        await existingLike.destroy();
        return res.json({ status: 'unliked', liked: false });
      }
      await Like.create({ userId, songId });
      res.json({ status: 'liked', liked: true });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Social: Follow
  app.post('/api/v1/toggle_follow/:followedId', authenticateToken, async (req: any, res) => {
    try {
      const { followedId } = req.params;
      const followerId = req.user.userId;
      if (followedId === followerId) return res.status(400).json({ error: "Can't follow yourself" });
      
      const existingFollow = await Follow.findOne({ where: { follower_id: followerId, followed_id: followedId } });
      if (existingFollow) {
        await existingFollow.destroy();
        return res.json({ status: 'unfollowed' });
      }
      await Follow.create({ follower_id: followerId, followed_id: followedId });
      res.json({ status: 'followed' });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/profile/:userId/followers', async (req, res) => {
    try {
      const user: any = await User.findByPk(req.params.userId, {
        include: [{ model: User, as: 'Followers', attributes: ['id', 'username', 'image_file', 'bio'] }]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user.Followers || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/v1/profile/:userId/following', async (req, res) => {
    try {
      const user: any = await User.findByPk(req.params.userId, {
        include: [{ model: User, as: 'Following', attributes: ['id', 'username', 'image_file', 'bio'] }]
      });
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user.Following || []);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- End API Routes ---

  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  const jams = new Map();

  io.on('connection', (socket) => {
    socket.on('join-jam', ({ jamId, user }) => {
      const realUserId = user.id || user.userId;
      let jam = jams.get(jamId);
      if (!jam) {
        jam = {
          id: jamId,
          hostId: realUserId,
          name: `${user.username}'s Jam`,
          members: [],
          queue: [],
          currentTrack: null,
          isPlaying: false,
          progress: 0,
        };
        jams.set(jamId, jam);
      }
      
      if (jam.members.length >= 32) {
        socket.emit('jam-error', { message: 'Jam is full (max 32 members)' });
        return;
      }

      socket.join(jamId);
      
      const existingMember = jam.members.find((m: any) => m.userId === realUserId);
      if (!existingMember) {
        jam.members.push({ ...user, userId: realUserId, avatar_url: user.image_file || user.avatar_url, isHost: jam.hostId === realUserId });
      }

      io.to(jamId).emit('jam-update', jam);
    });

    socket.on('leave-jam', ({ jamId, userId }) => {
      socket.leave(jamId);
      const jam = jams.get(jamId);
      if (jam) {
        jam.members = jam.members.filter((m: any) => m.userId !== userId);
        if (jam.members.length === 0) {
          jams.delete(jamId);
        } else {
          // Reassign host if host left
          if (jam.hostId === userId && jam.members.length > 0) {
            jam.hostId = jam.members[0].userId;
            jam.members[0].isHost = true;
          }
          io.to(jamId).emit('jam-update', jam);
        }
      }
    });

    socket.on('add-to-queue', ({ jamId, track }) => {
      const jam = jams.get(jamId);
      if (jam) {
        // Prevent duplicates in queue slightly
        if (!jam.queue.find((t: any) => t.id === track.id)) {
          jam.queue.push(track);
          // If nothing is playing, start playing first track
          if (!jam.currentTrack) {
            jam.currentTrack = jam.queue.shift();
            jam.isPlaying = true;
          }
          io.to(jamId).emit('jam-update', jam);
        }
      }
    });

    socket.on('player-state-change', ({ jamId, state }) => {
      const jam = jams.get(jamId);
      if (jam) {
        if (state.currentTrack !== undefined) jam.currentTrack = state.currentTrack;
        if (state.isPlaying !== undefined) jam.isPlaying = state.isPlaying;
        if (state.progress !== undefined) jam.progress = state.progress;
        
        socket.to(jamId).emit('jam-sync', {
          currentTrack: jam.currentTrack,
          isPlaying: jam.isPlaying,
          progress: jam.progress
        });
      }
    });
    
    socket.on('next-track', ({ jamId }) => {
      const jam = jams.get(jamId);
      if (jam) {
        if (jam.queue.length > 0) {
          jam.currentTrack = jam.queue.shift();
          jam.progress = 0;
          jam.isPlaying = true;
        } else {
          jam.currentTrack = null;
          jam.isPlaying = false;
        }
        io.to(jamId).emit('jam-update', jam);
      }
    });
    
    socket.on('remove-from-queue', ({ jamId, trackId }) => {
      const jam = jams.get(jamId);
      if (jam) {
        jam.queue = jam.queue.filter((t: any) => t.id !== trackId);
        io.to(jamId).emit('jam-update', jam);
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
