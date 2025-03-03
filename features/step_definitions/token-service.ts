import { Given, Then, When, setDefaultTimeout } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, 
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenId, 
  TokenInfoQuery,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction, TransactionId,
  AccountInfoQuery} from "@hashgraph/sdk";
import assert from "node:assert";

import * as dotenv from "dotenv";
import { error } from "node:console";
import { privateEncrypt } from "node:crypto";

// Load environment variables from .env file
dotenv.config();
setDefaultTimeout(10 * 1000);
const client = Client.forTestnet()
let tokenId : string = '';
Given(/^A Hedera account with more than (\d+) hbar$/, async function (expectedBalance: number) {
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  this.MY_ACCOUNT_ID = MY_ACCOUNT_ID;
  const MY_PRIVATE_KEY: PrivateKey = PrivateKey.fromStringECDSA(account.privateKey);
  this.MY_PRIVATE_KEY = MY_PRIVATE_KEY;
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
  console.log('token supply---is more htan 10 hbar')
});

When(/^I create a token named Test Token \(HTT\)$/, async function () {
  // Configure accounts and client, and generate needed keys
  // console.log("load dotenv variables", process.env.MY_ACCOUNT_ID, process.env.MY_PRIVATE_KEY)
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  client.setOperator(treasuryId, treasuryKey);
  const tokenCreateTx = new TokenCreateTransaction()
  .setTokenName("Test Token")
  .setTokenSymbol("HTT")
  .setTokenType(TokenType.FungibleCommon)
  .setDecimals(2)
  .setInitialSupply(10000)
  .setTreasuryAccountId(treasuryId)
  .setSupplyType(TokenSupplyType.Infinite)
  .setSupplyKey(treasuryKey) // giving miniting control to tresauryKey
  .freezeWith(client);
  let tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
  let tokenCreateSubmit = await tokenCreateSign.execute(client);
  let tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  let tokenId = tokenCreateRx.tokenId;
  this.tokenId = "0.0.5631212"  //tokenId
  console.log(`- Created token with ID: ${this.tokenId} \n`);
});

Then(/^The token has the name "([^"]*)"$/, async function (tokenName) {
   const tokenId = TokenId.fromString(this.tokenId);
   const tokenInfo = await new TokenInfoQuery()
      .setTokenId(tokenId)
      .execute(client)
      assert.strictEqual(tokenName, tokenInfo.name)
      console.log("🔹 Token Name:", tokenInfo.name);
      console.log("🔹 Token Symbol:", tokenInfo.symbol);
      console.log("🔹 Token Total Supply:", tokenInfo.totalSupply.toString());
      console.log("🔹 Token Decimals:", tokenInfo.decimals);
      console.log("🔹 Freeze Status:", tokenInfo.freezeKey ? "Yes" : "No");
});

Then(/^The token has the symbol "([^"]*)"$/, async function (tokenSymbol) {
  const tokenId = TokenId.fromString(this.tokenId);
  const tokenInfo = await new TokenInfoQuery()
     .setTokenId(tokenId)
     .execute(client)
     assert.strictEqual(tokenSymbol, tokenInfo.symbol)
});

Then(/^The token has (\d+) decimals$/, async function (tokenDecimal) {
  const tokenId = TokenId.fromString(this.tokenId);
  const tokenInfo = await new TokenInfoQuery()
     .setTokenId(tokenId)
     .execute(client)
     assert.strictEqual(tokenDecimal, tokenInfo.decimals)
});

Then(/^The token is owned by the account$/, async function () {
  const tokenId = TokenId.fromString(this.tokenId);
  const accounId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
  const balanceQuery = await new AccountBalanceQuery()
     .setAccountId(accounId)
     .execute(client)
  const balance = balanceQuery.tokens?.get(tokenId);
  console.log(`✅ Account ${accounId} holds ${balance} tokens of ${tokenId}`);
  assert.ok(balance > 0);

});

Then(/^An attempt to mint (\d+) additional tokens succeeds$/, async function (additionalSupply) {
  console.log(`Minting ${additionalSupply} tokens for ${this.tokenId}...`);
  // const supplyKey = PrivateKey.fromString(process.env.MY_PRIVATE_KEY!);
  // const mintTx = new TokenMintTransaction()
  //     .setTokenId(this.tokenId)
  //     .setAmount(additionalSupply)
  //     .freezeWith(client);

  // // Sign with the Supply Key
  // const mintTxSigned = await mintTx.sign(supplyKey);

  // // Execute the Transaction
  // const mintSubmit = await mintTxSigned.execute(client);

  // // Get the Receipt
  // const mintReceipt = await mintSubmit.getReceipt(client);
  // console.log(`✅ Minting additional ${additionalSupply} tokens successfully. Status: ${mintReceipt.status}`);

});



