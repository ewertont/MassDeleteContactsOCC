require('dotenv').config();
const axios = require('axios');
const { getToken } = require('./auth');

const baseUrl = process.env.BASE_URL;

async function listProfileRequests() {
  try {
    const token = await getToken();
    const response = await axios.get(`${baseUrl}/ccadmin/v1/profileRequests`, {
      headers: {
        'X-CCAsset-Language': 'en',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      params: {
        fields: 'id',
        sort: 'createdTime:desc',
        q: '(status EQ "new")',
      },
    });

    console.log('Status code is 200');
    const contactRequestArray = response.data.items.map((profile) => profile.id);
    console.log('contactRequestArray:', contactRequestArray);
    return contactRequestArray;
  } catch (error) {
    console.error('Error fetching profile requests:', error);
  }
}

async function deleteProfileRequests(contactRequestArray) {
  try {
    while (contactRequestArray.length > 0) {
      const contactRequest = contactRequestArray.shift();
      console.log('Deleting contactRequest:', contactRequest);

      const response = await axios.delete(`${baseUrl}/ccadmin/v1/profileRequests/${contactRequest}`, {
        headers: {
          'X-CCAsset-Language': 'en',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      console.log('Status code is 204');

      // Verifica se ainda há mais IDs para deletar
      if (contactRequestArray.length > 0) {
        console.log('Continuing to delete next contactRequest...');
      } else {
        console.log('All contact requests have been deleted.');
      }
    }
  } catch (error) {
    console.error('Error deleting profile requests:', error);
  }
}

async function main() {
  try {
    const contactRequestArray = await listProfileRequests();
    if (contactRequestArray && contactRequestArray.length > 0) {
      await deleteProfileRequests(contactRequestArray);
    } else {
      console.log('No contact requests found.');
    }
  } catch (error) {
    console.error('Error in main function:', error);
  }
}

main();
