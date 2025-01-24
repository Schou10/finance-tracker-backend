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


module.exports = { getAccessTokenForUser };