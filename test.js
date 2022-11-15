const modbus = require('jsmodbus');
const net = require('net');
const socket = new net.Socket();

let modbusOptions = {
    'host': "172.30.27.38",
    'port': "502",
    'unitId': 1,
    'timeout': 5000,
    'autoReconnect': true,
    'reconnectTimeout': 4000,
    'logLabel': 'SMA Sunny Boy Storage',
    'logLevel': 'error',
    'logEnabled': false
}

socket.on('connect', () => {
    this.log('Connected ...');

    this.pollingInterval = setInterval(() => {
        Promise.all([
            client.readHoldingRegisters(30955, 2)
        ]).then((results) => {
            // let operational_code = decodeData.decodeU32(results[0].response._body._valuesAsArray, 0, 0);
            console.log(results)
        })
    })
})
