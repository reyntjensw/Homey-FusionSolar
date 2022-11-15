const modbus = require('jsmodbus');
const net = require('net');
const socket = new net.Socket();

let modbusOptions = {
    'host': "172.30.27.38",
    'port': 502,
    'unitId': 0,
    'timeout': 5000,
    'autoReconnect': true,
    'reconnectTimeout': 4000,
    'logLabel': 'Huawei modbus',
    'logLevel': 'error',
    'logEnabled': false
}
// const { URLSearchParams } = require('url');

class ModbusApi {
    constructor(ip) {
        this.ip = ip;
    }

    async initializeSession() {

        let client = new modbus.client.TCP(socket, 3)
        socket.connect(modbusOptions);

        socket.on('connect', () => {
            console.log('Connected ...');

            this.pollingInterval = setInterval(() => {
                Promise.all([
                    client.readHoldingRegisters(30000, 15)
                ]).then((results) => {
                    console.log(results)
                })

            })
        }, 30 * 1000)


    }
}

//     async apiRequest(url, methodContent, requestBody) {

//         const apiResponse = await fetch(url, {
//             method: methodContent,
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json;charset=UTF-8'
//             },
//             body: requestBody,
//         });

//         const apiData = await apiResponse;
//         const bodyData = await apiData.text();

//         token = apiData.headers.get('xsrf-token');
//         if (apiData.statusText === 'OK' && bodyData.length > 0) {
//             return true;
//         } else {
//             return false;
//         }
//     }

//     async getSystems() {

//         const systemsUrl = `${baseUrl}/getStationList`;

//         const response = await fetch(systemsUrl, {
//             method: "POST",
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json;charset=UTF-8',
//                 "XSRF-TOKEN": token,
//             }
//         });
//         const apiData = await response.json();
//         return apiData.data;

//     }

//     async getBasicStats(stationCode) {
//         const systemsUrl = `${baseUrl}/getStationRealKpi`;

//         let bodyData = JSON.stringify({
//             "stationCodes": stationCode
//         });
//         const response = await fetch(systemsUrl, {
//             method: "POST",
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json;charset=UTF-8',
//                 "XSRF-TOKEN": token,
//             },
//             body: bodyData
//         });

//         const apiData = await response.json();
//         if (apiData.data !== null) {
//             return apiData.data[0].dataItemMap;
//         } else {
//             return null;
//         }
//     }

//     async getDevList(stationCode) {

//         const systemsUrl = `${baseUrl}/getDevList`;
//         let battery = "";
//         let inverter = "";
//         let powerSensor = "";

//         let bodyData = JSON.stringify({
//             "stationCodes": stationCode
//         });
//         const response = await fetch(systemsUrl, {
//             method: "POST",
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json;charset=UTF-8',
//                 "XSRF-TOKEN": token,
//             },
//             body: bodyData
//         });

//         const apiData = await response.json();

//         for (let index = 0; index < apiData.data.length; index++) {

//             if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('Battery')) {
//                 battery = apiData.data[index];
//             }

//             if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('meter')) {
//                 powerSensor = apiData.data[index];
//             }

//             if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('Power Sensor')) {
//                 powerSensor = apiData.data[index];
//             }

//             if (apiData.data[index]["invType"] !== null && apiData.data[index]["invType"].includes("SUN2000-")) {
//                 inverter = apiData.data[index];
//             }
//         }
//         return { battery, inverter, powerSensor };

//     }
//     async getDevRealKpi(devIds, devTypeId, server) {

//         const systemsUrl = `https://${server}.fusionsolar.huawei.com:31942/thirdData/getDevRealKpi`;
//         let bodyData = JSON.stringify({
//             "devIds": devIds,
//             "devTypeId": devTypeId
//         });
//         const response = await fetch(systemsUrl, {
//             method: "POST",
//             headers: {
//                 'Accept': 'application/json',
//                 'Content-Type': 'application/json;charset=UTF-8',
//                 "XSRF-TOKEN": token,
//             },
//             body: bodyData
//         });

//         const apiData = await response.json();

//         if (apiData.errorCode !== "undefined") {
//             if (apiData.data !== 'undefined') {
//                 return apiData.data[0].dataItemMap;;
//             } else {
//                 return null;
//             }
//         } else {
//             return null;
//         }



//     }
// }

module.exports = { ModbusApi };
