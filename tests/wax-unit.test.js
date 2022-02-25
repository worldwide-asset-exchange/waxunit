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
  let myContract;
  beforeAll(async () => {
    await setupTestChain(); // Must be called first to setup the test chain

    await createAccount('mycontract11');

    myContract = await setContract(
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

  it('should init table data', async () => {
    await myContract.loadTable('entries', {
      [myContract.account]: [
        {
          id: 1,
          entry_time: '2022-02-24T22:27:57',
        },
        {
          id: 2,
          entry_time: '2022-03-25T22:28:58',
        },
      ],
    });
    const entries = await getTableRows(
      myContract.account,
      `entries`,
      myContract.account
    );
    expect(entries.length).toEqual(2);
    expect(entries[0].id).toEqual(1);
    expect(entries[0].entry_time).toEqual('2022-02-24T22:27:57');
  });

  it('should init table data from json file', async () => {
    await myContract.loadTableFromFile('entries', 'tests/entries.json');
    const entries = await getTableRows(
      myContract.account,
      `entries`,
      'loadfile1111'
    );
    expect(entries.length).toEqual(3);
    expect(entries[0].id).toEqual(1);
    expect(entries[0].entry_time).toEqual('2022-02-24T22:26:56');
  });

  it('should call addentry action', async () => {
    await myContract.call(
      'addentry',
      [
        {
          actor: myContract.account,
          permission: 'active',
        },
      ],
      {
        id: 3,
      }
    );
    const entries = await getTableRows(
      myContract.account,
      `entries`,
      myContract.account
    );
    expect(entries.length).toEqual(3);
    expect(entries[2].id).toEqual(3);
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
