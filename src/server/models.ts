import { Sequelize, DataTypes, Model, Optional } from 'sequelize';
import path from 'path';

import * as dotenv from 'dotenv';
dotenv.config();

export const sequelize = process.env.DATABASE_URL 
  ? new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: false,
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: path.join(process.cwd(), 'database.sqlite'),
      logging: console.log,
    });

// Models Definition

export class User extends Model {}
User.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  username: { type: DataTypes.STRING, unique: true, allowNull: false },
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  image_file: { type: DataTypes.STRING, defaultValue: 'default.svg' },
  bio: { type: DataTypes.TEXT },
}, { sequelize, modelName: 'user' });

export class Song extends Model {}
Song.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  title: { type: DataTypes.STRING, allowNull: false },
  artist: { type: DataTypes.STRING, allowNull: false },
  file_path: { type: DataTypes.STRING, allowNull: false },
  cover_image: { type: DataTypes.STRING, allowNull: false },
  quality: { type: DataTypes.STRING, defaultValue: '320kbps' },
  duration: { type: DataTypes.INTEGER, defaultValue: 0 },
}, { sequelize, modelName: 'song' });

export class PlayHistory extends Model {}
PlayHistory.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, { sequelize, modelName: 'play_history' });

export class Like extends Model {}
Like.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, { sequelize, modelName: 'like' });

export class Comment extends Model {}
Comment.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  content: { type: DataTypes.TEXT, allowNull: false },
}, { sequelize, modelName: 'comment' });

export class Follow extends Model {}
Follow.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
}, { sequelize, modelName: 'follow' });

export class Playlist extends Model {}
Playlist.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  cover_image: { type: DataTypes.STRING },
}, { sequelize, modelName: 'playlist' });

// Associations
User.hasMany(Song, { onDelete: 'CASCADE' });
Song.belongsTo(User);

User.hasMany(Like, { onDelete: 'CASCADE' });
Like.belongsTo(User);
Song.hasMany(Like, { onDelete: 'CASCADE' });
Like.belongsTo(Song);

User.hasMany(Comment, { onDelete: 'CASCADE' });
Comment.belongsTo(User);
Song.hasMany(Comment, { onDelete: 'CASCADE' });
Comment.belongsTo(Song);

User.belongsToMany(User, { as: 'Followers', through: Follow, foreignKey: 'followed_id', otherKey: 'follower_id' });
User.belongsToMany(User, { as: 'Following', through: Follow, foreignKey: 'follower_id', otherKey: 'followed_id' });

User.hasMany(Playlist, { onDelete: 'CASCADE' });
Playlist.belongsTo(User);

const PlaylistSongs = sequelize.define('playlist_songs', {});
Playlist.belongsToMany(Song, { through: PlaylistSongs });
Song.belongsToMany(Playlist, { through: PlaylistSongs });

User.hasMany(PlayHistory, { onDelete: 'CASCADE' });
PlayHistory.belongsTo(User);
Song.hasMany(PlayHistory, { onDelete: 'CASCADE' });
PlayHistory.belongsTo(Song);

export async function initDB() {
  await sequelize.sync({ alter: true });
  console.log('Database synced');
}
