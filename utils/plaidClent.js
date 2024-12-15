const { PlaidApi } = require('plaid');

async function refressAccessToken(accessToken) {
  try {
    const response = await plaidClient.itemAccessTokenInvalidate({ access_token: accessToken });
    return response.data.new_access_token;
  } catch (err) {
    console.error('Error refreshing access token:', err);
    throw err;
  }
}

module.exports = { refressAccessToken };