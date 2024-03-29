const HuaweiDriver = require('../../classes/driver.js');
const { LunaApi } = require('../../classes/api.js');

class LunaDriver extends HuaweiDriver {

    onPair(session) {
        let username;
        let password;
        let lunaApi;

        session.setHandler('login', async (data) => {
            try {
                this.homey.settings.set('username', data.username);
                this.homey.settings.set('password', data.password);
                this.homey.settings.set('new', false);


                console.log("Username :");
                console.log(data.username);
                username = data.username;
                password = data.password;

                lunaApi = new LunaApi(username, password);
                const session = await lunaApi.initializeSession();

                return session;
            } catch (error) {
                this.error(error);
            }
        });

        session.setHandler('list_devices', async (data) => {
            try {
                lunaApi = new LunaApi(username, password);
                const systemsOld = await lunaApi.getSystemsOld();
                const systems = Object;
                console.log("systems :");
                console.log(systemsOld);

                if (systemsOld !== null && Object.entries(systemsOld).length !== 0) {
                    console.log("Hit old")
                    if (Object.entries(systemsOld).length !== 0) {

                        const devices = systemsOld.map(item => ({
                            name: item.stationName,
                            data: {
                                id: item.stationCode,
                                capacity: item.capacity * 1000,
                            },
                            settings: { username, password }

                        }));

                        return devices;
                    } else {
                        return this.error("No devices found");
                    }
                }

            } catch (error) {
                this.error(error);
            }
        });

    }

}
module.exports = LunaDriver;
