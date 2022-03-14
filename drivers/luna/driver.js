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
        this.log("begin");

        session.setHandler('login', async (data) => {
            try {
                this.homey.settings.set('username', data.username);
                this.homey.settings.set('password', data.password);

                console.log(data.username);

                lunaApi = new LunaApi(data.username, data.password);
                this.log("begin");
                await lunaApi.initializeSession();

                return true;
            } catch (error) {
                this.error(error);
            }
        });

        session.setHandler('list_devices', async (data) => {
            try {
                lunaApi = new LunaApi(username, password);
                const systems = await lunaApi.getSystems();

                const devices = systems.map(item => ({
                    name: item.stationName,
                    data: {
                        id: item.stationCode,
                        capacity: item.capacity * 1000,
                    },
                    settings: { username, password }

                }));
                console.debug(devices);

                return devices;
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
