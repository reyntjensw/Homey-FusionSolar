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
        const settings = this.getSettings();
        let username = settings.username;
        let password = settings.password;
        const lunaApi = new LunaApi(username, password);

        await lunaApi.initializeSession();

        this.getProductionData(lunaApi, settings);

        this.homey.setInterval(async () => {
            await this.getProductionData(lunaApi, settings);
        }, 1000 * 60 * 10);


    }

    async getProductionData(lunaApi, settings) {
        try {

            this.log("get Data");

            const basicStats = await lunaApi.getBasicStats(this.getData().id);
            const [basicStatsObj] = await Promise.all([basicStats]);

            console.log(basicStatsObj);

            const devListData = await lunaApi.getDevList(this.getData().id);
            const [devListBatteryId, devListInverterId] = await Promise.all([devListData.battery, devListData.inverter]);



            await new Promise(r => setTimeout(r, 60000));
            console.log("devListBatteryId");
            console.log(devListBatteryId);
            if (settings.battery == true && devListBatteryId !== null) {
                const devRealKpiBattery = await lunaApi.getDevRealKpi(devListBatteryId.id, devListBatteryId.devTypeId);

                if (devRealKpiBattery !== null) {
                    await this.setCapabilityValue('measure_battery', devRealKpiBattery.battery_soc);
                    this.setStoreValue("measure_battery", devRealKpiBattery.battery_soc);

                    await this.setCapabilityValue('meter_power.discharge_power', devRealKpiBattery.ch_discharge_power / 1000).catch(this.error);
                    this.setStoreValue("discharge_power", devRealKpiBattery.ch_discharge_power / 1000);
                }

            }
            await new Promise(r => setTimeout(r, 60000));

            console.log("devListInverterId");
            console.log(devListInverterId);
            if (devListInverterId !== null) {
                const devRealKpiInverter = await lunaApi.getDevRealKpi(devListInverterId.id, devListInverterId.devTypeId);
                console.log(devRealKpiInverter);
                await this.setCapabilityValue('meter_power.sun_power', devRealKpiInverter.mppt_power);
                this.setStoreValue("sun_power", devRealKpiInverter.mppt_power);
            }

            if (basicStatsObj !== null) {
                await this.setCapabilityValue('meter_power.day', basicStatsObj.day_power).catch(this.error);
                this.setStoreValue("yield_day", basicStatsObj.day_power);

                await this.setCapabilityValue('meter_power.month', basicStatsObj.month_power).catch(this.error);
                this.setStoreValue("yield_month", basicStatsObj.month_power);

                await this.setCapabilityValue('meter_power.total_power', basicStatsObj.total_power).catch(this.error);
                this.setStoreValue("yield_total_power", basicStatsObj.total_power);

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
        //this.getProductionData();

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
