const child_process = require('child_process');

const { Api, JsonRpc, RpcError, Serialize } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const fs = require('fs');

/**
 * This public key is used to initialize all accounts in the local blockchain and via createAccount
 * It should be used as the active and owner keys when updating auth on accounts you create
 * @constant
 */
const TESTING_PUBLIC_KEY =
  'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';
const TESTING_KEY = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';

const signatureProvider = new JsSignatureProvider([TESTING_KEY]);
const rpc = new JsonRpc('http://localhost:8888', { fetch });
const api = new Api({
  rpc,
  signatureProvider,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder(),
});

/**
 * This is the standard eosjs library at the core of this library. You have access to the rpc and api members.
 * @constant
 * @type {object}
 * @example
 * eosjs.rpc.get_table_rows(...)
 * eosjs.api.transact(...)
 */
const eosjs = {
  rpc,
  api,
};

const commands = {
  getContainers: 'docker ps -a',
  stopWaxAll: 'docker stop wax-all',
  removeWaxAll: 'docker rm wax-all',
  startWaxLight:
    'docker run --entrypoint /opt/wax-all/run-light-chain.sh --log-driver json-file --log-opt max-size=10m --log-opt max-file=3 -d -p 8080:8080 -p 8888:8888 --name wax-light 731278070712.dkr.ecr.us-east-2.amazonaws.com/wax-all:latest',
  restartWaxLight: 'docker exec -d wax-light /opt/wax-all/rerun-light-chain.sh',
  waitForChainReady:
    'docker exec wax-light /opt/wax-all/wait-a-bit-for-chain-initialized.sh',
  pullLatest:
    'docker pull 731278070712.dkr.ecr.us-east-2.amazonaws.com/wax-all:latest',
  loginAws:
    'aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 731278070712.dkr.ecr.us-east-2.amazonaws.com',
  getWaxLightIp:
    "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' wax-light",
};

const COMMAND_TIMEOUT = 5000;
function execute(command, ignoreFail = false) {
  try {
    return child_process.execSync(command, {
      encoding: 'utf8',
      timeout: COMMAND_TIMEOUT,
    });
  } catch (e) {
    if (!ignoreFail) {
      throw e;
    }
    return false;
  }
}

/**
 * Sets up the test chain docker image. Must be the first function called in your suite. Only call once
 *
 * @example
 * beforeAll(async () => {
 *   await setupTestChain():
 * });
 *
 * @api public
 */
async function setupTestChain() {
  let res = execute(commands.getContainers);
  const waxAllRunning = res.includes('wax-all');
  const waxLightRunning = res.includes('wax-light');
  if (waxAllRunning && !waxLightRunning) {
    execute(commands.stopWaxAll);
    execute(commands.removeWaxAll);
  }
  if (waxLightRunning) {
    execute(commands.restartWaxLight);
  } else {
    if (!process.env['NO_AWS_LOGIN']) {
      execute(commands.loginAws);
    }
    execute(commands.pullLatest);
    execute(commands.startWaxLight);
  }
  while (!execute(commands.waitForChainReady, true)) {
    await sleep(1000);
  }
  const waxLightIp = execute(commands.getWaxLightIp).trim();
  const rpc = new JsonRpc(`http://${waxLightIp}:8888`, { fetch });
  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  });
  eosjs.rpc = rpc;
  eosjs.api = api;
}

/**
 * Sleeps for the given milliseconds duration
 *
 * @param {Number} milliseconds number of milliseconds to sleep
 * @return {Promise}
 * @api public
 */
function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

/**
 * Generates a random *.wam account name
 *
 * @return {string} a random wam account
 * @api public
 */
function randomWamAccount() {
  const chars = 'abcdefghijklmnopqrstuvwxyz12345.';
  const length = Math.ceil(Math.random() * 5) + 3;
  let name = '.wam';
  for (let i = 0; i < length; i++) {
    let c = Math.floor(Math.random() * chars.length);
    name = chars[c] + name;
  }
  return name;
}

/**
 * Create an account on the blockchain
 *
 * @param {string} account accouunt name to generate
 * @param {Number=} bytes number of RAM bytes to initialize the account with. Default 1000000
 * @return {Promise<TransactionReceipt>} transaction receipt
 * @api public
 */
function createAccount(account, bytes = 1000000) {
  return eosjs.api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'newaccount',
          authorization: [
            {
              actor: 'eosio',
              permission: 'active',
            },
          ],
          data: {
            creator: 'eosio',
            name: account,
            owner: {
              threshold: 1,
              keys: [
                {
                  key: TESTING_PUBLIC_KEY,
                  weight: 1,
                },
              ],
              accounts: [],
              waits: [],
            },
            active: {
              threshold: 1,
              keys: [
                {
                  key: TESTING_PUBLIC_KEY,
                  weight: 1,
                },
              ],
              accounts: [],
              waits: [],
            },
          },
        },
        {
          account: 'eosio',
          name: 'buyrambytes',
          authorization: [
            {
              actor: 'eosio',
              permission: 'active',
            },
          ],
          data: {
            payer: 'eosio',
            receiver: account,
            bytes,
          },
        },
        {
          account: 'eosio',
          name: 'delegatebw',
          authorization: [
            {
              actor: 'eosio',
              permission: 'active',
            },
          ],
          data: {
            from: 'eosio',
            receiver: account,
            stake_net_quantity: '10.00000000 WAX',
            stake_cpu_quantity: '10.00000000 WAX',
            transfer: 0,
          },
        },
      ],
    },
    dedupeTapos()
  );
}