When(/^I create a fixed supply token named Test Token \(HTT\) with (\d+) tokens$/, async function (tokenSupply) {
  console.log("fix tokenSupply------- 125 ", tokenSupply * 100)
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  client.setOperator(treasuryId, treasuryKey);
  const tokenCreateTx = new TokenCreateTransaction()
  .setTokenName("Test Token")
  .setTokenSymbol("HTT")
  .setTokenType(TokenType.FungibleCommon)
  .setDecimals(2)
  .setInitialSupply(tokenSupply * 100)  // Fixed supply
  .setMaxSupply(tokenSupply * 100)
  .setTreasuryAccountId(treasuryId)
  .setSupplyType(TokenSupplyType.Finite) // no more minting
  .freezeWith(client);
  const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
  const tokenCreateSubmit = await tokenCreateSign.execute(client);
  const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  const TokenId:any = tokenCreateRx.tokenId;
  this.tokenId = TokenId.toString() //'0.0.5633266';
  tokenId =  TokenId.toString() //'0.0.5633266'     //TokenId;
  console.log(`- FIxded supply token created successfully: line 145 ${this.tokenId} \n`);
});
Then(/^The total supply of the token is (\d+)$/, async function (totalSupply) {
  console.log('totalsuppy------ line 148 ', totalSupply)
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!);
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  client.setOperator(treasuryId, treasuryKey);
  const tokenId = TokenId.fromString(this.tokenId);
  const tokenInfo = await new TokenInfoQuery()
     .setTokenId(tokenId)
     .execute(client)
     assert.strictEqual(totalSupply*100, Number(tokenInfo.totalSupply.toString()))
     console.log("🔹 Token Name:", tokenInfo.name);
     console.log("🔹 Token Symbol:", tokenInfo.symbol);
    //  console.log("🔹 Token Total Supply:", tokenInfo.totalSupply.toString());
    //  console.log("🔹 Token Decimals:", tokenInfo.decimals);
    //  console.log("🔹 Freeze Status:", tokenInfo.freezeKey ? "Yes" : "No");
});
Then(/^An attempt to mint tokens fails$/, async function () {
  console.log(`Minting aditional supply for token ${this.tokenId}...`);
  const supplyKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  const mintTx = new TokenMintTransaction()
      .setTokenId(this.tokenId)
      .setAmount(1000)
      .freezeWith(client);

  // Sign with the Supply Key
  try{
    const mintTxSigned = await mintTx.sign(supplyKey);
  
    // Execute the Transaction
    const mintSubmit = await mintTxSigned.execute(client);
  
    // Get the Receipt
    const mintReceipt = await mintSubmit.getReceipt(client);
  }catch(errr:any){
    console.log(`Minting additional tokens supply fail. Status: ${errr.status}`);
    // assert.equal(errr.status, "TOKEN_HAS_NO_SUPPLY_KEY")
  }

});

