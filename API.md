## Constants

<dl>
<dt><a href="#TESTING_PUBLIC_KEY">TESTING_PUBLIC_KEY</a></dt>
<dd><p>This public key is used to initialize all accounts in the local blockchain and via createAccount
It should be used as the active and owner keys when updating auth on accounts you create</p>
</dd>
<dt><a href="#eosjs">eosjs</a> : <code>object</code></dt>
<dd><p>This is the standard eosjs library at the core of this library. You have access to the rpc and api members.</p>
</dd>
</dl>

## Functions

<dl>
<dt><a href="#setupTestChain">setupTestChain()</a></dt>
<dd><p>Sets up the test chain docker image. Must be the first function called in your suite. Only call once</p>
</dd>
<dt><a href="#sleep">sleep(milliseconds)</a> ⇒ <code>Promise</code></dt>
<dd><p>Sleeps for the given milliseconds duration</p>
</dd>
<dt><a href="#randomWamAccount">randomWamAccount()</a> ⇒ <code>string</code></dt>
<dd><p>Generates a random *.wam account name</p>
</dd>
<dt><a href="#createAccount">createAccount(account, [bytes])</a> ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code></dt>
<dd><p>Create an account on the blockchain</p>
</dd>
<dt><a href="#setContract">setContract(account, wasmFile, abiFile)</a> ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code></dt>
<dd><p>Set a contract on a blockchain account</p>
</dd>
<dt><a href="#updateAuth">updateAuth(account, permission, parent)</a> ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code></dt>
<dd><p>Update permissions and keys on an account</p>
</dd>
<dt><a href="#linkauth">linkauth(account, requirement, permission, type)</a> ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code></dt>
<dd><p>Link actions to an account permission</p>
</dd>
<dt><a href="#transfer">transfer(from, to, quantity, memo)</a> ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code></dt>
<dd><p>Transfer WAX</p>
</dd>
<dt><a href="#getTableRows">getTableRows(code, table, scope, [limit])</a> ⇒ <code>Promise.&lt;Array&gt;</code></dt>
<dd><p>Get rows from a smart contract table</p>
</dd>
<dt><a href="#genericAction">genericAction(account, name, data, authorization)</a> ⇒ <code>Promise.&lt;authorization&gt;</code></dt>
<dd><p>Run a generic blockchain action</p>
</dd>
<dt><a href="#dedupeTapos">dedupeTapos()</a> ⇒ <code>Tapos</code></dt>
<dd><p>Generates the tapos fields for a transaction such that the expireSecods field is randomly generated.
This allows for a weak way to deduplicate repeated transactions, which can happen a lot in testing.</p>
</dd>
</dl>

<a name="TESTING_PUBLIC_KEY"></a>

## TESTING\_PUBLIC\_KEY
This public key is used to initialize all accounts in the local blockchain and via createAccount
It should be used as the active and owner keys when updating auth on accounts you create

**Kind**: global constant  
<a name="eosjs"></a>

## eosjs : <code>object</code>
This is the standard eosjs library at the core of this library. You have access to the rpc and api members.

**Kind**: global constant  
**Example**  
```js
eosjs.rpc.get_table_rows(...)
eosjs.api.transact(...)
```
<a name="setupTestChain"></a>

## setupTestChain()
Sets up the test chain docker image. Must be the first function called in your suite. Only call once

**Kind**: global function  
**Api**: public  
**Example**  
```js
beforeAll(async () => {
  await setupTestChain():
});
```
<a name="sleep"></a>

## sleep(milliseconds) ⇒ <code>Promise</code>
Sleeps for the given milliseconds duration

**Kind**: global function  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| milliseconds | <code>Number</code> | number of milliseconds to sleep |

<a name="randomWamAccount"></a>

## randomWamAccount() ⇒ <code>string</code>
Generates a random *.wam account name

**Kind**: global function  
**Returns**: <code>string</code> - a random wam account  
**Api**: public  
<a name="createAccount"></a>

## createAccount(account, [bytes]) ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code>
Create an account on the blockchain

**Kind**: global function  
**Returns**: <code>Promise.&lt;TransactionReceipt&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| account | <code>string</code> |  | accouunt name to generate |
| [bytes] | <code>Number</code> | <code>1000000</code> | number of RAM bytes to initialize the account with. Default 1000000 |

<a name="setContract"></a>

## setContract(account, wasmFile, abiFile) ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code>
Set a contract on a blockchain account

**Kind**: global function  
**Returns**: <code>Promise.&lt;TransactionReceipt&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| account | <code>string</code> | accouunt to set the contract on |
| wasmFile | <code>string</code> | wasm file path to set |
| abiFile | <code>string</code> | abi file path to set |

<a name="updateAuth"></a>

## updateAuth(account, permission, parent) ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code>
Update permissions and keys on an account

**Kind**: global function  
**Returns**: <code>Promise.&lt;TransactionReceipt&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| account | <code>string</code> | accouunt to update |
| permission | <code>string</code> | permission to affect. Ex. 'active' |
| parent | <code>string</code> | parent of the above permission. Ex. 'owner' |

<a name="linkauth"></a>

## linkauth(account, requirement, permission, type) ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code>
Link actions to an account permission

**Kind**: global function  
**Returns**: <code>Promise.&lt;TransactionReceipt&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| account | <code>string</code> | accouunt to update |
| requirement | <code>string</code> | permission required |
| permission | <code>string</code> | contract to associate |
| type | <code>string</code> | action to assocate on the code above |

<a name="transfer"></a>

## transfer(from, to, quantity, memo) ⇒ <code>Promise.&lt;TransactionReceipt&gt;</code>
Transfer WAX

**Kind**: global function  
**Returns**: <code>Promise.&lt;TransactionReceipt&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| from | <code>string</code> | accouunt to send from |
| to | <code>string</code> | account to send to |
| quantity | <code>string</code> | amount of WAX to send. Ex: '1.00000000 WAX' |
| memo | <code>string</code> | arbitrary message |

<a name="getTableRows"></a>

## getTableRows(code, table, scope, [limit]) ⇒ <code>Promise.&lt;Array&gt;</code>
Get rows from a smart contract table

**Kind**: global function  
**Returns**: <code>Promise.&lt;Array&gt;</code> - array of table entries  
**Api**: public  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| code | <code>string</code> |  | contract account to query |
| table | <code>string</code> |  | table in the contract to query |
| scope | <code>string</code> |  | scope for the table |
| [limit] | <code>Number</code> | <code>100</code> | max rows to return. Default 100 |

<a name="genericAction"></a>

## genericAction(account, name, data, authorization) ⇒ <code>Promise.&lt;authorization&gt;</code>
Run a generic blockchain action

**Kind**: global function  
**Returns**: <code>Promise.&lt;authorization&gt;</code> - transaction receipt  
**Api**: public  

| Param | Type | Description |
| --- | --- | --- |
| account | <code>string</code> | contract account |
| name | <code>string</code> | action to fire |
| data | <code>Object</code> | action data json |
| authorization | <code>Authorization</code> | authorization object. Ie the actor executing the action |

<a name="dedupeTapos"></a>

## dedupeTapos() ⇒ <code>Tapos</code>
Generates the tapos fields for a transaction such that the expireSecods field is randomly generated.
This allows for a weak way to deduplicate repeated transactions, which can happen a lot in testing.

**Kind**: global function  
**Returns**: <code>Tapos</code> - tapos object  
**Api**: public  
**Example**  
```js
eosjs.api.transact({
  actions: [...],
},
dedupeTapos());
```
