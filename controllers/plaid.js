const {encrypt, decrypt} = require("../utils/encryption");
const { Configuration, PlaidApi, PlaidEnvironments }= require('plaid');
const {BadRequestError} = require('../errors/badrequesterror')
const {NotFoundError} = require('../errors/notfounderror')
const {err400, err404} = require('../utils/errors');
const User = require("../models/users");
const { getAccessTokenForUser } = require("../services/userServices");
const Account  = require('../models/accounts');
const Transaction = require('../models/transactions');

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

// Plaid Set up link Token
const linkTokenCreate = async (req, res, next)=>{
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
        const linkTokenRes = await plaidClient.linkTokenCreate(plaidRequest);
        res.json(linkTokenRes.data);
    } catch(err){
        console.error('Error creating link token:', err)
        next(err)
    }
}
// Plaid Exchange Public Token
const exchangePublicToken = async (req, res, next) =>{
  const {public_token} = req.body;
  if (!public_token){
    next(new BadRequestError(err400.message));
  }
  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token,
    });
    const  encryptedAccessToken = encrypt(tokenResponse.data.access_token);

    // Store the plaidData for access token and itemId to user
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        "plaidData.accessToken": encryptedAccessToken,
        "plaidData.itemId": tokenResponse.data.item_id,
      }, 
      { new: true, runValidators: true  }
    );
    if (!updatedUser) {
      next(new NotFoundError(err404.message));
    }

    res.status(200).send( {message: "Access token stored successfully"});
  } catch (err) {
    next(err)
}}
// Plaid Retrieve accounts???
const authAccounts = async (req, res, next)=>{
  try {
    const accessToken = await getAccessTokenForUser(req.user._id);
    if (!accessToken){
      next(new NotFoundError(err404.message))
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
      const  accessToken = await getAccessTokenForUser(req.user._id);
      if (!accessToken){
        next(new NotFoundError(err404.message))
      }
      const decryptedAccessToken =  decrypt(accessToken);
      const accounts = await plaidClient.authGet({access_token: decryptedAccessToken});
      return res.json({accounts:accounts.data.accounts, item:accounts.data.item});
    } catch(err){
      next(err)
    }
  }




const transactionSync = async (req, res, next)=>{
  try {
      const accessToken = await getAccessTokenForUser(req.user._id);
      const decryptedAccessToken =  decrypt(accessToken);
      const now = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(now.getDate() - 30);
      const Transactionrequest={
        access_token: decryptedAccessToken,
        start_date: thirtyDaysAgo.toISOString().split("T")[0],
        end_date: now.toISOString().split("T")[0],
      }
      const transactions  = await plaidClient.transactionsGet(Transactionrequest);
      return res.status(200).json(transactions.data.transactions);
    } catch (err) {
      next(err);
    }
  };
// Save to Server
const accountsSave = async (req, res, next)=>{
  const {  itemId, accountData } = req.body;
  console.log(itemId, accountData);
  try{
    const existingAccount = await Account.findOne({
      userId: req.user._id,
      itemId
    })

    if (existingAccount) {
      next(new BadRequestError(err400.message));
    }

    const  encryptedData  = encrypt(accountData);

    const newAccount = await Account.create({
      userId: req.user._id,
      itemId,
      accountData: encryptedData, // Store the encrypted object
    });
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
      next(new NotFoundError(err404.message))
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

const budgetAccounts = async (req, res, next)=> {
  try {
    const user = await User.findById(req.user._id).select('plaidData');
    if (!user?.plaidData?.accessToken) {
      throw new Error('Access token not found for the user');
    }
    const decryptedToken = decrypt(user.plaidData.accessToken);
    const accountsResponse = await plaidClient.accountsGet({ access_token: decryptedToken });
    res.json(accountsResponse.data.accounts);
  } catch (error) {
    next(error);
  }
}

const budgetOverview = async (req, res, next)=> {
try {
  const user = await User.findById(req.user._id).select('plaidData');
  if (!user?.plaidData?.accessToken) {
    throw new Error('Access token not found for the user');
  }
  const decryptedToken = decrypt(user.plaidData.accessToken);

  // Fetch transactions for the past 30 days
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const transactionsResponse = await plaidClient.transactionsGet({
    access_token: decryptedToken,
    start_date: thirtyDaysAgo,
    end_date: today,
  });

  const transactions = transactionsResponse.data.transactions;

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
budgetAccounts,
budgetOverview, };