const HuaweiDriver = require('../../classes/driver.js');
const { LunaApi } = require('./api.js');

class LunaDriver extends HuaweiDriver {

    onPair(session) {
        let username;
        let password;
        let backend_server;
        let lunaApi;

        session.setHandler('region', async (data) => {
            this.config = {
                backend_server: data.region
            };
            this.homey.settings.set('backend_server', data.region);
            console.log(data)

            this.homey.app.log(`[Driver] ${this.id} - got config`, { ...this.config });

            return true;
        });
        session.setHandler('login', async (data) => {
            try {
                this.homey.settings.set('username', data.username);
                this.homey.settings.set('password', data.password);
                backend_server = this.homey.settings.get('backend_server');
                this.homey.settings.set('new', true);


                console.log("Username :");
                console.log(data.username);
                username = data.username;
                password = data.password;

                lunaApi = new LunaApi(username, password, backend_server);
                const session = await lunaApi.initializeSession();

                return session;
            } catch (error) {
                this.error(error);
            }
        });

        session.setHandler('list_devices', async (data) => {
            try {
                lunaApi = new LunaApi(username, password, backend_server);
                const systems = await lunaApi.getSystems();
                console.log(systems)


                if (systems !== null && Object.entries(systems).length !== 0) {
                    console.log("Hit")
                    if (Object.entries(systems).length !== 0) {

                        const devices = systems.map(item => ({
                            name: item,
                            data: {
                                id: item
                            },
                            settings: { username, password, backend_server }

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
