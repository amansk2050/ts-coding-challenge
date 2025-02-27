import { Given, Then, When } from "@cucumber/cucumber";
import {
  AccountBalanceQuery,
  AccountId,
  Client,
  PrivateKey, RequestType,
  TopicCreateTransaction, TopicInfoQuery,
  TopicMessageQuery, TopicMessageSubmitTransaction
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
  console.log({account})
  this.account = account
  const privKey: PrivateKey = PrivateKey.fromStringED25519(acc.privateKey);
  this.privKey = privKey
  client.setOperator(this.account, privKey);

//Create the query request
  const query = new AccountBalanceQuery().setAccountId(account);
  const balance = await query.execute(client)
  console.log("balance-------- ", balance.hbars.toBigNumber().toNumber())
  assert.ok(balance.hbars.toBigNumber().toNumber() > expectedBalance)
});


When(/^A topic is created with the memo "([^"]*)" with the first account as the submit key$/, async function (memo: string) {
    const tx =  await new TopicCreateTransaction().execute(client);
    const receipt = await tx.getReceipt(client);
    const newTopicId = receipt.topicId;
    console.log(`New HCS topic ID: ${newTopicId}`)

});

When(/^The message "([^"]*)" is published to the topic$/, async function (message: string) {
});

Then(/^The message "([^"]*)" is received by the topic and can be printed to the console$/, async function (message: string) {
});

Given(/^A second account with more than (\d+) hbars$/, async function () {

});

Given(/^A (\d+) of (\d+) threshold key with the first and second account$/, async function () {

});

When(/^A topic is created with the memo "([^"]*)" with the threshold key as the submit key$/, async function () {

});
