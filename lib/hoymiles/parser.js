'use strict';

class HoymilesParser {

  parse(registers, sourceBlock = 0x1000) {

    const records = [];
    const RECORD_SIZE = 20;

    for (
      let offset = 0;
      offset + RECORD_SIZE <= registers.length;
      offset += RECORD_SIZE
    ) {

      // Eén volledig record
const raw = registers.slice(offset, offset + RECORD_SIZE);

const record = {

  sourceBlock,
  index: records.length,
  offset,
  startRegister: sourceBlock + offset,

  // Identificatie
  id: raw[3],              // Oude naam (compatibiliteit)
  port: raw[3],            // Nieuwe naam

  serialNumber: [
    raw[0],
    raw[1],
    raw[2]
  ],

  // PV-zijde
  pvVoltage: raw[4] / 10,
  pvCurrent: raw[5] / 100,

  // AC-zijde
  voltage: raw[6] / 10,        // Oude naam
  gridVoltage: raw[6] / 10,    // Nieuwe naam

  frequency: raw[7] / 100,     // Oude naam
  gridFrequency: raw[7] / 100, // Nieuwe naam

  power: raw[8] / 10,

  // Energie (voorlopig nog controleren met de documentatie)
  todayEnergy: (raw[9] << 16) | raw[10],
  totalEnergy: (raw[11] << 16) | raw[12],

  // Status
  temperature: raw[13] / 10,
  operatingStatus: raw[14],
  alarmCode: raw[15],
  linkStatus: raw[16],

  reserved: [
    raw[17],
    raw[18],
    raw[19]
  ],

  raw
};

      if (record.id === 0) {
        continue;
      }

      records.push(record);

    }

    return records;

  }

}

module.exports = HoymilesParser;