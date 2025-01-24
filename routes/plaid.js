const router = require("express").Router();
const {linkTokenCreate, 
  exchangePublicToken, 
  authAccounts, 
  accountsSync, 
  transactionSync, 
  accountsSave, 
  transactionSave,
  accountsRetrieve,
  transactionRetrieve,
  budgetAccounts,
  budgetOverview} = require("../controllers/plaid");
const auth = require("../middlewares/auth");

// Creates Link token for user
router.post('/create_link_token', linkTokenCreate);

// Exchange Public token for Access Token
router.post('/exchange_public_token', auth, exchangePublicToken);

// Retrieves Accounts 
router.post("/auth", auth,  authAccounts);

// Retrieves Accounts from Plaid
router.get("/accounts/sync", auth,  accountsSync);

// Retrieves Transactions from Plaid
router.get('/transactions/sync', auth, transactionSync);

// Saves Accounts acquired from plaid
router.post('/accounts', auth, accountsSave);

// Saves aquired transactions from plaid to this data base
router.post('/transactions', auth, transactionSave);

// Retrieves Stored Accounts
router.get('/accounts', auth, accountsRetrieve);

// Retrieves  Stored Transactions
router.get('/transactions', auth, transactionRetrieve);

router.get('/budget/accounts', auth, budgetAccounts);

router.get('/budget/overview', auth, budgetOverview);

module.exports = router;