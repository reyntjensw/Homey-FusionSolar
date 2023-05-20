'use strict';
const { exit } = require('process');


const { Device } = require('homey');
const { LunaApi } = require('./api');
const { setTimeout } = require('timers/promises');

let powerStatsObj = Object;
let basicStatsObj = Object;
let detailStatsObj = Object;
let plantStatsObj = Object;

let lunaApi = "";
let settings = "";
// let devListData = {
//     battery: '',
//     inverter: '',
//     powerSensor: ''
// };


class LunaDevice extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.log('Huawei has been initialized');
        //init values
        await this.setSettings({
            username: this.homey.settings.get('username'),
            password: this.homey.settings.get('password'),
            new_system: this.homey.settings.get('new'),
        });
        if (this.hasCapability('meter_power.day') === false) {
            await this.addCapability('meter_power.day');
        }
        if (this.hasCapability('meter_power.month') === false) {
            await this.addCapability('meter_power.month');
        }
        if (this.hasCapability('meter_power.capacity') === false) {
            await this.addCapability('meter_power.capacity');
        }
        if (this.hasCapability('meter_power.total_power') === false) {
            await this.addCapability('meter_power.total_power');
        }
        // if (this.hasCapability('measure_battery') === false) {
        //     await this.addCapability('measure_battery');
        // }
        // if (this.hasCapability('meter_power.discharge_power') === false) {
        //     await this.addCapability('meter_power.discharge_power');
        // }
        // if (this.hasCapability('meter_power.import_export') === false) {
        //     await this.addCapability('meter_power.import_export');
        // }
        if (this.hasCapability('meter_power.sun_power') === false) {
            await this.addCapability('meter_power.sun_power');
        }
        // if (this.hasCapability('meter_power.positive_active_energy') === false) {
        //     await this.addCapability('meter_power.positive_active_energy');
        // }
        // if (this.hasCapability('meter_power.negative_active_energy') === false) {
        //     await this.addCapability('meter_power.negative_active_energy');
        // }
        // if (this.hasCapability('measure_power') === false) {
        //     await this.addCapability('measure_power');
        // }
        // if (this.hasCapability('inverter_temperature') === false) {
        //     await this.addCapability('inverter_temperature');
        // }
        // if (this.hasCapability('solar_efficiency') === false) {
        //     await this.addCapability('solar_efficiency');
        // }

        settings = this.getSettings();
        let username = settings.username;
        let password = settings.password;
        let server = settings.backend_server;

        lunaApi = new LunaApi(username, password, server);

        await lunaApi.initializeSession();
        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 61 * 2);
    }

    async getProductionData() {
        try {
            // await lunaApi.getSystems();
            // await lunaApi.getDeviceIds(this.getData().id);
            //station code NE=33687631
            // await lunaApi.getPlantStats("NE=33586204");
            powerStatsObj = await lunaApi.getPowerStatus();
            console.log(powerStatsObj)
            // setTimeout(function () {
            //     console.log('Third log message - after 5 second');
            // }, 5000);
            detailStatsObj = await lunaApi.getStationList();
            // console.log(detailStatsObj)
            // plantStatsObj = await lunaApi.getPlantStats(detailStatsObj.dn);
            // console.log(plantStatsObj)
            // const arr = Array.from(detailStatsObj.dailyNrg, ([key, value]) => {
            //     return { [key]: value };
            // });
            // console.log(arr)
            // for (const val of detailStatsObj.dailyNrg) {
            //     console.log("line")
            //     console.log(val)
            // }

            if (detailStatsObj.realNrgKpi.dailyNrg) {
                await this.setCapabilityValue('meter_power.day', Number(detailStatsObj.realNrgKpi.dailyNrg.pvNrg)).catch(this.error);
                this.setStoreValue("yield_day", Number(detailStatsObj.realNrgKpi.dailyNrg.pvNrg));
            }
            if (detailStatsObj.monthEnergy) {
                await this.setCapabilityValue('meter_power.month', Number(detailStatsObj.monthEnergy)).catch(this.error);
                this.setStoreValue("yield_month", Number(detailStatsObj.monthEnergy));
            }
            if (powerStatsObj.cumulativeEnergy) {
                await this.setCapabilityValue('meter_power.total_power', powerStatsObj.cumulativeEnergy).catch(this.error);
                this.setStoreValue("yield_total_power", powerStatsObj.cumulativeEnergy);
            }
            if (powerStatsObj.inverterPower) {
                this.setCapabilityValue('meter_power.capacity', powerStatsObj.inverterPower * 1000).catch(this.error);
            }

            if (settings.battery == true) {

                // await this.setCapabilityValue('measure_battery', devRealKpiBattery.battery_soc);
                // this.setStoreValue("measure_battery", devRealKpiBattery.battery_soc);
                // await this.setCapabilityValue('meter_power.discharge_power', devRealKpiBattery.ch_discharge_power / 1000).catch(this.error);
                // this.setStoreValue("discharge_power", devRealKpiBattery.ch_discharge_power / 1000);

            }
            if (powerStatsObj.currentPower) {
                await this.setCapabilityValue('meter_power.sun_power', powerStatsObj.currentPower).catch(this.error);
            }
            // await lunaApi.logOut()

            if (!this.getAvailable()) {
                await this.setAvailable();
            }
        } catch (error) {
            this.error(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
}
module.exports = LunaDevice;
