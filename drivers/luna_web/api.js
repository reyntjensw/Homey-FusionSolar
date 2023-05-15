const fetch = require('node-fetch');
const axios = require('axios')
const http = require('http');
const https = require('https');
const { exit } = require('process');

// const httpAgent = new http.Agent({ keepAlive: true });
const agent = new https.Agent({ keepAlive: true });




const url = "region01eu5";
class LunaApi {
    constructor(username, password, server) {
        this.username = username;
        this.password = password;
        this.server = server;
    }

    async initializeSession() {
        const login_url = "https://" + url.slice(-3) + ".fusionsolar.huawei.com/unisso/v2/validateUser.action?"

        const params = new URLSearchParams({})
        params.append("decision", 1)
        params.append("service", 'https://region01eu5.fusionsolar.huawei.com/unisess/v1/auth?service=/netecowebext/home/index.html#/LOGIN')

        const apiResponse = await fetch(login_url + params.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                "organizationName": "",
                "username": this.username,
                "password": this.password
            }),
            agent

        });

        const data = await apiResponse.json();
        console.log(data)

        if (data.status !== 200) {
            // throw new console.error("Login failed");
        }


        const params2 = new URLSearchParams({})
        params2.append("_", Math.round(Date.now()))
        console.log(params2);
        console.log(this.server)
        const session = await fetch("https://" + this.server + ".fusionsolar.huawei.com/rest/neteco/web/organization/v2/company/current?" + params2.toString(), {
            method: "GET",
            agent
        })

        const sessionOutput = await session.json();
        console.log(sessionOutput);
        exit(0)
        if (sessionOutput.status !== 200) {
            // throw new console.error("Session retrieval failed");
        }

    }

    // async apiRequest(url, methodContent, requestBody) {

    //     const apiResponse = await fetch(url, {
    //         method: methodContent,
    //         headers: {
    //             'Accept': 'application/json',
    //             'Content-Type': 'application/json;charset=UTF-8'
    //         },
    //         body: requestBody,
    //     });

    //     const apiData = await apiResponse;
    //     const bodyData = await apiData.text();

    //     token = apiData.headers.get('xsrf-token');
    //     if (apiData.statusText === 'OK' && bodyData.length > 0) {
    //         return true;
    //     } else {
    //         return false;
    //     }
    // }
}


module.exports = { LunaApi };
const api = new LunaApi("xxxxx", "xxxxx", "region01eu5");
api.initializeSession();
