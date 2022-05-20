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
        if (this.hasCapability('meter_power.import_export') === false) {
            await this.addCapability('meter_power.import_export');
        }
        if (this.hasCapability('meter_power.sun_power') === false) {
            await this.addCapability('meter_power.sun_power');
        }

        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 60 * 10);


    }

    async getProductionData() {
        try {
            const settings = this.getSettings();
            let username = settings.username;
            let password = settings.password;
            let server = settings.backend_server;
            console.log(server);

            const lunaApi = new LunaApi(username, password);

            await lunaApi.initializeSession();
            this.log("get Data");

            const basicStats = await lunaApi.getBasicStats(this.getData().id);
            const [basicStatsObj] = await Promise.all([basicStats]);

            // console.log(basicStatsObj);

            const devListData = await lunaApi.getDevList(this.getData().id);
            const [devListBatteryId, devListInverterId, devListpowerMeterId] = await Promise.all([devListData.battery, devListData.inverter, devListData.powerSensor]);

            // console.log("devListpowerMeterId");
            // console.log(devListpowerMeterId);
            if (settings.battery == true && devListBatteryId !== null) {
                const devRealKpiBattery = await lunaApi.getDevRealKpi(devListBatteryId.id, devListBatteryId.devTypeId, server);

                if (devRealKpiBattery !== null) {
                    await this.setCapabilityValue('measure_battery', devRealKpiBattery.battery_soc);
                    this.setStoreValue("measure_battery", devRealKpiBattery.battery_soc);

                    await this.setCapabilityValue('meter_power.discharge_power', devRealKpiBattery.ch_discharge_power / 1000).catch(this.error);
                    this.setStoreValue("discharge_power", devRealKpiBattery.ch_discharge_power / 1000);
                }
            }

            // console.log("devListInverterId");
            // console.log(devListInverterId);
            if (devListInverterId !== null) {
                const devRealKpiInverter = await lunaApi.getDevRealKpi(devListInverterId.id, devListInverterId.devTypeId, server);
                console.log(devRealKpiInverter);
                await this.setCapabilityValue('meter_power.sun_power', devRealKpiInverter.mppt_power);
                this.setStoreValue("sun_power", devRealKpiInverter.mppt_power);
            }

            console.log("devListpowerMeterId");
            console.log(devListpowerMeterId);
            if (devListpowerMeterId !== null) {
                const devRealKpiPowerSensor = await lunaApi.getDevRealKpi(devListpowerMeterId.id, devListpowerMeterId.devTypeId, server);
                await this.setCapabilityValue('meter_power.import_export', devRealKpiPowerSensor.active_power);
                this.setStoreValue("import_export", devRealKpiPowerSensor.active_power);
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
