# waxunit

This unit test framework allows quick and simple unit testing capabilities for samar contracts on the wax blockchain

## Installation

```
$ npm install --save-dev @waxio/waxunit
```

## API

See the [API](./API.md)

## Usage

### Tests Setup

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
  dedupeTapos,
} = require('@waxio/waxunit');

describe('my test suite', () => {
  beforeAll(async () => {
    await setupTestChain(); // Must be called first to setup the test chain

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
    const balances = await getTableRows(
      'eosio.token',
      `accounts`,
      'mycontract11'
    );
    expect(balances.length).toEqual(1);
    expect(balances[0].balance).toEqual('200.00000000 WAX');
  });
});
```

### Adjust block time

Call function `async function setTime(time)` to adjust block time. Refer [here](https://github.com/wolfcw/libfaketime) for more information about `time` format.

Example:

```javascript
await setTime('+60'); // sets the faked time to 1 minute in future
await setTime('+10m'); // 10 minutes in future

await setTime('+10y'); // 10 years in future
```

***note*** Do not set time behind the chain `head_block_time`, it make chain stuck and can not produce block.