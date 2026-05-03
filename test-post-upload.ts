import fs from 'fs';
import { User, Song, initDB } from './src/server/models';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'sreedhar-play-secret-key-premium-vibes';

async function testUploadPost() {
  await initDB();
  const [user]: any = await User.findOrCreate({ where: { email: 'fetch2@test.com' }, defaults: { username: 'fetch_user2', password: 'password' } });
  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET);

  fs.writeFileSync('dummy.mp3', 'dummy data here');
  fs.writeFileSync('dummy.png', 'dummy image here');

  const form = new FormData();
  form.append('song', new Blob([fs.readFileSync('dummy.mp3')]), 'dummy.mp3');
  form.append('cover', new Blob([fs.readFileSync('dummy.png')]), 'dummy.png');
  form.append('title', 'My Hit');
  form.append('artist', 'Fetch Artist');

  const res = await fetch('http://127.0.0.1:3000/api/v1/songs/upload', {
    method: 'POST',
    body: form,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  console.log("Status:", res.status);
  console.log("Response:", await res.text());
  
  const fetchedUser: any = await User.findByPk(user.id, { include: [{ model: Song }] });
  console.log("User songs:", fetchedUser?.songs.map((s: any) => s.toJSON()));
}

testUploadPost();
