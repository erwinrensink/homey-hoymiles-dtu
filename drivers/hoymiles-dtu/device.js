'use strict';

const Homey = require('homey');
const HoymilesClient = require('../../lib/hoymiles/client');
const HoymilesModel = require('../../lib/hoymiles/model');
const DEFAULT_POLL_INTERVAL = 10000;
const SUMMARY_REFRESH_INTERVAL = 10 * 60 * 1000; // 10 minuten

module.exports = class HoymilesDTUDevice extends Homey.Device {

  /**
   * onInit is called when the device is initialized.
   */
async onInit() {
      this.log('Hoymiles DTU Device initialized');
      const settings = this.getSettings();
      this.client = new HoymilesClient(
          settings.ip,
          Number(settings.port),
          Number(settings.unitId)
      );

      this.summary = null;
      this.summaryTimestamp = 0;
      
      try {
          await this.client.connect();
          this.log('Connected to Hoymiles DTU');
          
          // Registreer de Flow kaarten
          this.registerFlowCards();

          await this.updateValues();
          if (!this.getAvailable()) {
              await this.setAvailable();
          }
          this.startPolling();
      } catch (err) {
          this.error(err);
          await this.setUnavailable(err.message);
      }
  }

  startPolling() {
      this.pollTimer = this.homey.setInterval(
          async () => {
              try {
                  await this.updateValues();
              }
              catch (err) {
                  this.error(err);
              }
          },
          DEFAULT_POLL_INTERVAL
      );
  }

  stopPolling() {

      if (!this.pollTimer)
          return;
      this.homey.clearInterval(this.pollTimer);
      this.pollTimer = null;
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
    this.log('Settings gewijzigd');
    if (
      changedKeys.includes('ip') ||
      changedKeys.includes('port') ||
      changedKeys.includes('unitId')
    ) {
      this.stopPolling();
      await this.client.disconnect();
      this.client = new HoymilesClient(
        newSettings.ip,
        Number(newSettings.port),
        Number(newSettings.unitId)
      );
      await this.client.connect();
      await this.updateValues();
      this.startPolling();
    }
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
      this.stopPolling();
      await this.client.disconnect();
  }

async updateValues() {
    const model = await this.readModel();
    this.summary = model; // Zorg dat this.summary up-to-date blijft voor de condities
    this.logSummary(model);
    await this.updateCapabilities(model);

    // Controleer of we de 'power_exceeds' trigger moeten afvuren
    const summary = model.getSummary();
    this.powerExceedsTrigger.trigger(this, { power: summary.power }, { power: summary.power })
      .catch(this.error);
  }

  logSummary(model) {
      const summary = model.getSummary();
      this.log('');
      this.log('========================================');
      this.log('      Hoymiles Installatie');
      this.log('========================================');
      this.log(`Vermogen           : ${summary.power.toFixed(1)} W`);
      this.log(`Dagopbrengst       : ${summary.today.toFixed(2)} kWh`);
      this.log(`Totaal             : ${summary.total.toFixed(2)} kWh`);
      this.log(`Spanning           : ${summary.voltage.toFixed(1)} V`);
      this.log(`Frequentie         : ${summary.frequency.toFixed(2)} Hz`);
      this.log(`Temperatuur        : ${summary.temperature.toFixed(1)} °C`);
      this.log(`Actieve omvormers  : ${summary.activeInverters}`);
      this.log(`Actieve strings    : ${summary.activeInputs}`);
      this.log('');
      for (const inverter of model.getInverters()) {
          this.log(
              `Omvormer ${inverter.id}`
          );
          this.log(
              `   Vermogen        : ${inverter.getPower().toFixed(1)} W`
          );
          this.log(
              `   DC spanning     : ${inverter.getAveragePVVoltage().toFixed(1)} V`
          );
          this.log(
              `   DC stroom       : ${inverter.getAveragePVCurrent().toFixed(1)} A`
          );
          this.log(
              `   AC spanning     : ${inverter.getAverageVoltage().toFixed(1)} V`
          );
          this.log(
              `   Temperatuur     : ${inverter.getAverageTemperature().toFixed(1)} °C`
          );
          this.log(
              `   Actieve strings : ${inverter.getActiveInputs().length}/${inverter.inputs.length}`
          );
          const highest = inverter.getHighestInput();
          const lowest = inverter.getLowestInput();
          if (highest) {
              this.log(
                  `   Hoogste string  : P${highest.port} (${highest.getPower().toFixed(1)} W)`
              );
          }
          if (lowest) {
              this.log(
                  `   Laagste string  : P${lowest.port} (${lowest.getPower().toFixed(1)} W)`
              );
          }
                for (const input of inverter.inputs) {
          this.log(
              `P${input.port} Temp=${input.getTemperature()} ` +
              `Status=${input.getOperatingStatus()} ` +
              `Alarm=${input.getAlarmCode()}`
          );
      }
          this.log('');
      }
      this.log('========================================');
  }

  async updateCapabilities(model) {
    const capabilities = model.getCapabilities();
    for (const [capability, value] of Object.entries(capabilities)) {
      if (!this.hasCapability(capability))
        continue;
      const current = this.getCapabilityValue(capability);
      if (current === value)
        continue;
      await this.setCapabilityValue(capability, value);
    }
  }

  async readModel() {
      const now = Date.now();
      // Ververs de installation summary maximaal één keer per 10 minuten
      if (
          !this.summary ||
          (now - this.summaryTimestamp) > SUMMARY_REFRESH_INTERVAL
      ) {
          this.summary = await this.client.readInstallationSummary();
          this.summaryTimestamp = now;
      }
      const records = await this.client.readRealtimeData();
      return new HoymilesModel(records);
  }

  registerFlowCards() {
    // 1. Trigger: Vermogen komt boven waarde
    this.powerExceedsTrigger = this.homey.flow.getDeviceTriggerCard('power_exceeds');
    this.powerExceedsTrigger.registerRunListener(async (args, state) => {
      return state.power >= args.limit;
    });

    // 2. Conditie: Vermogen is groter dan...
    this.homey.flow.getConditionCard('power_greater_than')
      .registerRunListener(async (args) => {
        const currentPower = this.getCapabilityValue('measure_power') || 0;
        return currentPower > args.limit;
      });

    // 3. Conditie: Temperatuur is hoger dan...
    this.homey.flow.getConditionCard('temperature_higher_than')
      .registerRunListener(async (args) => {
        if (!this.summary) return false;
        const summary = this.summary.getSummary();
        return summary.temperature > args.limit;
      });

    // 4. Actie: Vermogenslimiet instellen (Dan...)
    this.homey.flow.getActionCard('set_power_limit')
      .registerRunListener(async (args) => {
        const percentage = args.percentage; // Bijv. 50 (%)
        this.log(`Actie ontvangen: Vermogenslimiet instellen op ${percentage}%`);
        
        try {
          // Roep de schrijf-functie aan op de client
          await this.client.setPowerLimit(percentage);
          return true;
        } catch (err) {
          this.error('Kon vermogenslimiet niet instellen:', err);
          throw new Error('Instellen vermogenslimiet mislukt: ' + err.message);
        }
      });
  } 
};
