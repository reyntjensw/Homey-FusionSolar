const axios = require('axios');
const { exit } = require('process');
const wrapper = require('axios-cookiejar-support').wrapper;
const CookieJar = require('tough-cookie').CookieJar;

const jar = new CookieJar();
var client = wrapper(axios.create({ jar }));

const date_ob = new Date();
// const fetchSession = require("fetch-session");

// const session = fetchSession({
//     initialCookie: "lang=en-US",
//     headers: {
//         Accept: "application/json",
//         "Content-Type": "application/json",
//     }
// });


// const httpAgent = new http.Agent({ keepAlive: true });

const map = new Map();
class LunaApi {
    constructor(username, password, server) {
        this.username = username;
        this.password = password;
        this.server = server;
    }

    async initializeSession() {

        var cookies_reg = await jar.getCookies("https://" + this.server + ".fusionsolar.huawei.com/");
        console.log(cookies_reg)
        const login_url = "https://" + this.server.slice(-3) + ".fusionsolar.huawei.com/unisso/v2/validateUser.action?"

        const params = new URLSearchParams({})

        params.append("decision", 1)
        params.append("service", 'https://' + this.server + '.fusionsolar.huawei.com/unisess/v1/auth?service=/netecowebext/home/index.html#/LOGIN')

        const sendRequest = async () => {

            try {
                const res = await client
                    .post(login_url + params.toString(), {
                        "organizationName": "",
                        "username": this.username,
                        "password": this.password
                    }, { withCredentials: true }
                    );
                for (const val of res.headers["set-cookie"]) {
                    const cookie = val.split(";")[0]
                    map.set(cookie.split("=")[0], cookie.split("=")[1])
                    await jar.setCookie(
                        cookie.split("=")[0] + '=' + cookie.split("=")[1] + '',
                        "https://" + this.server + ".fusionsolar.huawei.com/"
                    );
                }

                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();
        // console.log(response.headers["set-cookie"])



        // pushing the cookies into a map
        // for (const val of response.headers["set-cookie"]) {
        //     const cookie = val.split(";")[0]
        //     map.set(cookie.split("=")[0], cookie.split("=")[1])
        // }
        if (response.status !== 200) {
            console.error("Login failed");
            return false;
        } else {
            console.error("Login succeeded");

            const sendRoarandRequest = async () => {

                try {
                    const res = await client
                        .get("https://" + this.server + ".fusionsolar.huawei.com/unisess/v1/auth/session", { withCredentials: true });
                    // console.log(res);
                    return res

                } catch (error) {
                    console.log(error)
                }
            };

            const response2 = await sendRoarandRequest();
            var cookie = await jar.setCookie(
                'roarand=' + response2.data.csrfToken + '',
                "https://" + this.server + ".fusionsolar.huawei.com/"
            );
            return true
        }


    }
    async getSystems() {
        const params = new URLSearchParams({})
        params.append("_", Math.round(Date.now()))

        console.log(this.server)
        const sendRequest = async () => {

            try {
                const res = await client
                    .get("https://" + this.server + ".fusionsolar.huawei.com/rest/neteco/web/organization/v2/company/current?" + params.toString(), { withCredentials: true });
                // console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();

        if (response.status !== 200) {
            console.error("Session retrieval failed");
        }

        return [response.data.data.moDn]

    }
    async getPowerStatus() {
        const params = new URLSearchParams({})
        params.append("_", Math.round(Date.now()))
        params.append("queryTime", Math.round(Date.now()))
        params.append("timeZone", 1)
        // const config = {
        //     headers: Object.fromEntries(map)

        // };

        const sendRequest = async () => {

            try {
                const res = await client
                    .get("https://" + this.server + ".fusionsolar.huawei.com/rest/pvms/web/station/v1/station/total-real-kpi?" + params.toString(), { withCredentials: true }
                    );
                // console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();

        if (response.status !== 200) {
            console.error("getPowerStatus failed");
        }
        return response.data.data
    }

    async getStationList() {
        let date_ob = new Date();
        var cookies_reg = await jar.getCookies("https://" + this.server + ".fusionsolar.huawei.com/");
        // console.log(cookies_reg)
        const roarand = String(cookies_reg.find(element => element.key === 'roarand'))
        // console.log(roarand)
        client.defaults.headers.Cookie = cookies_reg;



        console.log("getStationList")
        const sendRequest = async () => {
            const config = {
                headers: {
                    "Content-Type": "application/json",
                    "roarand": String(roarand.split(";")[0]).split("=")[1],
                },

            };
            const data = JSON.stringify({
                "curPage": 1,
                "pageSize": 10,
                "gridConnectedTime": "",
                "queryTime": new Date(date_ob.getFullYear() + "-" + ("0" + (date_ob.getMonth() + 1)).slice(-2) + "-" + ("0" + date_ob.getDate()).slice(-2) + " 00:00:00").valueOf(),
                "timeZone": 2,
                "sortId": "createTime",
                "sortDir": "DESC",
                "locale": "en_US"
            });

            try {
                const res = await client
                    .post("https://" + this.server + ".fusionsolar.huawei.com/rest/pvms/web/station/v1/station/station-list", data, config, { withCredentials: true }
                    );

                // console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();
        if (response.status !== 200) {
            console.error("getStationList failed");
        }
        return response.data.data.list[0]
    }

    async getDeviceIds(company_id) {
        const params = new URLSearchParams({})
        params.append("_", Math.round(Date.now()))
        params.append("conditionParams.parentDn", company_id)
        params.append("conditionParams.mocTypes", "20814,20815,20816,20819,20822,50017,60066,60014,60015,23037")
        // const config = {
        //     headers: Object.fromEntries(map)

        // };

        const sendRequest = async () => {

            try {
                const res = await client
                    .get("https://" + this.server + ".fusionsolar.huawei.com/rest/neteco/web/config/device/v1/device-list?" + params.toString());
                //  console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();
        const map = new Map()
        for (const val of response.data.data) {
            map.set(val["mocTypeName"], val["dn"])
        }
        // console.log(map)

        if (response.status !== 200) {
            console.error("getPowerStatus failed");
        }
        // console.log(response.data.data[1]["stationKey"])
        return response.data.data[1]["stationKey"]
    }
    //not usefull
    async getPlantFlow(station_id) {
        const params = new URLSearchParams({})
        params.append("stationDn", station_id)
        params.append("_", Math.round(Date.now()))

        const sendRequest = async () => {

            try {
                const res = await client
                    .get("https://" + this.server + ".fusionsolar.huawei.com/rest/pvms/web/station/v1/overview/energy-flow?" + params.toString());
                // console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();
        // console.log(response.data.data.flow)
        // const map = new Map()
        // for (const val of response.data.data) {
        //     map.set(val["mocTypeName"], val["dn"])
        // }
        // console.log(map)

        if (response.status !== 200) {
            console.error("getPlantFlow failed");
        }

        return response.data.data
        // return map
    }


    async getPlantStats(plant_id) {
        const params = new URLSearchParams({})
        params.append("stationDn", plant_id)
        params.append("timeDim", 2)
        params.append("queryTime", new Date(date_ob.getFullYear() + "-" + ("0" + (date_ob.getMonth() + 1)).slice(-2) + "-" + ("0" + date_ob.getDate()).slice(-2) + " 00:00:00").valueOf())
        params.append("timeZone", 2)
        params.append("timeZoneStr", "Europe/Amsterdam")
        params.append("_", Math.round(Date.now()))

        const sendRequest = async () => {

            try {
                const res = await client
                    .get("https://" + this.server + ".fusionsolar.huawei.com/rest/pvms/web/station/v1/overview/energy-balance?" + params.toString());
                // console.log(res);
                return res

            } catch (error) {
                console.log(error)
            }
        };

        const response = await sendRequest();
        // console.log(response.data)
        // const map = new Map()
        // for (const val of response.data.data) {
        //     map.set(val["mocTypeName"], val["dn"])
        // }
        // console.log(map)

        if (response.status !== 200) {
            console.error("getPlantFlow failed");
        }

        return response.data.data
        // return map
    }
    async clearCookies() {
        await jar.removeAllCookies()
    }

    async logOut() {
        await this.clearCookies();
        client = wrapper(axios.create({ jar }));

    }
}


module.exports = { LunaApi };
