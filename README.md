# waxunit

This unit test framework allows quick and simple unit testing capabilities for samar contracts on the wax blockchain

## Installation

```
$ npm install --save-dev waxunit
```

## Usage

### Tests Setuup 

In the first `beforeAll` type function of your unit tests you must call `setupTestChain`. Example:

```
// This is the entire API available to you
const {
  setupTestChain,
  randomWamAccount,
  sleep,
  eosjs,
  createAccount,
  setContract,
  updateAuth,
  linkauth,
  getTableRows,
  transfer,
  TESTING_PUBLIC_KEY,
  genericAction,
} = require('./wax-unit');

describe('my test suite', () => {
  beforeAll(async () => {
    await setupTestChain();
    await createAccount('mycontract11');
    
    await setContract(
      'mycontract11',
      'build/mycontract11.wasm',
      'build/mycontract11.abi'
    );
    await updateAuth('mycontract11', `active`, `owner`, {
      threshold: 1,
      accounts: [
        {
          permission: {
            actor: 'mycontract11',
            permission: `eosio.code`,
          },
          weight: 1,
        },
      ],
      keys: [
        {
          key: TESTING_PUBLIC_KEY,
          weight: 1,
        },
      ],
      waits: [],
    });

    await transfer(
      'eosio',
      'mycontract11',
      '200.00000000 WAX',
      `sending some test funds`
    );
  });

  it('my test case', async () => {
    expect(balances.length).toEqual(1);
    expect(balances[0].balance).toEqual('200.00000000 WAX');
  });
});
```