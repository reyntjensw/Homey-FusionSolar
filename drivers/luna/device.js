'use strict';

const { Device } = require('homey');
const { LunaApi } = require('./api');

let devListData = {
    battery: '',
    inverter: '',
    powerSensor: ''
};

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
        if (this.hasCapability('meter_power.positive_active_energy') === false) {
            await this.addCapability('meter_power.positive_active_energy');
        }
        if (this.hasCapability('meter_power.negative_active_energy') === false) {
            await this.addCapability('meter_power.negative_active_energy');
        }
        if (this.hasCapability('meter_power.sun_power') === false) {
            await this.addCapability('meter_power.sun_power');
        }
        if (this.hasCapability('measure_power') === false) {
            await this.addCapability('measure_power');
        }
        if (this.hasCapability('inverter_temperature') === false) {
            await this.addCapability('inverter_temperature');
        }
        if (this.hasCapability('solar_efficiency') === false) {
            await this.addCapability('solar_efficiency');
        }

        this.getProductionData();

        this.homey.setInterval(async () => {
            await this.getProductionData();
        }, 1000 * 61);
    }

    async getProductionData() {
        try {
            const settings = this.getSettings();
            let username = settings.username;
            let password = settings.password;
            let server = settings.backend_server;
            console.log('server: ', server);

            const lunaApi = new LunaApi(username, password);

            await lunaApi.initializeSession();
            this.log("get basic Data");
            const basicStatsObj = await lunaApi.getBasicStats(this.getData().id);
            // console.log('basicStatsObj', basicStatsObj)
            if (basicStatsObj !== null) {
                if (basicStatsObj.day_power) {
                    await this.setCapabilityValue('meter_power.day', basicStatsObj.day_power).catch(this.error);
                    this.setStoreValue("yield_day", basicStatsObj.day_power);
                }
                if (basicStatsObj.month_power) {
                    await this.setCapabilityValue('meter_power.month', basicStatsObj.month_power).catch(this.error);
                    this.setStoreValue("yield_month", basicStatsObj.month_power);
                }
                if (basicStatsObj.total_power) {
                    await this.setCapabilityValue('meter_power.total_power', basicStatsObj.total_power).catch(this.error);
                    this.setStoreValue("yield_total_power", basicStatsObj.total_power);
                }
                if (this.getData().capacity) {
                    this.setCapabilityValue('meter_power.installed_capacity', this.getData().capacity).catch(this.error);
                }
            }
            this.log("get current Data");

            if(devListData.battery === '' && devListData.inverter === '' && devListData.powerSensor === ''){
                // console.log('id: ', this.getData().id);
                devListData = await lunaApi.getDevList(this.getData().id);
            }
            // console.log('devListData values: ', devListData);

            // console.log("devListpowerMeterId", devListData.battery);
            if (settings.battery == true && devListData.battery !== null) {
                const devRealKpiBattery = await lunaApi.getDevRealKpi(devListData.battery.id, devListData.battery.devTypeId, server);

                if (devRealKpiBattery !== null) {
                    await this.setCapabilityValue('measure_battery', devRealKpiBattery.battery_soc);
                    this.setStoreValue("measure_battery", devRealKpiBattery.battery_soc);

                    await this.setCapabilityValue('meter_power.discharge_power', devRealKpiBattery.ch_discharge_power / 1000).catch(this.error);
                    this.setStoreValue("discharge_power", devRealKpiBattery.ch_discharge_power / 1000);
                }
            }

            // console.log('devListInverterId', devListData.inverter);
            if (devListData.inverter !== null && devListData.inverter !== '' && devListData.inverter !== undefined) {
                const devRealKpiInverter = await lunaApi.getDevRealKpi(devListData.inverter.id, devListData.inverter.devTypeId, server);
                // console.log('devRealKpiInverter value: ', devRealKpiInverter);
                if(devRealKpiInverter !== null){
                    await this.setCapabilityValue('meter_power.sun_power', devRealKpiInverter.mppt_power);
                    await this.setCapabilityValue('measure_power', devRealKpiInverter.active_power * 1000);
                    await this.setCapabilityValue('inverter_temperature', devRealKpiInverter.temperature);
                    await this.setCapabilityValue('solar_efficiency', devRealKpiInverter.efficiency);
                    this.setStoreValue("sun_power", devRealKpiInverter.mppt_power);
                }
            }

            // console.log('devListpowerMeterId', devListData.powerSensor);
            if (devListData.powerSensor !== '' && devListData.powerSensor !== null && devListData.powerSensor !== undefined) {
                const devRealKpiPowerSensor = await lunaApi.getDevRealKpi(devListData.powerSensor.id, devListData.powerSensor.devTypeId, server);
                // console.log('devRealKpiPowerSensor value: ', devRealKpiPowerSensor);
                if(devRealKpiPowerSensor !== null){
                    await this.setCapabilityValue('meter_power.positive_active_energy', devRealKpiPowerSensor.active_cap);
                    await this.setCapabilityValue('meter_power.negative_active_energy', devRealKpiPowerSensor.reverse_active_cap);
                    await this.setCapabilityValue('meter_power.import_export', devRealKpiPowerSensor.active_power / 1000);
                    this.setStoreValue("import_export", devRealKpiPowerSensor.active_power / 1000);
                    this.setStoreValue("positive_active_energy", devRealKpiPowerSensor.active_cap);
                    this.setStoreValue("negative_active_energy", devRealKpiPowerSensor.reverse_active_cap);
                }
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
