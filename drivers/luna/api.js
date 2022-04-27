const fetch = require('node-fetch');
const { URLSearchParams } = require('url');

const baseUrl = 'https://intl.fusionsolar.huawei.com/thirdData';
let token;
class LunaApi {
    constructor(username, password) {
        this.username = username;
        this.password = password;
    }

    async initializeSession() {
        try {
            const accountUrl = `${baseUrl}/login`;

            const requestBody = JSON.stringify({
                "userName": this.username,
                "systemCode": this.password
            });
            const apiData = await this.apiRequest(accountUrl, 'POST', requestBody);
            return apiData;
        } catch (error) {
            this.error(`Unavailable (${error})`);
        }

    }

    async apiRequest(url, methodContent, requestBody) {
        try {
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

        } catch (error) {
            this.error(`Unavailable (${error})`);
            throw new Error(apiData.text());
        }

    }

    async getSystems() {
        try {
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
            return apiData["data"];
        } catch (error) {
            this.error(`Unavailable (${error})`);
        }

    }

    async getBasicStats(stationCode) {
        try {
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

            return apiData["data"][0]["dataItemMap"];
        } catch (error) {
            this.error(`Unavailable (${error})`);
        }

    }
    async getDevList(stationCode, devTypeId) {
        try {
            const systemsUrl = `${baseUrl}/getDevList`;

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

            for (let index = 0; index < apiData["data"].length; index++) {
                if (apiData["data"][index]["devTypeId"] == devTypeId) {
                    return apiData["data"][index];
                }
            }
        } catch (error) {
            this.error(`Unavailable (${error})`);
        }

    }
    async getDevRealKpi(devIds, devTypeId) {
        try {
            const systemsUrl = `${baseUrl}/getDevRealKpi`;
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

            const apiData = await response.json();
            return apiData["data"];
        } catch (error) {
            this.error(`Unavailable (${error})`);
        }

    }
}

module.exports = { LunaApi };
