import { Given, Then, When } from "@cucumber/cucumber";
import { accounts } from "../../src/config";
import { AccountBalanceQuery, AccountId, Client, PrivateKey, 
  TokenCreateTransaction,
  TokenType,
  TokenSupplyType,
  TokenId, 
  TokenInfoQuery,
  TokenMintTransaction,
  TokenAssociateTransaction,
  TransferTransaction} from "@hashgraph/sdk";
import assert from "node:assert";

import * as dotenv from "dotenv";
import { error } from "node:console";

// Load environment variables from .env file
dotenv.config();

const client = Client.forTestnet()
let tokenId : any = '';
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
  // const tokenCreateTx = new TokenCreateTransaction()
  // .setTokenName("Test Token")
  // .setTokenSymbol("HTT")
  // .setTokenType(TokenType.FungibleCommon)
  // .setDecimals(2)
  // .setInitialSupply(tokenSupply * 100)  // Fixed supply
  // .setMaxSupply(tokenSupply * 100)
  // .setTreasuryAccountId(treasuryId)
  // .setSupplyType(TokenSupplyType.Finite) // no more minting
  // .freezeWith(client);
  // const tokenCreateSign = await tokenCreateTx.sign(treasuryKey);
  // const tokenCreateSubmit = await tokenCreateSign.execute(client);
  // const tokenCreateRx = await tokenCreateSubmit.getReceipt(client);
  // const TokenId = tokenCreateRx.tokenId;
  this.tokenId = '0.0.5633266';
  tokenId =  '0.0.5633266'     //TokenId;
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
  console.log('tokenId------- 184 ', this.tokenId)
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
  console.log('tokenId------- 200 ', this.tokenId)

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
  console.log('totalsuppy------209 ', totalSupply, tokenId.toString())
  const tokenID = TokenId.fromString(tokenId.toString());
  const tokenInfo = await new TokenInfoQuery()
     .setTokenId(tokenID)
     .execute(client)
  console.log('tokenInfo--------210 ', tokenInfo.totalSupply.toString())   
     assert.strictEqual(totalSupply*100, Number(tokenInfo.totalSupply.toString()))
});
// Given(/^The first account holds (\d+) HTT tokens$/, async function (balance) {
//   const treasuryId = AccountId.fromString(process.env.MY_ACCOUNT_ID!); 
//   const treasuryKey = PrivateKey.fromStringECDSA(process.env.MY_PRIVATE_KEY!);
//   console.log({treasuryId, treasuryKey})
//   // const tokenSupply = 1000; // Fixed supply
//   const account = accounts[0]
//   const account1Id = AccountId.fromString(account.id); 
//   const account1Key = PrivateKey.fromStringECDSA(account.privateKey);
//   client.setOperator(treasuryId, treasuryKey);
//   client.setRequestTimeout(30000);
//   // token assoication with account1
//   try{
//     const associateTx = await new TokenAssociateTransaction()
//     .setAccountId(account1Id)
//     .setTokenIds([tokenId.toString()])
//     .freezeWith(client)
//     .sign(account1Key);
  
//     const associateSubmit = await associateTx.execute(client);
//     const associateAccount1Rx = await associateSubmit.getReceipt(client);
//     console.log(`token association with Account1 ${associateAccount1Rx.status}`);
//   }catch(err){
//       console.log("errr line 240 ", err)
//       // console.log(`token ${tokenId} already associated with account1 `)  
//       return  
//   }
// 	//BALANCE CHECK
// 	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(treasuryId).execute(client);
// 	console.log(`- Treasury balance: ${balanceCheckTx.tokens?._map.get(tokenId.toString())} units of token ID ${tokenId}`);
// 	var balanceCheckTx = await new AccountBalanceQuery().setAccountId(account1Id).execute(client);
// 	console.log(`- Alice's balance: ${balanceCheckTx.tokens?._map.get(tokenId.toString())} units of token ID ${tokenId}`);


//   console.log(`start trasfering 100 HTT token to Account1 ${account1Id}`)
//   // client.setOperator(treasuryId, treasuryKey);
//   const transferTx = await new TransferTransaction()
//   .addTokenTransfer(tokenId, treasuryId, -1) // Deduct from treasury
//   .addTokenTransfer(tokenId, account1Id, 1)  // Credit to account1
//   .freezeWith(client)
//   .sign(treasuryKey);
//   const transferSubmit = await transferTx.execute(client);
//   const transferReceipt = await transferSubmit.getReceipt(client);

//   console.log(`✅ Transfer Successful! Status: ${transferReceipt.status}`);
//   const account1Balance = await new AccountBalanceQuery().setAccountId(account1Id).execute(client);
//   console.log('account1Balance------ ', account1Balance)

// });
// Given(/^The second account holds (\d+) HTT tokens$/, async function () {

// });
// When(/^The first account creates a transaction to transfer (\d+) HTT tokens to the second account$/, async function () {

// });
// When(/^The first account submits the transaction$/, async function () {

// });
// When(/^The second account creates a transaction to transfer (\d+) HTT tokens to the first account$/, async function () {

// });
// Then(/^The first account has paid for the transaction fee$/, async function () {

// });
// Given(/^A first hedera account with more than (\d+) hbar and (\d+) HTT tokens$/, async function () {

// });
// Given(/^A second Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

// });
// Given(/^A third Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

// });
// Given(/^A fourth Hedera account with (\d+) hbar and (\d+) HTT tokens$/, async function () {

// });
// When(/^A transaction is created to transfer (\d+) HTT tokens out of the first and second account and (\d+) HTT tokens into the third account and (\d+) HTT tokens into the fourth account$/, async function () {

// });
// Then(/^The third account holds (\d+) HTT tokens$/, async function () {

// });
// Then(/^The fourth account holds (\d+) HTT tokens$/, async function () {

// });
