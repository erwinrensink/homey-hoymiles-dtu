'use strict';

const HoymilesInverter = require('./inverter');
const HoymilesInput = require('./input');

class HoymilesModel {

  constructor(records) {
    this.records = records || [];
  }

  /**
   * Geeft alleen unieke records terug (eerste record per ID).
   */
  getUniqueRecords() {

    const unique = new Map();

    for (const record of this.records) {

      if (record.id === 0) continue;

      if (!unique.has(record.id)) {
        unique.set(record.id, record);
      }

    }

    return [...unique.values()];
  }

  /**
   * Groepeer records per omvormer.
   */
getInverters() {
  const unique = this.getUniqueRecords();
  const inverters = [];
  const INPUTS_PER_INVERTER = 6;
  for (let i = 0; i < unique.length; i += INPUTS_PER_INVERTER) {
    const inverter = new HoymilesInverter(
      (i / INPUTS_PER_INVERTER) + 1
    );
    for (const record of unique.slice(i, i + INPUTS_PER_INVERTER)) {
      inverter.addInput(
        new HoymilesInput(record)
      );
    }
    inverters.push(inverter);
  }
  return inverters;
}

  /**
   * Totaal AC-vermogen.
   */
  getTotalPower() {

    let total = 0;

    for (const record of this.getUniqueRecords()) {
      total += record.power;
    }

    return total;
  }

/**
 * Geeft alle Homey-capabilities terug.
 */
getCapabilities() {

  const unique = this.getUniqueRecords();

  let voltage = 0;
  let frequency = 0;

  for (const record of unique) {
    voltage += record.voltage;
    frequency += record.frequency;
  }

  if (unique.length > 0) {
    voltage /= unique.length;
    frequency /= unique.length;
  }

  return {
    measure_power: this.getTotalPower(),
    measure_voltage: Number(voltage.toFixed(1)),
    measure_frequency: Number(frequency.toFixed(2)),
  };

}  

getInstallationPower() {
  return this.getTotalPower();
}

getInstallationVoltage() {

  const inverters = this.getInverters();

  if (inverters.length === 0) return 0;

  return inverters.reduce(
    (sum, inverter) => sum + inverter.getAverageVoltage(),
    0
  ) / inverters.length;

}

toJSON() {
  return {
    totalPower: this.getTotalPower(),
    totalVoltage: this.getInstallationVoltage(),
    inverterCount: this.getInverters().length,
    inverters: this.getInverters().map(inv => inv.toJSON()),
  };
}

}

module.exports = HoymilesModel;