/**
 * Set a contract on a blockchain account
 *
 * @param {string} account accouunt to set the contract on
 * @param {string} wasmFile wasm file path to set
 * @param {string} abiFile abi file path to set
 * @return {Promise<TransactionReceipt>} transaction receipt
 * @api public
 */
function setContract(account, wasmFile, abiFile) {
  const buffer = new Serialize.SerialBuffer({
    textEncoder: eosjs.api.textEncoder,
    textDecoder: eosjs.api.textDecoder,
  });

  let abiJSON = JSON.parse(fs.readFileSync(abiFile, 'utf8'));
  const abiDefinitions = eosjs.api.abiTypes.get('abi_def');

  abiJSON = abiDefinitions.fields.reduce(
    (acc, { name: fieldName }) =>
      Object.assign(acc, { [fieldName]: acc[fieldName] || [] }),
    abiJSON
  );
  abiDefinitions.serialize(buffer, abiJSON);
  serializedAbiHexString = Buffer.from(buffer.asUint8Array()).toString('hex');

  const wasmHexString = fs.readFileSync(wasmFile).toString('hex');

  return eosjs.api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'setcode',
          authorization: [
            {
              actor: account,
              permission: 'active',
            },
          ],
          data: {
            account,
            vmtype: 0,
            vmversion: 0,
            code: wasmHexString,
          },
        },
        {
          account: 'eosio',
          name: 'setabi',
          authorization: [
            {
              actor: account,
              permission: 'active',
            },
          ],
          data: {
            account,
            abi: serializedAbiHexString,
          },
        },
      ],
    },
    dedupeTapos()
  );
}

/**
 * Update permissions and keys on an account
 *
 * @param {string} account accouunt to update
 * @param {string} permission permission to affect. Ex. 'active'
 * @param {string} parent parent of the above permission. Ex. 'owner'
 * @return {Promise<TransactionReceipt>} transaction receipt
 * @api public
 */
function updateAuth(account, permission, parent, auth) {
  return eosjs.api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'updateauth',
          authorization: [
            {
              actor: account,
              permission: parent || 'owner',
            },
          ],
          data: {
            account,
            permission,
            parent,
            auth,
          },
        },
      ],
    },
    dedupeTapos()
  );
}

/**
 * Link actions to an account permission
 *
 * @param {string} account accouunt to update
 * @param {string} requirement permission required
 * @param {string} permission contract to associate
 * @param {string} type action to assocate on the code above
 * @return {Promise<TransactionReceipt>} transaction receipt
 * @api public
 */
function linkauth(account, requirement, code, type) {
  return eosjs.api.transact(
    {
      actions: [
        {
          account: 'eosio',
          name: 'linkauth',
          authorization: [
            {
              actor: account,
              permission: 'active',
            },
          ],
          data: {
            account,
            requirement,
            code,
            type,
          },
        },
      ],
    },
    dedupeTapos()
  );
}

/**
 * Transfer WAX
 *
 * @param {string} from accouunt to send from
 * @param {string} to account to send to
 * @param {string} quantity amount of WAX to send. Ex: '1.00000000 WAX'
 * @param {string} memo arbitrary message
 * @return {Promise<TransactionReceipt>} transaction receipt
 * @api public
 */
function transfer(from, to, quantity, memo) {
  return genericAction(
    'eosio.token',
    'transfer',
    {
      from,
      to,
      quantity,
      memo,
    },
    [
      {
        actor: from,
        permission: 'active',
      },
    ]
  );
}

/**
 * Get rows from a smart contract table
 *
 * @param {string} code contract account to query
 * @param {string} table table in the contract to query
 * @param {string} scope scope for the table
 * @param {Number=} limit max rows to return. Default 100
 * @return {Promise<Array>} array of table entries
 * @api public
 */
async function getTableRows(code, table, scope, limit = 100) {
  const res = await eosjs.rpc.get_table_rows({
    json: true,
    code,
    scope,
    table,
    limit,
    reverse: false,
    show_payer: false,
  });
  return res.rows;
}

/**
 * Run a generic blockchain action
 *
 * @param {string} account contract account
 * @param {string} name action to fire
 * @param {Object} data action data json
 * @param {Authorization} authorization authorization object. Ie the actor executing the action
 * @return {Promise<authorization>} transaction receipt
 * @api public
 */
function genericAction(account, name, data, authorization) {
  return eosjs.api.transact(
    {
      actions: [
        {
          account,
          name,
          authorization,
          data,
        },
      ],
    },
    dedupeTapos()
  );
}

/**
 * Generates the tapos fields for a transaction such that the expireSecods field is randomly generated.
 * This allows for a weak way to deduplicate repeated transactions, which can happen a lot in testing.
 *
 * @example
 * eosjs.api.transact({
 *   actions: [...],
 * },
 * dedupeTapos());
 *
 * @return {Tapos} tapos object
 * @api public
 */
function dedupeTapos() {
  return {
    blocksBehind: 3,
    // Why the random stuff? To weakly deduplicate repeated transactions
    expireSeconds: 300 + Math.floor(Math.random() * 3300),
  };
}

module.exports = {
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
};
