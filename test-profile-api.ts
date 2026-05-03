import { initDB, User, Song } from './src/server/models';
import fetch from 'node-fetch';

async function testProfileAndUploadAPI() {
  await initDB();
  const user: any = await User.create({ username: 'profile_test', email: 'profile@test.com', password: 'password' });

  const profileRes = await fetch(`http://127.0.0.1:3000/api/v1/profile/${user.id}`);
  console.log("Profile API status:", profileRes.status);
  console.log("Profile API response:", await profileRes.json());
}
testProfileAndUploadAPI();
