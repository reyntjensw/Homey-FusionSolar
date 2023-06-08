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
            new_system: this.homey.settings.get('new')
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
        if (this.hasCapability('meter_power.fed_to_grid') === false) {
            await this.addCapability('meter_power.fed_to_grid');
        }
        if (this.hasCapability('meter_power.import_from_grid') === false) {
            await this.addCapability('meter_power.import_from_grid');
        }
        if (this.hasCapability('meter_power.battery_discharge') === false) {
            await this.addCapability('meter_power.battery_discharge');
        }
        if (this.hasCapability('meter_power.battery_charge') === false) {
            await this.addCapability('meter_power.battery_charge');
        }
        if (this.hasCapability('meter_power.battery_cumulative_discharge') === false) {
            await this.addCapability('meter_power.battery_cumulative_discharge');
        }
        if (this.hasCapability('measure_battery') === false) {
            await this.addCapability('measure_battery');
        }
        if (this.hasCapability('meter_power.sun_power') === false) {
            await this.addCapability('meter_power.sun_power');
        }
        if (this.hasCapability('meter_power.active_power') === false) {
            await this.addCapability('meter_power.active_power');
        }
        if (this.hasCapability('measure_power') === false) {
            await this.addCapability('measure_power');
        }


        settings = this.getSettings();
        let username = settings.username;
        let password = settings.password;
        let server = settings.backend_server;
        console.log(server)

        lunaApi = new LunaApi(username, password, server);

        await lunaApi.initializeSession();
        await this.getProductionData();
        await lunaApi.logOut()
        this.homey.setInterval(async () => {
            lunaApi = new LunaApi(username, password, server);

            await lunaApi.initializeSession();
            await this.getProductionData();
            await lunaApi.logOut()
        }, 1000 * 61 * 2);
    }

    async getProductionData() {
        try {
            settings = this.getSettings();

            // await lunaApi.getSystems();
            const stationKey = await lunaApi.getDeviceIds(this.getData().id);
            // console.log("stationKey")
            // console.log(stationKey)
            //station code NE=33687631
            const powerInfo = await lunaApi.getPlantFlow(stationKey);
            // console.log("powerInfo")
            // console.log(powerInfo)
            // console.log(powerInfo.flow["nodes"])

            powerStatsObj = await lunaApi.getPowerStatus();
            // console.log("powerStatsObj")
            // console.log(powerStatsObj)

            detailStatsObj = await lunaApi.getStationList();
            console.log("detailStatsObj");
            console.log(detailStatsObj);


            if (detailStatsObj.realNrgKpi.dailyNrg.pvNrg) {
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
            if (detailStatsObj.installedCapacity) {
                this.setCapabilityValue('meter_power.capacity', Number(detailStatsObj.installedCapacity)).catch(this.error);
            }
            if (detailStatsObj.rptNrgKpi.dailyNrg.onGridNrg) {
                await this.setCapabilityValue('meter_power.fed_to_grid', Number(detailStatsObj.rptNrgKpi.dailyNrg.onGridNrg)).catch(this.error);
                this.setStoreValue("fed_to_grid", Number(detailStatsObj.rptNrgKpi.dailyNrg.onGridNrg));
            }
            if (detailStatsObj.rptNrgKpi.dailyNrg.buyNrg) {
                await this.setCapabilityValue('meter_power.import_from_grid', Number(detailStatsObj.rptNrgKpi.dailyNrg.buyNrg)).catch(this.error);
                this.setStoreValue("import_from_grid", Number(detailStatsObj.rptNrgKpi.dailyNrg.buyNrg));
            }
            if (powerInfo.flow["nodes"][1]["deviceTips"]["ACTIVE_POWER"]) {
                await this.setCapabilityValue('meter_power.active_power', Number(powerInfo.flow["nodes"][1]["deviceTips"]["ACTIVE_POWER"])).catch(this.error);
                this.setStoreValue("active_power", Number(powerInfo.flow["nodes"][1]["deviceTips"]["ACTIVE_POWER"]));
            }

            if (settings.battery == true) {
                if (detailStatsObj.rptNrgKpi.dailyNrg.disNrg) {
                    await this.setCapabilityValue('meter_power.battery_discharge', Number(detailStatsObj.rptNrgKpi.dailyNrg.disNrg)).catch(this.error);
                    this.setStoreValue("battery_discharge", Number(detailStatsObj.rptNrgKpi.dailyNrg.disNrg));
                }
                if (powerStatsObj.cumulativeDisChargeCapacity) {
                    await this.setCapabilityValue('meter_power.battery_cumulative_discharge', Number(powerStatsObj.cumulativeDisChargeCapacity)).catch(this.error);
                    this.setStoreValue("battery_cumulative_discharge", Number(powerStatsObj.cumulativeDisChargeCapacity));
                }
                if (detailStatsObj.rptNrgKpi.dailyNrg.chgNrg) {
                    await this.setCapabilityValue('meter_power.battery_charge', Number(detailStatsObj.rptNrgKpi.dailyNrg.chgNrg)).catch(this.error);
                    this.setStoreValue("battery_charge", Number(detailStatsObj.rptNrgKpi.dailyNrg.chgNrg));
                }
                await this.setCapabilityValue('measure_battery', Number(powerInfo.flow["nodes"][4]['deviceTips']['SOC']));
                this.setStoreValue("measure_battery", Number(powerInfo.flow["nodes"][4]['deviceTips']['SOC']));

            }
            if (powerStatsObj.currentPower) {
                await this.setCapabilityValue('meter_power.sun_power', powerStatsObj.currentPower).catch(this.error);
                await this.setCapabilityValue('measure_power', powerStatsObj.currentPower * 1000).catch(this.error);
                this.setStoreValue("measure_power", Number(powerStatsObj.currentPower));

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
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        console.log('Huawei settings where changed');
        this.getProductionData();
    }
}
module.exports = LunaDevice;
