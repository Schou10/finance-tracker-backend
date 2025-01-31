const {encrypt, decrypt} = require("../utils/encryption");
const { Configuration, PlaidApi, PlaidEnvironments }= require('plaid');
const {BadRequestError} = require('../errors/badrequesterror')
const {NotFoundError} = require('../errors/notfounderror')
const User = require("../models/users");
const { getAccessTokenForUser } = require("../services/userServices");
const Account  = require('../models/accounts');
const Transaction = require('../models/transactions');

// Configuration for plaid Environment
const configuration = new Configuration({
  basePath: PlaidEnvironments.sandbox,
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

// Creates PlaidClient for User to sync with application
const plaidClient = new PlaidApi(configuration);

// Plaid Set up link Token App.jsx Return LinkTokenRes.data
const linkTokenCreate = async (req, res, next)=>{
  const {clientUserId} = req.body;
  const plaidRequest = {
      user: {client_user_id: clientUserId,},
      client_name: "Andrew Schouten", //Company Name on Plaid Network for this Application
      products: process.env.PLAID_PRODUCTS.split(","),
      language: 'en',
      redirect_uri: process.env.PLAID_REDIRECT_URI || "http://localhost:3000/",
      country_codes: process.env.PLAID_COUNTRY_CODES.split(","),
  };
    try {
        const linkTokenRes = await plaidClient.linkTokenCreate(plaidRequest);
        res.json(linkTokenRes.data);
    } catch(err){
        console.error('Error creating link token:', err)
        next(err)
    }
}
// Plaid Exchange Public Token plaidbutton.jsx stores Access token to server
const exchangePublicToken = async (req, res, next) =>{
  const {public_token} = req.body;
  if (!public_token){
    next(new BadRequestError('Public token not found'));
  }
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const  encryptedAccessToken = encrypt(tokenResponse.data.access_token);
    const itemId = tokenResponse.data.item_id;

    // Store the plaidData for access token and itemId to user
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError('User not found'));
    }

    // Initialize plaidData as an array if it's not already
    if (!Array.isArray(user.plaidData)) {
      user.plaidData = [];
    }    
    // Add new access token and account ID to plaidData array
    user.plaidData.push({ accessToken: encryptedAccessToken, accountId: itemId });

    await user.save();
    res.status(200).send( {message: "Access token stored successfully"});
  } catch (err) {
    next(err)
}}

// Plaid Retrieve accounts from API for routing number information to set up transfers
const authAccounts = async (req, res, next)=>{
  try {
    const accessToken = await getAccessTokenForUser(req.user._id);
    if (!accessToken){
      next(new NotFoundError("Access token not found"));
    }
    const decryptedAccessToken =  decrypt(accessToken);
    const response = await plaidClient.authGet({access_token: decryptedAccessToken});
    // account: data.accounts
    // number: data.numbers
    return res.status(200).json(response.data);
  } catch (err) {
    next(err);
  }
}

// Plaid Sync from API
const accountsSync = async (req, res, next)=>{
  try{
      const  accessTokens = await getAccessTokenForUser(req.user._id);
      if (!accessTokens || accessTokens.length === 0){
        next(new NotFoundError("No access tokens found"));
      }
      const accounts = [];
      for (const encryptedAccessToken of accessTokens){
        const decryptedAccessToken =  decrypt(encryptedAccessToken);
        const response = await plaidClient.accountsBalanceGet({access_token: decryptedAccessToken});
        accounts.push(...response.data.accounts)
      }


      return res.json({accounts});
    } catch(err){
      next(err)
    }
  }

const transactionSync = async (req, res, next, returnData = false)=>{
  try {
      const accessTokens = await getAccessTokenForUser(req.user._id);
      if (!accessTokens || accessTokens.length === 0){
        next(new NotFoundError("No access tokens found"));
      }
      const transactions = []
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      for (const encryptedAccessToken of accessTokens){
        const decryptedAccessToken =  decrypt(encryptedAccessToken);
        const Transactionrequest={
          access_token: decryptedAccessToken,
          start_date: thirtyDaysAgo,
          end_date: today,
        }

        const response = await plaidClient.transactionsGet(Transactionrequest);
        transactions.push(...response.data.transactions)
      }

      if (returnData) {
        return transactions;
      }
      else{
        return res.status(200).json(transactions);
      }
    } catch (err) {
      next(err);
    }
  };
// Save to Server
const accountsSave = async (req, res, next)=>{
  const {  itemId, accountData } = req.body;
  try{
    const existingAccount = await Account.findOne({
      userId: req.user._id,
      itemId
    })

    if (existingAccount) {
      next(new BadRequestError("Account already exists"));
    }

    const  encryptedData  = encrypt(accountData);

    const newAccount = await Account.create({
      userId: req.user._id,
      itemId,
      accountData: encryptedData, // Store the encrypted object
    });

    // Update the user's account list
    const user = await User.findById(req.user._id);
    if (!user) {
      return next(new NotFoundError("User not found"));
    }
    user.accounts.push(newAccount._id);
    await user.save();

    res.status(201).send(newAccount);
  } catch (err) {
    next(err);
  }
}

const transactionSave = async (req, res, next)=> {
  const  transactions  = req.body;

  try {
    const { content, iv } = encrypt(transactions);

    const savedTransaction = await Transaction.create({
      userId: req.user._id,
      content,
      iv,
    });

    res.status(201).send(savedTransaction);
  } catch (err) {
    next(err);
  }
}

// Retrieve from Server
const accountsRetrieve = async (req, res, next)=> {
  try {
    const account = await Account.findOne({ userId: req.user._id });
    if (!account) {
      next(new NotFoundError("No account data found"));
    }

    const decryptedData = decrypt({content:account.accountData.content, iv:account.accountData.iv});
    res.status(200).send(decryptedData);
  } catch (err) {
    next(err);
  }
}

const transactionRetrieve = async (req, res, next)=> {
  try {
    const transaction = await Transaction.findOne({ userId: req.user._id });
    if (!transaction) {
      return res.status(404).send({ message: 'No transaction data found' });
    }

    const decryptedData = decrypt({content:transaction.content, iv:transaction.iv});
    res.status(200).send(decryptedData);
  } catch (err) {
    next(err);
  }
}



const budgetOverview = async (req, res, next)=> {
try {
  // Get transactions from Plaid
  const transactions =  await transactionSync(req, res, next, true);
  if (!transactions) {
    return next(new NotFoundError('No transactions found'));
  }
  

  // Process data for budget overview
  const spendingByCategory = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  transactions.forEach((txn) => {
    if (txn.amount > 0) {
      totalExpenses += txn.amount;
      const category = txn.category?.[0] || 'Uncategorized';
      spendingByCategory[category] = (spendingByCategory[category] || 0) + txn.amount;
    } else {
      totalIncome += Math.abs(txn.amount);
    }
  });

  res.json({
    totalIncome,
    totalExpenses,
    spendingByCategory,
    netCashFlow: totalIncome - totalExpenses,
  });
} catch (error) {
  next(error);
}
}

module.exports = {
  linkTokenCreate, 
  exchangePublicToken, 
  authAccounts, 
  accountsSync, 
  transactionSync, 
  accountsSave, 
  transactionSave,
  accountsRetrieve,
  transactionRetrieve, 
  budgetOverview};