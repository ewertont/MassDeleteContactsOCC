require('dotenv').config();
const axios = require('axios');
const { getToken } = require('./auth');

const baseUrl = process.env.BASE_URL;
const PAGE_SIZE = 250;

async function listOrganizations(offset = 0) {
  const token = await getToken();
  const response = await axios.get(`${baseUrl}/ccadmin/v1/organizations`, {
    headers: {
      'X-CCAsset-Language': 'en',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    params: {
      useAdvancedQParser: true,
      offset: offset,
      allMembersCount: true,
      fields: 'id,name,customer_number,allMembersCount',
      sort: 'name:asc',
    },
  });

  return response.data;
}

async function processOrganizations() {
  let offset = 0;
  let orgArray = [];
  let totalResults = 0;

  do {
    const data = await listOrganizations(offset);
    totalResults = data.totalResults;

    data.items.forEach((org) => {
      if (org.allMembersCount !== 0) {
        orgArray.push(org);
      }
    });

    offset += PAGE_SIZE;

    console.log('Processed organizations:', orgArray.length);
  } while (offset < totalResults);

  return orgArray;
}

async function listProfiles(currentOrg) {
  const token = await getToken();
  const response = await axios.get(`${baseUrl}/ccadmin/v1/profiles`, {
    headers: {
      'X-CCAsset-Language': 'en',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    params: {
      useAdvancedQParser: true,
      sort: 'firstName:asc',
      fields: 'id',
      q: `(parentOrganization EQ "${currentOrg}" OR secondaryOrganizations.id EQ "${currentOrg}")`,
    },
  });

  return response.data;
}

async function processProfiles(orgArray) {
  let profileArray = [];

  while (orgArray.length > 0) {
    const currentOrg = orgArray.shift().id;
    console.log(`Processing profiles for organization: ${currentOrg}`);
    const data = await listProfiles(currentOrg);

    data.items.forEach((profile) => {
      profileArray.push(profile.id);
    });

    console.log('Profiles found:', profileArray.length);
  }

  return profileArray;
}

async function getOrganizationDetails(orgId) {
  const token = await getToken();
  const response = await axios.get(`${baseUrl}/ccadmin/v1/organizations/${orgId}`, {
    headers: {
      'X-CCAsset-Language': 'en',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
}

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
  // Lista e processa as organizações
  const orgArray = await processOrganizations();
  console.log('Total organizations with members:', orgArray.length);

  // Processa perfis associados às organizações
  const profileArray = await processProfiles(orgArray);
  console.log('Total profiles:', profileArray.length);

  // Obtém detalhes das organizações e realiza validações
  for (const org of orgArray) {
    const details = await getOrganizationDetails(org.id);
    console.log(`Organization details for ${org.id}:`, details);
  }

  // Lista e deleta os perfis
  const { profileArray: profilesToDelete, profilesCount } = await listProfilesAdmin();
  console.log('profileArray: ', profilesToDelete, 'profileCount: ', profilesCount);

  for (let i = 0; i < profilesCount; i++) {
    const currentProfile = profilesToDelete.shift();
    if (currentProfile) {
      await deleteProfile(currentProfile);
    }

    if (profilesToDelete.length === 0) {
      console.log('All profiles processed, restarting list...');
      const newProfiles = await listProfilesAdmin();
      profilesToDelete.push(...newProfiles.profileArray);
    }
  }

  console.log('All profiles deleted.');
}

main();
