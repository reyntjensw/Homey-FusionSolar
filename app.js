'use strict';

const Homey = require('homey');

class HuaweiSolar extends Homey.App {

    /**
     * onInit is called when the app is initialized.
     */
    async onInit() {
        this.log('HuaweiSolar has been initialized');
    }

}

module.exports = HuaweiSolar;
