const axios = require('axios');

async function fetch(endpoint, accessToken) {
  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  try {
    const response = await axios.get(endpoint, options);
    return await response.data;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = fetch;