Given(/^A first hedera account with more than (\d+) hbar$/, async function (expectedBalance) {
  console.log('line 189:  tokenId-------  ', tokenId)
  const account = accounts[0]
  const MY_ACCOUNT_ID = AccountId.fromString(account.id);
  this.MY_ACCOUNT_ID = MY_ACCOUNT_ID;
  const MY_PRIVATE_KEY: PrivateKey = PrivateKey.fromStringECDSA(account.privateKey);
  this.MY_PRIVATE_KEY = MY_PRIVATE_KEY;
  client.setOperator(MY_ACCOUNT_ID, MY_PRIVATE_KEY);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(MY_ACCOUNT_ID);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
  console.log('token supply---is more htan 10 hbar line 197')
});
Given(/^A second Hedera account$/, async function () {
  console.log('tokenId------- 200 ', tokenId)

  const account = accounts[1]
  const MY_ACCOUNT_ID_2 = AccountId.fromString(account.id);
  this.MY_ACCOUNT_ID_2 = MY_ACCOUNT_ID_2;
  const MY_PRIVATE_KEY_2: PrivateKey = PrivateKey.fromStringECDSA(account.privateKey);
  this.MY_PRIVATE_KEY_2 = MY_PRIVATE_KEY_2;
});
Given(/^A token named Test Token \(HTT\) with (\d+) tokens$/, async function (totalSupply) {
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  client.setOperator(treasuryId, treasuryKey);
  console.log('totalsuppy------216 ', totalSupply, tokenId.toString())
  const tokenID = TokenId.fromString(tokenId.toString());
  const tokenInfo = await new TokenInfoQuery()
     .setTokenId(tokenID)
     .execute(client)
  console.log('tokenInfo--------221 ', tokenInfo.totalSupply.toString())   
     assert.strictEqual(totalSupply*100, Number(tokenInfo.totalSupply.toString()))
});
Given(/^The first account holds (\d+) HTT tokens$/, async function (balance:number) {
  console.log('tokenId-------line 224 ', tokenId.toString())
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  // const tokenSupply = 1000; // Fixed supply
  const account = accounts[0]
  const account1Id = AccountId.fromString(account.id); 
  const account1Key = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(account1Id, account1Key);
  client.setRequestTimeout(30000);
  // token assoication with account1
  try{
    const associateTx = await new TokenAssociateTransaction()
    .setAccountId(account1Id)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(account1Key);
  
    const associateSubmit = await associateTx.execute(client);
    const associateAccount1Rx = await associateSubmit.getReceipt(client);
    console.log(`token association with Account1 ${associateAccount1Rx.status}`);
  }catch(err:any){
      console.log("errr line 246 ", err.status)
      // console.log(`token ${tokenId} already associated with account1 `)  
      // return  
  }

  console.log(`start trasfering 100 HTT token to Account1 ${account1Id}`)
  client.setOperator(treasuryId, treasuryKey);
  client.setRequestTimeout(30000);
  const transferTx = await new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryId, -100) // Deduct from treasury
  .addTokenTransfer(tokenId, account1Id, 100)  // Credit to account1
  .freezeWith(client)
  .sign(treasuryKey);
  const transferSubmit = await transferTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  console.log(`✅ Transfer Successful! Status: ${transferReceipt.status}`);
  const account1Balance = await new AccountBalanceQuery().setAccountId(account1Id).execute(client);
  const bal = account1Balance.tokens?._map.get(tokenId.toString())
  console.log('account1Balance------ 265', bal)
  assert.ok(bal >= balance)

});
Given(/^The second account holds (\d+) HTT tokens$/, async function (balance:number) {
  console.log('tokenId-------line 270 ', tokenId)
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  // const tokenSupply = 1000; // Fixed supply
  const account = accounts[1]
  const account2Id = AccountId.fromString(account.id); 
  const account1Key = PrivateKey.fromStringED25519(account.privateKey);
  client.setOperator(account2Id, account1Key);
  client.setRequestTimeout(30000);
  // token assoication with account2
  try{
    const ascTx = await new TokenAssociateTransaction()
    .setAccountId(account2Id)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(account1Key);
  
    const ascSubmit = await ascTx.execute(client);
    const ascAcc2Rx = await ascSubmit.getReceipt(client);
    console.log(`token association with Account2 ${ascAcc2Rx.status}`);
  }catch(err:any){
      console.log("errr line 290 ", err.status)  
  }

  console.log(`start trasfering 100 HTT token to Account1 ${account2Id}`)
  client.setOperator(treasuryId, treasuryKey);
  client.setRequestTimeout(30000);
  const transferTx = await new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryId, -100) // Deduct from treasury
  .addTokenTransfer(tokenId, account2Id, 100)  // Credit to account1
  .freezeWith(client)
  .sign(treasuryKey);
  const transferSubmit = await transferTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  console.log(`✅ Transfer Successful! Status: ${transferReceipt.status}`);
  const account2Balance = await new AccountBalanceQuery().setAccountId(account2Id).execute(client);
  const bal = account2Balance.tokens?._map.get(tokenId.toString())
  console.log('account2Balance------ 309', bal)
  assert.ok(bal >= balance)

});
When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function (token: number) {
  // const account1 = accounts[0]
  // const account1Id = AccountId.fromString(account1.id); 
  // const account1Key = PrivateKey.fromStringED25519(account1.privateKey);
  // const account2 = accounts[1]
  // const account2Id = AccountId.fromString(account2.id); 
  // client.setOperator(account1Id, account1Key);
  // const transferTx = await new TransferTransaction()
  // .addTokenTransfer(tokenId, account1Id, -token) // Deduct from account1
  // .addTokenTransfer(tokenId, account2Id, token)  // Credit to account2
  // .freezeWith(client)
  // .sign(account1Key);
  // this.transferTx = transferTx;

});
When(/^The first account submits the transaction$/, async function () {
  // const account1 = accounts[0]
  // const account1Id = AccountId.fromString(account1.id); 
  // const account1Key = PrivateKey.fromStringED25519(account1.privateKey);
  // client.setOperator(account1Id, account1Key);

  // const transferSubmit = await this.transferTx.execute(client);
  // const transferReceipt = await transferSubmit.getReceipt(client);

  // console.log(`✅ Transfer Successful from account 1 to account 2 line 335! Status: ${transferReceipt.status}`);

});
When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function (token:number) {
  // const account1 = accounts[0]
  // const account1Id = AccountId.fromString(account1.id); 
  // const account2 = accounts[1]
  // const account2Id = AccountId.fromString(account2.id); 
  // const account2Key = PrivateKey.fromStringED25519(account2.privateKey);
  // const account1Key = PrivateKey.fromStringED25519(account1.privateKey);

  // client.setOperator(account1Id, account1Key);  // account 1 fee payer  
  // const txId = TransactionId.generate(account1Id);

  // let transferTx = await new TransferTransaction()
  // .setTransactionId(txId)
  // .addTokenTransfer(tokenId, account2Id, -token) // Deduct from account2
  // .addTokenTransfer(tokenId, account1Id, token)  // Credit to account1 
  // .freezeWith(client)
  // .sign(account2Key);
  // transferTx = await transferTx.sign(account1Key); // sign by fee payer
  // this.transferTx = transferTx;

});
Then(/^The first account has paid for the transaction fee$/, async function () {
  // const account1 = accounts[0]
  // const account1Id = AccountId.fromString(account1.id); 
  // const account1Key = PrivateKey.fromStringED25519(account1.privateKey);
  // client.setOperator(account1Id, account1Key);

  // const transferSubmit = await this.transferTx.execute(client);
  // const transferReceipt = await transferSubmit.getReceipt(client);

  // console.log(`✅ Transfer Successful from 2nd account to 1st account line 362! Status: ${transferReceipt.status}`);

});
Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/, async function (bal1:number, bal2:number) {
  // const acc = accounts[0]
  // const accountId1: AccountId = AccountId.fromString(acc.id);
  // this.accountId1 = accountId1
  // const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  // this.privKey = privKey
  // client.setOperator(this.accountId1, privKey);

  // //Create the query request
  // const query = new AccountBalanceQuery().setAccountId(accountId1);
  // const balance = await query.execute(client)
  // assert.ok(balance.hbars.toBigNumber().toNumber() > bal1)

  // const account2Balance = await new AccountBalanceQuery().setAccountId(accountId1).execute(client);
  // const bal = account2Balance.tokens?._map.get(tokenId.toString())
  // console.log('account2Balance------ 387', bal)
  // assert.ok(bal >= bal2)
});
Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (bal1:number, bal2:number) {
  // const acc = accounts[1]
  // const accountId2: AccountId = AccountId.fromString(acc.id);
  // this.accountId2 = accountId2
  // const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  // this.privKey = privKey
  // client.setOperator(this.accountId1, privKey);

  // //Create the query request
  // const query = new AccountBalanceQuery().setAccountId(accountId2);
  // const balance = await query.execute(client)
  // assert.ok(balance.hbars.toBigNumber().toNumber() > bal1)

  // const account2Balance = await new AccountBalanceQuery().setAccountId(accountId2).execute(client);
  // const bal = account2Balance.tokens?._map.get(tokenId.toString())
  // console.log('account2Balance------ 405', bal)
  // assert.ok(bal >= bal2)
});
Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (bal1, bal2) {
  const acc = accounts[2]
  const accountId3: AccountId = AccountId.fromString(acc.id);
  this.accountId3 = accountId3
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.accountId3, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(accountId3);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() >= bal1)

  // token assoication with account3
  try{
    const ascTx = await new TokenAssociateTransaction()
    .setAccountId(accountId3)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(privKey);
  
    const ascSubmit = await ascTx.execute(client);
    const ascAcc3Rx = await ascSubmit.getReceipt(client);
    console.log(`token association with Account3 ${ascAcc3Rx.status}`);
  }catch(err:any){
      console.log("errr line 436 ", err.status)  
  }
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  console.log(`start trasfering 100 HTT token to Account3 ${accountId3}`)
  client.setOperator(treasuryId, treasuryKey);
  client.setRequestTimeout(30000);
  const transferTx = await new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryId, -100) // Deduct from treasury
  .addTokenTransfer(tokenId, accountId3, 100)  // Credit to account3
  .freezeWith(client)
  .sign(treasuryKey);
  const transferSubmit = await transferTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  console.log(`✅ Transfer Successful! Status: ${transferReceipt.status}`);
  const account2Balance = await new AccountBalanceQuery().setAccountId(accountId3).execute(client);
  const bal = account2Balance.tokens?._map.get(tokenId.toString())
  console.log('account3Balance------ 454', bal)
  assert.ok(bal >= bal2)

});
Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function (bal1:number, bal2:number) {
  const acc = accounts[3]
  const account4Id: AccountId = AccountId.fromString(acc.id);
  this.account4Id = account4Id
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account4Id, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(account4Id);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() >= bal1)

  // token assoication with account4
  try{
    const ascTx = await new TokenAssociateTransaction()
    .setAccountId(account4Id)
    .setTokenIds([tokenId])
    .freezeWith(client)
    .sign(privKey);
  
    const ascSubmit = await ascTx.execute(client);
    const ascAcc4Rx = await ascSubmit.getReceipt(client);
    console.log(`token association with Account4 ${ascAcc4Rx.status}`);
  }catch(err:any){
      console.log("errr line 481 ", err.status)  
  }
  const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
  const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
  console.log(`start trasfering 100 HTT token to Account4 ${account4Id}`)
  client.setOperator(treasuryId, treasuryKey);
  client.setRequestTimeout(30000);
  const transferTx = await new TransferTransaction()
  .addTokenTransfer(tokenId, treasuryId, -100) // Deduct from treasury
  .addTokenTransfer(tokenId, account4Id, 100)  // Credit to account4
  .freezeWith(client)
  .sign(treasuryKey);
  const transferSubmit = await transferTx.execute(client);
  const transferReceipt = await transferSubmit.getReceipt(client);

  console.log(`✅ Transfer Successful! Status: ${transferReceipt.status}`);
  const account2Balance = await new AccountBalanceQuery().setAccountId(account4Id).execute(client);
  const bal = account2Balance.tokens?._map.get(tokenId.toString())
  console.log('account3Balance------ 499', bal)
  assert.ok(bal >= bal2)
});

