const router = require("express").Router();
const { Configuration, PlaidApi, PlaidEnvironments }= require('plaid');
const {BadRequestError} = require('../errors/badrequesterror')
const {err400} = require('../utils/errors')


const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

router.post('/create_link_token', async (req, res, next)=>{
  const {clientUserId} = req.body;
  const plaidRequest = {
      user: {client_user_id: clientUserId,},
      client_name: "Andrew Schouten",
      products: process.env.PLAID_PRODUCTS.split(","),
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI || "http://localhost:3000/",
      country_codes: process.env.PLAID_COUNTRY_CODES.split(","),
  };
    try {
        const createTokenResponse = await plaidClient.linkTokenCreate(plaidRequest);
        res.json(createTokenResponse.data);
    } catch(err){
        console.error('Error creating link token:', err)
        next(err)
    }
});

router.post('/exchange_public_token', async function (req, res, next) {
  const {public_token} = req.body
  console.log("Public Token:",public_token)
  if (!public_token){
    next(new BadRequestError(err400.messgae));
  }
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const {access_token,item_id} = tokenResponse.data
    // Store accessToken and itemId securely
    res.json({ access_token, item_id });
  } catch (err) {
    next(err)
  }
});

router.get('/transactions', async (req, res, next) => {
  const { accessToken } = req.query; // Pass access token in query
  if (!accessToken){
    next(new BadRequestError(err400.message));
  }
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate()-30);

  try {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: thirtyDaysAgo.toISOString().split("T")[0],
      end_date: now.toISOString().split("T")[0],
    });
    res.json(response.data.transactions);
  } catch (err) {
    next(err);
  }
});

module.exports = router;