const User = require("../models/users");

async function getAccessTokenForUser(userId) {
  if(!userId){
    return new Error("No user Id");
  }
  try{
  const user = await User.findById(userId);
  if (!user || !user.plaidData || user.plaidData.length=== 0){
    throw new Error('Access token not found')
  }

  return user.plaidData.map(data => data.accessToken);
  } catch(err){
    console.error('Error fetching user access token:', err)
    throw new Error('Unable to retrieve access token')
  }
  
}


module.exports = { getAccessTokenForUser };