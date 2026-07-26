'use strict';

class HoymilesInverter {

  constructor(id) {

    this.id = id;
    this.inputs = [];

  }

  addInput(input) {

    this.inputs.push(input);

  }

  getPower() {

    return this.inputs.reduce(
      (total, input) => total + input.power,
      0
    );

  }

  getAverageVoltage() {

    if (this.inputs.length === 0) return 0;

    return this.inputs.reduce(
      (total, input) => total + input.voltage,
      0
    ) / this.inputs.length;

  }

  getAverageFrequency() {

    if (this.inputs.length === 0) return 0;

    return this.inputs.reduce(
      (total, input) => total + input.frequency,
      0
    ) / this.inputs.length;

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

toJSON() {
  return {
    id: this.id,
    power: this.getPower(),
    averageVoltage: this.getAverageVoltage(),
    averageFrequency: this.getAverageFrequency(),
    activeInputs: this.getActiveInputs().length,
    inputs: this.inputs.map(input => input.toJSON()),
  };
}

}

module.exports = HoymilesInverter;