'use strict';

class HoymilesInput {

constructor(record) {

  // Bestaande velden
  this.id = record.id;
  this.port = record.port;

  this.power = record.power;
  this.voltage = record.voltage;
  this.frequency = record.frequency;

  // Nieuwe velden
  this.serialNumber = record.serialNumber;

  this.pvVoltage = record.pvVoltage;
  this.pvCurrent = record.pvCurrent;

  this.todayEnergy = record.todayEnergy;
  this.totalEnergy = record.totalEnergy;

  this.temperature = record.temperature;
  this.operatingStatus = record.operatingStatus;
  this.alarmCode = record.alarmCode;
  this.linkStatus = record.linkStatus;

  this.raw = record.raw;
}

getVoltage() {
  return this.voltage;
}

getFrequency() {
  return this.frequency;
}

getPower() {
  return this.power;
}

getPvVoltage() {
  return this.pvVoltage;
}

getPvCurrent() {
  return this.pvCurrent;
}

getTodayEnergy() {
  return this.todayEnergy;
}

getTotalEnergy() {
  return this.totalEnergy;
}

getTemperature() {
  return this.temperature;
}

getOperatingStatus() {
  return this.operatingStatus;
}

getAlarmCode() {
  return this.alarmCode;
}

getLinkStatus() {
  return this.linkStatus;
}

getSerialNumber() {
  return this.serialNumber;
}

isProducing() {
  return this.power > 5;
}

toJSON() {
  return {
    id: this.id,
    port: this.port,

    power: this.getPower(),

    voltage: this.getVoltage(),
    frequency: this.getFrequency(),

    pvVoltage: this.getPvVoltage(),
    pvCurrent: this.getPvCurrent(),

    todayEnergy: this.getTodayEnergy(),
    totalEnergy: this.getTotalEnergy(),

    temperature: this.getTemperature(),
    operatingStatus: this.getOperatingStatus(),
    alarmCode: this.getAlarmCode(),
    linkStatus: this.getLinkStatus(),

    serialNumber: this.getSerialNumber(),

    producing: this.isProducing(),
  };
}

}

module.exports = HoymilesInput;