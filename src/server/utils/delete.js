const axios = require('axios');

async function fetchdelete(endpoint, accessToken, body) {
  const options = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  };
  try {
    const response = await axios.delete(endpoint, body, options);
    return await response.data;
  } catch (error) {
    throw new Error(error);
  }
}

module.exports = fetchdelete;
