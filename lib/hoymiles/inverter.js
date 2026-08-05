'use strict';

class HoymilesInverter {

  constructor(id) {
    this.id = id;
    this.inputs = [];
  }

  addInput(input) {
    this.inputs.push(input);
  }

  getTotal(getter) {
    return this.inputs.reduce(
      (sum, input) => sum + getter(input),
      0
    );
  }

  getPower() {
    return this.getTotal(input => input.getPower());
  }

  getTodayEnergy() {
    return this.getTotal(input => input.getTodayEnergy());
  }

  getTotalEnergy() {
    return this.getTotal(input => input.getTotalEnergy());
  }

  getAverage(getter) {
      // Filter poorten eruit die een waarde van 0 of lager hebben (inactief)
      const activeInputs = this.inputs.filter(input => getter(input) > 0);
      
      if (activeInputs.length === 0) {
        return 0;
      }
      
      return activeInputs.reduce(
        (sum, input) => sum + getter(input),
        0
      ) / activeInputs.length;
    }

  getAverageVoltage() {
    return this.getAverage(input => input.getVoltage());
  }

  getAverageFrequency() {
    return this.getAverage(input => input.getFrequency());
  }

  getAveragePVVoltage() {
    return this.getAverage(input => input.getPvVoltage());
  }

  getAveragePVCurrent() {
    return this.getAverage(input => input.getPvCurrent());
  }

  getAverageTemperature() {
    return this.getAverage(
        input => input.getTemperature()
    );
  }

  getHighestInput() {
    if (this.inputs.length === 0) return null;
    return this.inputs.reduce((highest, input) =>
      input.getPower() > highest.getPower() ? input : highest
    );
  }

  getLowestInput() {
    if (this.inputs.length === 0) return null;
    return this.inputs.reduce((lowest, input) =>
      input.getPower() < lowest.getPower() ? input : lowest
    );
  }

  getActiveInputs() {
    return this.inputs.filter(input => input.isProducing());
  }

  getInput(port) {
      return this.inputs.find(
          input => input.port === port
      );
  }

  getInputCount() {
      return this.inputs.length;
  }

  getSerialNumber() {
      if (!this.inputs.length)
          return '';
      return this.inputs[0].getSerialNumber();
  }

  toJSON() {
      return {
          id: this.id,
          serialNumber: this.getSerialNumber(),
          power: this.getPower(),
          todayEnergy: this.getTodayEnergy(),
          totalEnergy: this.getTotalEnergy(),
          averageVoltage: this.getAverageVoltage(),
          averageFrequency: this.getAverageFrequency(),
          averageTemperature: this.getAverageTemperature(),
          averagePvVoltage: this.getAveragePVVoltage(),
          averagePvCurrent: this.getAveragePVCurrent(),
          inputCount: this.getInputCount(),
          activeInputs: this.getActiveInputs().length,
          inputs: this.inputs.map(
              input => input.toJSON()
          ),
      };
  }

  isProducing() {
      return this.getPower() > 5;
  }

  getAverageActiveInputPower() {
      const active = this.getActiveInputs().length;
      if (active === 0)
          return 0;
      return this.getPower() / active;
  }

  getAverageTemperature() {
      return this.getAverage(
          input => input.getTemperature()
      );
  } 

  hasAlarm() {
    return this.inputs.some(input => input.hasAlarm());
  }

  isOnline() {
      return this.inputs.some(input => input.isOnline());
  }

  //getTotalEnergyWh() {
  //    return this.getUInt32(REG_TOTAL_ENERGY);
  //}

  //getTotalEnergyKWh() {
  //    return this.getTotalEnergyWh() / 1000;
  //}
}

module.exports = HoymilesInverter;