// auth.js
require('dotenv').config();
const axios = require('axios');
const moment = require('moment');

let token = '';
let tokenExpiration = null;

async function getToken() {
  if (!token || moment().isAfter(tokenExpiration)) {
    console.log('Token expired, requesting new one...');
    const response = await axios.post(
      `${process.env.BASE_URL}/ccadmin/v1/login`,
      {
        grant_type: 'client_credentials',
      },
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
          Authorization: `Bearer ${process.env.AUTENTIC}`,
        },
      },
    );

    token = response.data.access_token;
    tokenExpiration = moment().add(response.data.expires_in - 1, 's');
  }
  return token;
}

module.exports = { getToken };
