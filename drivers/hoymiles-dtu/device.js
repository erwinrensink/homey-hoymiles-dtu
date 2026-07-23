'use strict';

const Homey = require('homey');
const HoymilesClient = require('../../lib/hoymiles/client');

module.exports = class HoymilesDTUDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
  async onInit() {

    this.log('Hoymiles DTU Device initialized');

    const settings = this.getSettings();

    const host = settings.ip;
    const port = Number(settings.port);
    const unitId = Number(settings.unitId);

    this.log(`Settings:
    IP      : ${host}
    Port    : ${port}
    Unit ID : ${unitId}`);

    this.log(`Connecting to ${host}:${port}`);
    this.client = new HoymilesClient(host, port, unitId);

    try {
      await this.client.connect();
      this.log('Connected to Hoymiles DTU');
      // await this.client.scanMicroinverters();
      await this.updateValues();  
    } catch (err) {
      this.error(err);
    }

    this.pollTimer = this.homey.setInterval(async () => {
      try {
        await this.updateValues();
      } catch (err) {
        this.error(err);
      }
    }, 10000);
  }

  /**
   * onAdded is called when the user adds the device, called just after pairing.
   */
  async onAdded() {

    this.log('Device added');

    await this.setSettings({
      ip: '192.168.2.73',
      port: 502,
      unitId: 1,
    });

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
    this.log('MyDevice settings where changed');
  }

  /**
   * onRenamed is called when the user updates the device's name.
   * This method can be used this to synchronise the name to the device.
   * @param {string} name The new name
   */
  async onRenamed(name) {
    this.log('MyDevice was renamed');
  }

  /**
   * onDeleted is called when the user deleted the device.
   */
  async onDeleted() {
    if (this.pollTimer) {
      this.homey.clearInterval(this.pollTimer);
    }
    await this.client.disconnect();
    this.log('MyDevice has been deleted');
  }

  async updateValues() {
    const data = await this.client.readRealtimeData();
    this.log('Realtime data:', JSON.stringify(data));
    await this.setCapabilityValue(
      'measure_power',
      data.power
    );
  }  
};
