const fetch = require('node-fetch');

const baseUrl = 'https://intl.fusionsolar.huawei.com/thirdData';
let token;
class LunaApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async initializeSession() {

        const accountUrl = `${baseUrl}/login`;
        const requestBody = JSON.stringify({
            "userName": this.username,
            "systemCode": this.password
        });
        const apiData = await this.apiRequest(accountUrl, 'POST', requestBody);
        return apiData;
    }

    async apiRequest(url, methodContent, requestBody) {

        const apiResponse = await fetch(url, {
            method: methodContent,
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8'
            },
            body: requestBody,
        });

        const apiData = await apiResponse;
        const bodyData = await apiData.text();

        token = apiData.headers.get('xsrf-token');
        if (apiData.statusText === 'OK' && bodyData.length > 0) {
            return true;
        } else {
            return false;
        }
    }

    async getSystemsOld() {

        const systemsUrl = `${baseUrl}/getStationList`;

        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                "XSRF-TOKEN": token,
            }
        });
        const apiData = await response.json();
        console.log(apiData);
        if (apiData.failCode !== "305" && apiData.data !== null && apiData.success) {
            return apiData.data;
        } else {
            return null;
        }
    }

    async getSystemsNew() {

        const systemsUrl = `${baseUrl}/stations`;

        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                "XSRF-TOKEN": token,
            },
            body:
                JSON.stringify({
                    "pageNo": 1
                })
        });
        const apiData = await response.json();
        console.log("Login list");
        console.log(apiData);
        if (apiData.failCode !== "305" && apiData.data !== null && apiData.success) {
            return apiData.data.list;
        } else {
            return null;
        }

    }

    async getBasicStats(stationCode) {

        const systemsUrl = `${baseUrl}/getStationRealKpi`;

        let bodyData = JSON.stringify({
            "stationCodes": stationCode
        });
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                "XSRF-TOKEN": token,
            },
            body: bodyData
        });

        const apiData = await response.json();
        if (apiData.failCode !== "305" && apiData.data !== null && apiData.success) {
            return apiData.data[0].dataItemMap;
        } else {
            return null;
        }
    }

    async getDevList(stationCode) {

        const systemsUrl = `${baseUrl}/getDevList`;
        let battery = "";
        let inverter = "";
        let powerSensor = "";

        let bodyData = JSON.stringify({
            "stationCodes": stationCode
        });
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                "XSRF-TOKEN": token,
            },
            body: bodyData
        });

        const apiData = await response.json();
        console.log('apiData getDevList values: ', apiData);
        if (apiData.failCode !== "305" && apiData.success) {
            try {
                for (let index = 0; index < apiData.data.length; index++) {

                    if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('Battery')) {
                        battery = apiData.data[index];
                    }

                    if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('meter')) {
                        powerSensor = apiData.data[index];
                    }

                    if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('Meter-1')) {
                        powerSensor = apiData.data[index];
                    }

                    if (apiData.data[index]["devName"] !== null && apiData.data[index]["devName"].includes('Power Sensor')) {
                        powerSensor = apiData.data[index];
                    }

                    if ((apiData.data[index]["devName"] !== null && apiData.data[index]["invType"] !== null) && apiData.data[index]["invType"].includes("SUN2000-")) {
                        inverter = apiData.data[index];
                    }
                }
            } catch (error) {
                console.log('getDevListData failed with: ', error);
            }
        } else {
            console.log('devListData failed: ', apiData.data);
        }

        return { inverter, powerSensor, battery };

    }
    async getDevRealKpi(devIds, devTypeId, server) {
        console.log(devIds, devTypeId, server)
        const systemsUrl = `https://${server}.fusionsolar.huawei.com:31942/thirdData/getDevRealKpi`;
        let bodyData = JSON.stringify({
            "devIds": devIds,
            "devTypeId": devTypeId
        });
        const response = await fetch(systemsUrl, {
            method: "POST",
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json;charset=UTF-8',
                "XSRF-TOKEN": token,
            },
            body: bodyData
        });

        try {

            const apiData = await response.json();
            console.log('apiData getDevRealKpi values: ', apiData);
            if (apiData.failCode !== "305" && apiData.errorCode !== "undefined" && apiData.success) {
                if (apiData.data !== 'undefined') {
                    return apiData.data[0].dataItemMap;;
                } else {
                    return null;
                }
            }
            else {
                return null;
            }
        } catch (error) {
            console.log('getDevRealKpi failed with: ', error);
        }
    }
}

module.exports = { LunaApi };
