const axios = require('axios');

async function fetchpost(endpoint, accessToken, body) {
    const options = {
        headers: {
            Authorization: `Bearer ${accessToken}`
        }
    };

    console.log(`request made to ${endpoint} at: ` + new Date().toString());

    try {
        const response = await axios.post(endpoint, body, options);
        return await response.data;
    } catch (error) {
        throw new Error(error);
    }
}

module.exports = fetchpost;