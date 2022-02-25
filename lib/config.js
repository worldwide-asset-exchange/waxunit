const child_process = require('child_process');
const { Api, JsonRpc } = require('eosjs');
const { JsSignatureProvider } = require('eosjs/dist/eosjs-jssig');
const fetch = require('node-fetch');
const { TextEncoder, TextDecoder } = require('util');
const { sleep } = require('./util');

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

function execute(command, ignoreFail = false) {
  try {
    return child_process.execSync(command, {
      encoding: 'utf8',
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
    // execute(commands.loginAws);
    // execute(commands.pullLatest);
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
  eosjs,
  TESTING_PUBLIC_KEY,
  sleep,
  dedupeTapos,
};
