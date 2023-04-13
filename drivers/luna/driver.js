'use strict';

const { Driver } = require('homey');
const { LunaApi } = require('./api');

class Luna extends Driver {

    /**
     * onInit is called when the driver is initialized.
     */
    async onInit() {
        this.log('Luna has been initialized');

        try {
            const cardConditionBatteryFull = this.homey.flow.getConditionCard("the-battery-is-full");
            cardConditionBatteryFull.registerRunListener(async (args) => {
                if (args.device.getStoreValue("measure_battery") >= 95) {
                    return true;
                } else {
                    return false;
                }
            })
        } catch (error) {
            console.log(error);
        }

        try {
            const cardConditionBatteryEmpty = this.homey.flow.getConditionCard("the-battery-is-nearly-empty");
            cardConditionBatteryEmpty.registerRunListener(async (args) => {
                if (args.device.getStoreValue("measure_battery") <= 10) {
                    return true;
                } else {
                    return false;
                }
            })
        } catch (error) {
            console.log(error);
        }

        try {
            const cardConditionSunIsShining = this.homey.flow.getConditionCard("the-sun-is-still-shining");
            cardConditionSunIsShining.registerRunListener(async (args) => {
                if (args.device.getStoreValue("sun_power") * 1000 >= 100) {
                    return true;
                } else {
                    return false;
                }
            })
        } catch (error) {
            console.log(error);
        }
    }

    onPair(session) {
        let username;
        let password;
        let lunaApi;

        session.setHandler('login', async (data) => {
            try {
                this.homey.settings.set('username', data.username);
                this.homey.settings.set('password', data.password);

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
                const systemsNew = await lunaApi.getSystemsNew();
                var systems = Object;
                console.log("systemsOld");
                console.log(systemsOld);
                console.log("systemsNew");
                console.log(systemsNew);

                if (systemsOld !== null && Object.entries(systemsOld).length !== 0) {
                    console.log("Hit old")
                    systems.plantName = systemsOld.stationName;
                    systems.plantCode = systemsOld.stationCode;
                }
                if (systemsNew !== null && Object.entries(systemsNew).length !== 0) {
                    console.log("Hit New")
                    systems = systemsNew;
                }
                console.log("systems :");
                console.log(systems);
                if (Object.entries(systems).length !== 0) {

                    const devices = systems.map(item => ({
                        name: item.plantName,
                        data: {
                            id: item.plantCode,
                            capacity: item.capacity * 1000,
                        },
                        settings: { username, password }

                    }));

                    return devices;
                } else {
                    return this.error("No devices found");
                }
            } catch (error) {
                this.error(error);
            }
        });

    }

    /**
     * onPairListDevices is called when a user is adding a device
     * and the 'list_devices' view is called.
     * This should return an array with the data of devices that are available for pairing.
     */
    // async onPairListDevices() {
    //     return [
    //         // Example device data, note that `store` is optional
    //         // {
    //         //   name: 'My Device',
    //         //   data: {
    //         //     id: 'my-device',
    //         //   },
    //         //   store: {
    //         //     address: '127.0.0.1',
    //         //   },
    //         // },
    //     ];
    // }

}

module.exports = Luna;
