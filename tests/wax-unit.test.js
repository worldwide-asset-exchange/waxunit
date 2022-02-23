const {
  setupTestChain,
  randomWamAccount,
  createAccount,
  setContract,
  updateAuth,
  linkauth,
  eosjs,
  transfer,
  TESTING_PUBLIC_KEY,
  getTableRows,
  genericAction,
  dedupeTapos,
} = require('../');

describe('my test suite', () => {
  beforeAll(async () => {
    await setupTestChain(); // Must be called first to setup the test chain

    await createAccount('mycontract11');

    await setContract(
      'mycontract11',
      'tests/test-contract/build/testcontract.wasm',
      'tests/test-contract/build/testcontract.abi'
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
