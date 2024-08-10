require('dotenv').config();
const axios = require('axios');
const { getToken } = require('./auth');

const baseUrl = process.env.BASE_URL;

async function listProfilesAdmin() {
  const token = await getToken();
  const response = await axios.get(`${baseUrl}/ccadmin/v1/profiles`, {
    headers: {
      'X-CCAsset-Language': 'en',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    params: {
      fields: 'id',
    },
  });

  const profileArray = response.data.items.map((profile) => profile.id);
  const profilesCount = response.data.total;

  return { profileArray, profilesCount };
}

async function deleteProfile(profileId) {
  try {
    const token = await getToken();
    await axios.delete(`${baseUrl}/ccagent/v1/profiles/${profileId}`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    console.log(`Profile ${profileId} deleted.`);
  } catch (error) {
    console.error(`Error deleting profile ${profileId}:`, error.message);
  }
}

async function main() {
  const { profileArray, profilesCount } = await listProfilesAdmin();
  console.log('profileArray: ', profileArray, 'profileCount: ', profilesCount);

  for (let i = 0; i < profilesCount; i++) {
    const currentProfile = profileArray.shift();
    if (currentProfile) {
      await deleteProfile(currentProfile);
    }

    if (profileArray.length === 0) {
      console.log('All profiles processed, restarting list...');
      const newProfiles = await listProfilesAdmin();
      profileArray.push(...newProfiles.profileArray);
    }
  }

  console.log('All profiles deleted.');
}

main();
