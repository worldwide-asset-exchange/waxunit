const child_process = require('child_process');

const { Api, JsonRpc, RpcError, Serialize } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const fs = require('fs');

const TESTING_KEY = '5KQwrPbwdL6PhXujxW37FSSQZ1JiwsST4cqQzDeyXtP79zkvFD3';
const TESTING_PUBLIC_KEY =
  'EOS6MRyAjQq8ud7hVNYcfnVPJqcVpscN5So8BhtHuGYqET5GDW5CV';

const signatureProvider = new JsSignatureProvider([TESTING_KEY]);
const rpc = new JsonRpc('http://localhost:8888', { fetch });
const api = new Api({
  rpc,
  signatureProvider,
  textDecoder: new TextDecoder(),
  textEncoder: new TextEncoder(),
});

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
  restartWaxLight: 'docker exec -d wax-light /opt/wax-all/run-light-chain.sh',
  waitForChainReady:
    'docker exec wax-light /opt/wax-all/wait-for-chain-initialized.sh',
  pullLatest:
    'docker pull 731278070712.dkr.ecr.us-east-2.amazonaws.com/wax-all:latest',
  loginAws:
    'aws ecr get-login-password --region us-east-2 | docker login --username AWS --password-stdin 731278070712.dkr.ecr.us-east-2.amazonaws.com',
  getWaxLightIp:
    "docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' wax-light",
};

function execute(command, ignoreFail = false) {
  try {
    return child_process.execSync(command, { encoding: 'utf8' });
  } catch (e) {
    if (!ignoreFail) {
      throw e;
    }
    return false;
  }
}

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
    execute(commands.loginAws);
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

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

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

function createAccount(account) {
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
            bytes: 1000000,
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
    {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  );
}

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
    {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  );
}

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
    {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  );
}

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
    {
      blocksBehind: 3,
      expireSeconds: 30,
    }
  );
}

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
    {
      // Why the random stuff? To weakly deduplicate repeated transactions
      blocksBehind: 3 + Math.floor(Math.random() * 3),
      expireSeconds: 30 + Math.floor(Math.random() * 30),
    }
  );
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
};
