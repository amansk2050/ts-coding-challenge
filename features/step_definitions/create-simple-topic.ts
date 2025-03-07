import { Given, Then, When, setDefaultTimeout } from "@cucumber/cucumber";
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

setDefaultTimeout(10 * 1000);
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
  console.log("line 41: balance---- ", balance.hbars.toBigNumber().toNumber())
  console.log("line 42: expected balance---- ", expectedBalance)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});


When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
  const tx =  await new TopicCreateTransaction()
  .setSubmitKey(this.privKey)
  .setTopicMemo(memo)
  .execute(client);
  const receipt = await tx.getReceipt(client);
  const newTopicId = receipt.topicId;
  console.log(`New HCS topic ID: ${newTopicId}`)
  this.topicId = newTopicId;

});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  new TopicMessageQuery()
    .setTopicId(this.topicId)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents).toString();
      console.log("line 53: subscribe published message ------- ", messageAsString)
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
  console.log("line 73: The message transaction status " + transactionStatus.toString())
});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
  // Subscribe to the topic
  new TopicMessageQuery()
    .setTopicId(this.topicId.toString())
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents).toString();
      console.log("line 82: Subscribe published message -------", messageAsString)
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });
});

Given(/^the first account with more than (\d+) hbars$/, async function (balance: number) {
  const acc = accounts[0]
  const accountId: AccountId = AccountId.fromString(acc.id);
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(accountId, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(accountId);
  const bal = await query.execute(client)
  console.log("line 99: balance-------- ", bal.hbars.toBigNumber().toNumber())
  assert.ok(bal.hbars.toBigNumber().toNumber() > balance)
});
Given(/^A second account with more than (\d+) hbars$/, async function (expectedBalance: number) {
  const acc = accounts[1]
  const accountId: AccountId = AccountId.fromString(acc.id);
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  client.setOperator(accountId, privKey);

  //Create the query request
  const query = new AccountBalanceQuery().setAccountId(accountId);
  const balance = await query.execute(client)
  console.log("line 109: balance----: ", balance.hbars.toBigNumber().toNumber())
  console.log("line 110: expected balance----: ", expectedBalance)
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});

Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function (num1: number, num2: number) {
  const acc1 = accounts[0]
  const privKey1: PrivateKey = PrivateKey.fromStringED25519(acc1.privateKey);
  const acc2 = accounts[1]
  const privKey2: PrivateKey = PrivateKey.fromStringED25519(acc2.privateKey);
  const thresholdKey = new KeyList([privKey1.publicKey, privKey2.publicKey], 1);
  this.thresholdKey = thresholdKey;
  // Check current operator's balance before creating account
  const operatorId = client.operatorAccountId;
  console.log("Current operator account ID:", operatorId?.toString());
  
  if (operatorId) {
    const balanceQuery = new AccountBalanceQuery().setAccountId(operatorId);
    const balanceResponse = await balanceQuery.execute(client);
    console.log("Operator balance before account creation:", balanceResponse.hbars.toString());
  }
  const accountTx = new AccountCreateTransaction()
    .setKey(thresholdKey)
    .setInitialBalance(new Hbar(1))// initial balance
    .execute(client);
  
  const receipt = await (await accountTx).getReceipt(client);
  const accountId = receipt.accountId;
  this.accountId = accountId;
  console.log(`line 128: New Account Created with 1-of-2 Threshold Key: ${accountId}`);
});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function (memo: string) {
  const acc1 = accounts[0]
  const privKey1 = PrivateKey.fromStringED25519(acc1.privateKey)
  const tx = await new TopicCreateTransaction()
    .setSubmitKey(this.thresholdKey)
    .setTopicMemo(memo)
    .freezeWith(client)
    .sign(privKey1);

  const resp = await tx.execute(client)
  const receipt = await resp.getReceipt(client);
  const newTopicId = receipt.topicId;
  this.topicId = newTopicId;
  console.log(`line 144: New HCS topic ID for threshold key: ${this.topicId}`)
});


When(/^A message "([^"]*)" is published to the topic$/, async function (message: string) {
  await new Promise((resolve) => setTimeout(resolve, 3000))
  new TopicMessageQuery()
    .setTopicId(this.topicId)
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents).toString();
      console.log("line 153: Subscribe to published message --", messageAsString)
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });
  // Send message to the topic
  // await new Promise((resolve) => setTimeout(resolve, 1000));
  const acc1 = accounts[0]
  const privKey1 = PrivateKey.fromStringED25519(acc1.privateKey)
  let messageTx = await new TopicMessageSubmitTransaction()
    .setTopicId(this.topicId.toString())
    .setMessage(message)
    .freezeWith(client);

  const signedTx = await messageTx.sign(privKey1);
  const sendRespone = await signedTx.execute(client)
  // Get the receipt of the transaction
  const getReceipt = await sendRespone.getReceipt(client);

  // Get the status of the transaction
  const transactionStatus = getReceipt.status
  console.log("line 174: The message transaction status ------  " + transactionStatus.toString())
});

Then(/^A message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
  // Subscribe to the topic
  const acc1 = accounts[0]
  const privKey1 = PrivateKey.fromStringED25519(acc1.privateKey)
  const accountId1: AccountId = AccountId.fromString(acc1.id);
  client.setOperator(accountId1, privKey1)
  new TopicMessageQuery()
    .setTopicId(this.topicId.toString())
    .subscribe(client, null, (message) => {
      let messageAsString = Buffer.from(message.contents).toString();
      console.log(
        `${message.consensusTimestamp.toDate()} Received: ${messageAsString}`
      );
    });
});