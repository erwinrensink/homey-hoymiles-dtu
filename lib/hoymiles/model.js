'use strict';

class HoymilesPanel {
  constructor(record) {
    Object.assign(this, record);
  }

  getPower() { return this.power || 0; }
  getTodayEnergy() { return this.todayEnergy || 0; }
  getTotalEnergy() { return this.totalEnergy || 0; }
  getTemperature() { return this.temperature || 25; }
  getOperatingStatus() { return this.operatingStatusText || 'Normaal'; }
  getAlarmCode() { return this.alarmCode || 0; }
}

class HoymilesInverter {
  constructor(id, records) {
    this.id = id;
    this.records = records || [];
    this.activeStrings = this.records.length;    
    this.inputs = this.records.map(r => new HoymilesPanel(r));
  }

  getId() { return this.id; }
  
  getPower() {
    return this.inputs.reduce((sum, r) => sum + r.getPower(), 0);
  }

  getTodayEnergy() {
    return this.inputs.reduce((sum, r) => sum + r.getTodayEnergy(), 0);
  }

  getTotalEnergy() {
    return this.inputs.reduce((sum, r) => sum + r.getTotalEnergy(), 0);
  }

  getVoltage() {
    return this.records[0]?.voltage || 230;
  }

  getAverageVoltage() {
    if (!this.inputs.length) return 230;
    const sum = this.inputs.reduce((acc, r) => acc + (r.voltage || 0), 0);
    return sum / this.inputs.length;
  }

  getFrequency() {
    return this.records[0]?.frequency || 50;
  }

  getTemperature() {
    return Math.max(...this.inputs.map(r => r.getTemperature()));
  }

  getAverageTemperature() {
    return this.getTemperature();
  }

  getPanels() {
    return this.inputs;
  }

  getStrings() {
    return this.inputs;
  }

  getInputs() {
    return this.inputs;
  }

  getChannels() {
    return this.inputs;
  }

  getActiveStrings() {
    return this.inputs;
  }

  getActiveInputs() {
    return this.getActiveStrings();
  }

  getActiveStringsCount() {
    return this.inputs.length;
  }

  getHighestInput() {
    if (!this.inputs.length) return null;
    return [...this.inputs].sort((a, b) => b.getPower() - a.getPower())[0];
  }

  getLowestInput() {
    if (!this.inputs.length) return null;
    return [...this.inputs].sort((a, b) => a.getPower() - b.getPower())[0];
  }

  getAveragePVVoltage() {
    if (!this.inputs.length) return 0;
    const sum = this.inputs.reduce((acc, r) => acc + (r.pvVoltage || 0), 0);
    return sum / this.inputs.length;
  }

  getAveragePVCurrent() {
    if (!this.inputs.length) return 0;
    const sum = this.inputs.reduce((acc, r) => acc + (r.pvCurrent || 0), 0);
    return sum / this.inputs.length;
  }

  toJSON() {
    return {
      id: this.id,
      power: this.getPower(),
      today: Number(this.getTodayEnergy().toFixed(3)),
      total: Number(this.getTotalEnergy().toFixed(2)),
      voltage: this.getVoltage(),
      frequency: this.getFrequency(),
      temperature: this.getTemperature(),
      panels: this.getPanels()
    };
  }
}

class HoymilesModel {
  constructor(records = []) {
    this.records = records || [];
  }

  getInverters() {
    const invertersMap = new Map();
    
    for (const record of this.records) {
      if (!record.id) continue;
      if (!invertersMap.has(record.id)) {
        invertersMap.set(record.id, []);
      }
      invertersMap.get(record.id).push(record);
    }
    
    return Array.from(invertersMap.entries()).map(([id, recs]) => new HoymilesInverter(id, recs));
  }

  getSummary() {
    const inverters = this.getInverters();
    const totalPower = inverters.reduce((sum, inv) => sum + inv.getPower(), 0);
    const totalToday = inverters.reduce((sum, inv) => sum + inv.getTodayEnergy(), 0);
    const totalTotal = inverters.reduce((sum, inv) => sum + inv.getTotalEnergy(), 0);
    
    const avgVoltage = inverters.length > 0 
      ? inverters.reduce((sum, inv) => sum + inv.getVoltage(), 0) / inverters.length 
      : 230;
      
    const avgFreq = inverters.length > 0 
      ? inverters.reduce((sum, inv) => sum + inv.getFrequency(), 0) / inverters.length 
      : 50;
      
    const maxTemp = inverters.length > 0 
      ? Math.max(...inverters.map(inv => inv.getTemperature())) 
      : 25;

    return {
      power: Number(totalPower.toFixed(1)),
      today: Number(totalToday.toFixed(3)),
      total: Number(totalTotal.toFixed(2)),
      voltage: Number(avgVoltage.toFixed(1)),
      frequency: Number(avgFreq.toFixed(2)),
      temperature: Number(maxTemp.toFixed(1)),
      activeInverters: Math.max(inverters.length, 4),
      totalInverters: 4,
      activeInputs: this.records.length,
      totalPanels: 24,
    };
  }

    getCapabilities() {
        const summary = this.getSummary();
        return {
        measure_power: summary.power
        // meter_power wordt door Homey zelf opgebouwd o.b.v. measure_power en de energy-configuratie in driver.compose.json
        };
    }

  toJSON() {
    const summary = this.getSummary();
    const inverters = this.getInverters().map(inv => inv.toJSON());
    return {
      totalPower: summary.power,
      totalToday: summary.today,
      totalEnergy: summary.total,
      totalVoltage: summary.voltage,
      inverterCount: inverters.length,
      inverters: inverters
    };
  }
}

module.exports = HoymilesModel;