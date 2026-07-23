'use strict';

const ModbusRTU = require('modbus-serial');
const Parser = require('./parser');

class HoymilesClient {

  constructor(host, port = 502, unitId = 1) {

    this.host = host;
    this.port = port;
    this.unitId = unitId;

    this.client = new ModbusRTU();

    this.parser = new Parser();   // <-- deze regel moet aanwezig zijn
  }

  async connect() {

    console.log(`Connecting to ${this.host}:${this.port} (Unit ID ${this.unitId})`);

    await this.client.connectTCP(this.host, {
      port: this.port,
    });

    this.client.setID(this.unitId);
    this.client.setTimeout(5000);

    console.log('Modbus connected');
  }

  async readHoldingRegisters(address, length) {
    return this.client.readHoldingRegisters(address, length);
  }

//  async readRealtimeData() {
//    const power = await this.readHoldingRegisters(REGISTERS.PV_POWER, 1);
//    const today = await this.readHoldingRegisters(REGISTERS.TODAY_PRODUCTION, 2);
//    const total = await this.readHoldingRegisters(REGISTERS.TOTAL_PRODUCTION, 2);
//    const temperature = await this.readHoldingRegisters(REGISTERS.TEMPERATURE, 1);

//    console.log('POWER RAW', power);
//    console.log('TODAY RAW', today);
//    console.log('TOTAL RAW', total);
//    console.log('TEMP RAW', temperature);

//    return {
//    power: Parser.power(power),
//    today: Parser.energy(today),
//    total: Parser.energy(total),
//    temperature: Parser.temperature(temperature),
//    };
//  }

  async readRealtimeData() {
    // Lees het volledige registerblok van de eerste micro-omvormer
    const result = await this.readHoldingRegisters(0x1000, 40);
    // Zet de registers om naar een object
    const inverter = this.parser.parse(result.data);
    this.log?.('Parsed inverter:', inverter);
    console.log('Parsed inverter:', inverter);
    return inverter;
  }

  async scanMicroinverters(max = 8) {
    for (let i = 0; i < max; i++) {
        const base = 0x1000 + (i * 0x28);
        try {
        console.log(`\n=== Microinverter ${i + 1} @ 0x${base.toString(16)} ===`);
        const values = [];
        for (let r = 0; r < 40; r++) {
            const reg = await this.readHoldingRegisters(base + r, 1);
            values.push(reg.data[0]);
        }
        console.log(values);
        } catch (err) {
        console.log(`Geen inverter op blok ${i + 1}`);
        }
    }
}

  async readInputRegisters(address, length) {
    return this.client.readInputRegisters(address, length);
  }

  async disconnect() {
    if (this.client.isOpen) {
      this.client.close();
    }
  }

  async dumpRegisters(start, count) {
    const result = await this.client.readHoldingRegisters(start, count);
    for (let i = 0; i < result.data.length; i++) {
        console.log(
        `0x${(start + i).toString(16).toUpperCase()} = ${result.data[i]}`
        );
    }
  }

}

module.exports = HoymilesClient;