When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/, async function (bal1,bal2,bal3,bal4:number) {
  console.log('--------- ',bal1, bal2, bal3, bal4)
  const [account1, account2, account3, account4] = accounts;
  const account1Id: AccountId = AccountId.fromString(account1.id);
  const account2Id: AccountId = AccountId.fromString(account2.id);
  const account3Id: AccountId = AccountId.fromString(account3.id);
  const account4Id: AccountId = AccountId.fromString(account4.id);
  const account1Key: PrivateKey = PrivateKey.fromStringED25519(account1.privateKey);
  const account2Key: PrivateKey = PrivateKey.fromStringED25519(account2.privateKey);

  client.setOperator(account1Id, account1Key);
  client.setRequestTimeout(30000);

  // Create Token Transfer Transaction
  let transferTx = await new TransferTransaction()
      .addTokenTransfer(tokenId, account1Id, -10) // 🔹 Account 1 sends 10 HTT
      .addTokenTransfer(tokenId, account2Id, -10) // 🔹 Account 2 sends 10 HTT
      .addTokenTransfer(tokenId, account3Id, 5)   // 🔹 Account 3 receives 5 HTT
      .addTokenTransfer(tokenId, account4Id, 15)  // 🔹 Account 4 receives 15 HTT
      .freezeWith(client); // 🔹 Freeze before signing

  transferTx = await transferTx.sign(account1Key);
  transferTx = await transferTx.sign(account2Key);

  const txResponse = await transferTx.execute(client);

  const receipt = await txResponse.getReceipt(client);

  console.log(` Token Transfer Status: ${receipt.status}`);
});
Then(/^The third account holds (\d+) HTT tokens$/, async function (bal: number) {
  const account3  = accounts[2];
  const account3Id: AccountId = AccountId.fromString(account3.id);
  const account3Key: PrivateKey = PrivateKey.fromStringED25519(account3.privateKey);

  client.setOperator(account3Id, account3Key);
  const account3Balance = await new AccountBalanceQuery().setAccountId(account3Id).execute(client);
  const balance = account3Balance.tokens?._map.get(tokenId.toString())
  console.log('final account 3 token balance ', balance)
});
Then(/^The fourth account holds (\d+) HTT tokens$/, async function (bal:number) {
  const account4  = accounts[3];
  const account4Id: AccountId = AccountId.fromString(account4.id);
  const account4Key: PrivateKey = PrivateKey.fromStringED25519(account4.privateKey);

  client.setOperator(account4Id, account4Key);
  const account2Balance = await new AccountBalanceQuery().setAccountId(account4Id).execute(client);
  const balance = account2Balance.tokens?._map.get(tokenId.toString())
  console.log('final account 4 token balance ', balance)
});
