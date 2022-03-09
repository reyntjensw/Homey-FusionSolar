'use strict';

const { Device } = require('homey');
const { LunaApi } = require('./api');

class Huawei extends Device {

    /**
     * onInit is called when the device is initialized.
     */
    async onInit() {
        this.log('Huawei has been initialized');
        //init values
        await this.setSettings({
            username: this.homey.settings.get('username'),
            password: this.homey.settings.get('password'),
        });
        if (this.hasCapability('meter_power.day') === false) {
            await this.addCapability('meter_power.day');
        }
        if (this.hasCapability('meter_power.month') === false) {
            await this.addCapability('meter_power.month');
        }
        if (this.hasCapability('meter_power.installed_capacity') === false) {
            await this.addCapability('meter_power.installed_capacity');
        }
        if (this.hasCapability('meter_power.total_power') === false) {
            await this.addCapability('meter_power.total_power');
        }
        if (this.hasCapability('measure_battery') === false) {
            await this.addCapability('measure_battery');
        }
        if (this.hasCapability('meter_power.discharge_power') === false) {
            await this.addCapability('meter_power.discharge_power');
        }
        if (this.hasCapability('meter_power.sun_power') === false) {
            await this.addCapability('meter_power.sun_power');
        }
        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 60 * 5);
    }

    async getProductionData() {
        try {
            this.log("get Data");
            const settings = this.getSettings();
            let username = settings.username;
            let password = settings.password;

            const lunaApi = new LunaApi(username, password);

            await lunaApi.initializeSession();
            // Gather data
            const basicStats = lunaApi.getBasicStats(this.getData().id);
            const Battery = await lunaApi.getDevList(this.getData().id, 39);
            const Inverter = await lunaApi.getDevList(this.getData().id, 1);

            const [devListBatteryId, devListInverterId] = await Promise.all([Battery, Inverter]);
            if (settings.battery == true && devListBatteryId != null) {
                const devRealKpiBattery = await lunaApi.getDevRealKpi(devListBatteryId["id"], 39);
                await this.setCapabilityValue('measure_battery', devRealKpiBattery[0].dataItemMap.battery_soc);
                await this.setCapabilityValue('meter_power.discharge_power', devRealKpiBattery[0].dataItemMap.ch_discharge_power / 1000).catch(this.error);
            }

            if (devListInverterId != null) {
                const devRealKpiInverter = await lunaApi.getDevRealKpi(devListInverterId["id"], 1);
                await this.setCapabilityValue('meter_power.sun_power', devRealKpiInverter[0].dataItemMap.mppt_power);
            }

            const [basicStatsObj] = await Promise.all([basicStats]);
            if (basicStatsObj != null) {
                await this.setCapabilityValue('meter_power.day', basicStatsObj.day_power).catch(this.error);
                await this.setCapabilityValue('meter_power.month', basicStatsObj.month_power).catch(this.error);
                await this.setCapabilityValue('meter_power.total_power', basicStatsObj.total_power).catch(this.error);
                this.setCapabilityValue('meter_power.installed_capacity', this.getData().capacity).catch(this.error);
            }

            if (!this.getAvailable()) {
                await this.setAvailable();
            }
        } catch (error) {
            this.error(`Unavailable (${error})`);
            this.setUnavailable(`Error retrieving data (${error})`);
        }
    }
    /**
     * onAdded is called when the user adds the device, called just after pairing.
     */
    async onAdded() {
        this.log('Huawei has been added');
    }

    /**
     * onSettings is called when the user updates the device's settings.
     * @param {object} event the onSettings event data
     * @param {object} event.oldSettings The old settings object
     * @param {object} event.newSettings The new settings object
     * @param {string[]} event.changedKeys An array of keys changed since the previous version
     * @returns {Promise<string|void>} return a custom message that will be displayed
     */
    async onSettings({ oldSettings, newSettings, changedKeys }) {
        this.log('Huawei settings where changed');
        this.getProductionData();

    }

    /**
     * onRenamed is called when the user updates the device's name.
     * This method can be used this to synchronise the name to the device.
     * @param {string} name The new name
     */
    async onRenamed(name) {
        this.log('Huawei was renamed');
    }

    /**
     * onDeleted is called when the user deleted the device.
     */
    async onDeleted() {
        this.log('Huawei has been deleted');
    }

}

module.exports = Huawei;
