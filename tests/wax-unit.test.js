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
  addTime,
} = require('../');

describe('wax-unit', () => {
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

  it('can read tables', async () => {
    const balances = await getTableRows(
      'eosio.token',
      `accounts`,
      'mycontract11'
    );
    expect(balances.length).toEqual(1);
    expect(balances[0].balance).toEqual('200.00000000 WAX');
  });

  describe('addTime', () => {
    it('standard path', async () => {
      // add new entry
      const res = await genericAction(
        'mycontract11',
        'addentry',
        {
          id: 1,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      let entries = await getTableRows(
        'mycontract11',
        `entries`,
        'mycontract11'
      );

      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(1);

      await expect(
        genericAction(
          'mycontract11',
          'expireentry',
          {
            id: 1,
            expiry_seconds: 600,
          },
          [
            {
              actor: 'mycontract11',
              permission: 'active',
            },
          ]
        )
      ).rejects.toThrow('Entry not expired yet');

      await addTime(601, res.processed.block_time);

      await genericAction(
        'mycontract11',
        'expireentry',
        {
          id: 1,
          expiry_seconds: 600,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      entries = await getTableRows('mycontract11', `entries`, 'mycontract11');

      expect(entries.length).toBe(0);
    });

    it('can add multiple times', async () => {
      // add new entry
      const res = await genericAction(
        'mycontract11',
        'addentry',
        {
          id: 1,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      let entries = await getTableRows(
        'mycontract11',
        `entries`,
        'mycontract11'
      );

      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(1);

      await expect(
        genericAction(
          'mycontract11',
          'expireentry',
          {
            id: 1,
            expiry_seconds: 600,
          },
          [
            {
              actor: 'mycontract11',
              permission: 'active',
            },
          ]
        )
      ).rejects.toThrow('Entry not expired yet');

      await addTime(300, res.processed.block_time);

      await expect(
        genericAction(
          'mycontract11',
          'expireentry',
          {
            id: 1,
            expiry_seconds: 600,
          },
          [
            {
              actor: 'mycontract11',
              permission: 'active',
            },
          ]
        )
      ).rejects.toThrow('Entry not expired yet');

      await addTime(301);

      await genericAction(
        'mycontract11',
        'expireentry',
        {
          id: 1,
          expiry_seconds: 600,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      entries = await getTableRows('mycontract11', `entries`, 'mycontract11');

      expect(entries.length).toBe(0);
    });

    it('can add far into the future', async () => {
      // add new entry
      const res = await genericAction(
        'mycontract11',
        'addentry',
        {
          id: 1,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      let entries = await getTableRows(
        'mycontract11',
        `entries`,
        'mycontract11'
      );

      expect(entries.length).toBe(1);
      expect(entries[0].id).toBe(1);

      await expect(
        genericAction(
          'mycontract11',
          'expireentry',
          {
            id: 1,
            expiry_seconds: 600,
          },
          [
            {
              actor: 'mycontract11',
              permission: 'active',
            },
          ]
        )
      ).rejects.toThrow('Entry not expired yet');

      await addTime(600001, res.processed.block_time);

      await genericAction(
        'mycontract11',
        'expireentry',
        {
          id: 1,
          expiry_seconds: 600,
        },
        [
          {
            actor: 'mycontract11',
            permission: 'active',
          },
        ]
      );

      entries = await getTableRows('mycontract11', `entries`, 'mycontract11');

      expect(entries.length).toBe(0);
    });
  });
});
