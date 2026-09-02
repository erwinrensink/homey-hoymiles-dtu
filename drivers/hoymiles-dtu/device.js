'use strict';

const Homey = require('homey');
const HoymilesClient = require('../../lib/hoymiles/client');
const HoymilesModel = require('../../lib/hoymiles/model');
const DEFAULT_POLL_INTERVAL = 60000;
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
  //async onAdded() {
  //  this.log('Device added');
  //  await this.setSettings({
  //    ip: '192.168.2.73',
  //    port: 502,
  //    unitId: 1,
  //  });
  //}

  /**
   * onSettings is called when the user updates the device's settings.
   * @param {object} event the onSettings event data
   * @param {object} event.oldSettings The old settings object
   * @param {object} event.newSettings The new settings object
   * @param {string[]} event.changedKeys An array of keys changed since the previous version
   * @returns {Promise<string|void>} return a custom message that will be displayed
   */

onSettings({ oldSettings, newSettings, changedKeys }) {
    this.log('Settings ontvangen, direct doorgeven...');
    
    // We starten direct een achtergrond-taak en geven de besturing meteen terug aan Homey.
    // Hierdoor is het opslaan in de Homey UI 100% onmiddellijk klaar (geen time-out mogelijk).
    this.homey.setTimeout(async () => {
      try {
        this.stopPolling();
        
        if (this.client) {
          try {
            if (typeof this.client.disconnect === 'function') await this.client.disconnect();
            else if (typeof this.client.close === 'function') this.client.close();
          } catch (e) {}
        }

        const settings = this.getSettings();
        this.client = new HoymilesClient(
          settings.ip,
          Number(settings.port),
          Number(settings.unitId)
        );

        await this.client.connect();
        this.log('Verbonden met nieuw IP:', settings.ip);
        
        this.registerFlowCards();
        await this.updateValues();
        await this.setAvailable();
        this.startPolling();
      } catch (err) {
        this.error('Fout bij toepassen nieuwe instellingen op achtergrond:', err);
        await this.setUnavailable(`Verbindingsfout: ${err.message}`);
      }
    }, 10);

    // Retourneer direct niets (void), zodat Homey de UI onmiddellijk opslaat
    return Promise.resolve();
  }

  async initializeAndPoll() {
    const settings = this.getSettings();
    this.client = new HoymilesClient(
      settings.ip,
      Number(settings.port),
      Number(settings.unitId)
    );

    try {
      await this.client.connect();
      this.log('Succesvol verbonden met nieuwe instellingen:', settings.ip);
      
      this.registerFlowCards();
      await this.updateValues();
      
      if (!this.getAvailable()) {
          await this.setAvailable();
      }
      this.startPolling();
    } catch (err) {
      this.error('Achtergrond verbinding mislukt:', err);
      await this.setUnavailable(`Verbindingsfout: ${err.message}`);
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
        try {
          if (typeof this.client.disconnect === 'function') {
            await this.client.disconnect();
          } else if (typeof this.client.close === 'function') {
            await this.client.close();
          }
        } catch (err) {
          this.error('Fout bij sluiten client bij verwijderen:', err);
        }
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
    const summary = model.getSummary();
    
    // 1. Update actueel vermogen (measure_power in Watt)
    if (this.hasCapability('measure_power')) {
      const currentPower = summary.power;
      if (this.getCapabilityValue('measure_power') !== currentPower) {
        await this.setCapabilityValue('measure_power', currentPower);
      }

      // 2. Bereken zelf de energieopbrengst in kWh als de DTU 0 geeft
      const now = Date.now();
      if (this.lastPollTime) {
        const hoursPassed = (now - this.lastPollTime) / 3600000; // Milliseconden naar uren
        const generatedKWh = (currentPower * hoursPassed) / 1000; // Wattuur naar kWh
        
        let totalEnergy = (this.getCapabilityValue('meter_power') || 0) + generatedKWh;
        
        // Optioneel: reset 's nachts of houd het bij. Hier tellen we het cumulatief op.
        await this.setCapabilityValue('meter_power', Number(totalEnergy.toFixed(3)));
      }
      this.lastPollTime = now;
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
