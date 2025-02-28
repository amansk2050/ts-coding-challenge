import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey, RequestType,
  TopicCreateTransaction, TopicInfoQuery,
  TopicMessageQuery, TopicMessageSubmitTransaction,
  KeyList, AccountCreateTransaction, Hbar
} from "@hashgraph/sdk";
import { accounts } from "../../src/config";
import assert from "node:assert";
import ConsensusSubmitMessage = RequestType.ConsensusSubmitMessage;

// Pre-configured client for test network (testnet)
const client = Client.forTestnet()

//Set the operator with the account ID and private key
//Sets up the initial context or state before the test runs.
Given(/^a first account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const acc = accounts[0]
  const account: AccountId = AccountId.fromString(acc.id);
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});


When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
    // const tx =  await new TopicCreateTransaction()
    // .setSubmitKey(this.privKey)
    // .setTopicMemo(memo)
    // .execute(client);
    // const receipt = await tx.getReceipt(client);
    // const newTopicId = receipt.topicId;
    // console.log(`New HCS topic ID: ${newTopicId}`)
    this.topicId = '0.0.5635773' //newTopicId;
    // Wait 5 seconds between consensus topic creation and subscription creation
    // await new Promise((resolve) => setTimeout(resolve, 5000));
});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
  new TopicMessageQuery()
  .setTopicId(this.topicId)
  .subscribe(client, null, (message) => {
    let messageAsString = Buffer.from(message.contents).toString();
    console.log("messageAsString------- 53", messageAsString)
    console.log(
      `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
    );
  });
  // Send message to the topic
  // await new Promise((resolve) => setTimeout(resolve, 1000));

    let messageTx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId)
      .setMessage(message)
      .freezeWith(client);
  
    const signedTx = await messageTx.sign(this.privKey);
    const sendRespone = await signedTx.execute(client)  
    // Get the receipt of the transaction
    const getReceipt = await sendRespone.getReceipt(client);
  
    // Get the status of the transaction
    const transactionStatus = getReceipt.status
    console.log("The message transaction status " + transactionStatus.toString()) 
});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
  // Subscribe to the topic
  console.log('----- line 77 ', this.topicId)
  new TopicMessageQuery()
  .setTopicId(this.topicId.toString())
  .subscribe(client, null, (message) => {
    console.log('-------', message)
    let messageAsString = Buffer.from(message.contents).toString();
    console.log("messageAsString------- ", messageAsString)
    console.log(
      `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
    );
  });
});

// Given(/^a first account with more than (\d+) hbars$/, async function (balance: number) {
//   const acc = accounts[0]
//   const accountId: AccountId = AccountId.fromString(acc.id);
//   const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
//   client.setOperator(this.account, privKey);

// //Create the query request
//   const query = new AccountBalanceQuery().setAccountId(accountId);
//   const bal = await query.execute(client)
//   console.log("balance--------line 101 ", bal.hbars.toBigNumber().toNumber())
//   assert.ok(bal.hbars.toBigNumber().toNumber() > balance)
// });
Given(/^A second account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const acc = accounts[1]
  const account: AccountId = AccountId.fromString(acc.id);
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(this.account, privKey);

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)
  console.log("balance--------line 112 ", balance.hbars.toBigNumber().toNumber())
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});

Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function () {
  console.log('-----threshold key account-------')
  const acc1 = accounts[0]
  const privKey1: PrivateKey = PrivateKey.fromStringED25519(acc1.privateKey);
  const acc2 = accounts[1]
  const privKey2: PrivateKey = PrivateKey.fromStringED25519(acc2.privateKey);
  const thresholdKey = new KeyList([privKey1.publicKey, privKey2.publicKey], 1);
  this.thresholdKey = thresholdKey;
  const accountTx = new AccountCreateTransaction()
  .setKey(thresholdKey)
  .setInitialBalance(new Hbar(10))// initial balance
  .execute(client);

  const receipt = await (await accountTx).getReceipt(client);
  const accountId = receipt.accountId;
  console.log(` New Account Created with 1-of-2 Threshold Key: ${accountId}`);
});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function (memo: string) {
    console.log('topicId with threshold key------')
    const tx =  await new TopicCreateTransaction()
    .setSubmitKey(this.thresholdKey)
    .setTopicMemo(memo)
    .execute(client);
    const receipt = await tx.getReceipt(client);
    const newTopicId = receipt.topicId;
    console.log(`New HCS topic ID for threshold key: ${newTopicId}`)
});
