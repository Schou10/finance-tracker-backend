const User = require("../models/users");
const { encrypt } = require("../utils/encryption");

async function getAccessTokenForUser(userId) {
  if(!userId){
    return new Error("No user Id");
  }
  try{
  const user = await User.findById(userId).select('plaidData');
  return user ? user.plaidData.accessToken : null;
  } catch(err){
    console.error('Error fetching user access token:', err)
    throw new Error('Unable to retrieve access token')
  }
  
}

async function storeAccessTokenForUser(userId, accessToken, accountId) {
  if (!userID || !accessToken){
    throw new Error("User ID and access token are required");
  }
  const encryptedToken = encrypt(accessToken);
  return User.findByIdAndUpdate(
    userId,
    {$push: { plaidData:{  accessToken: encryptedToken, accountId,}}},
      {new: true, runValidators: true});
};

module.exports = { getAccessTokenForUser, storeAccessTokenForUser };