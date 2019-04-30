# The Keys

This API allows to controll and get status of the smart lock [`The Keys`](https://www.the-keys.eu).

Go to https://api.the-keys.fr to get the lockerId and the code of the gateway.

## Usage
```javascript
const TheKeys = require('the-keys').TheKeys;

const gatewayHost = '192.168.1.15';
const gatewayCode = 'xxxxxxxxxxxxx';
const lockId = '1234';
const door = new TheKeys(lockId, gatewayCode,  gatewayHost);

async function main() {
    const res = await door.lock();
    const status = await door.status();
    console.log(res, status);
}

main();
```

## API

### `const door = new TheKeys(lockerId, gatewayCode, gatewayHost[, gatewayPort])`

### `door.lock()`
```javascript
{ status: 'ok', code: 0 }
```

### `door.unlock()`
```javascript
{ status: 'ok', code: 0 }
```

### `door.status()`
```javascript
{
    status: 'Door closed',
    code: 49,
    id: xxxx,
    version: 59,
    position: 4,
    rssi: -70,
    battery: 7512 
}
```

> The field `battery` is the power in mV. Interpretation : 6200mV => 0% and 8000mV => 100%.