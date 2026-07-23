'use strict';

class HoymilesParser {

  parse(registers) {

    return {

      serialNumber: this.parseSerial(registers),

      portNumber: registers[3],

      pvVoltage: registers[4],

      pvCurrent: registers[5],

      gridVoltage: registers[6],

      gridFrequency: registers[7],

      power: registers[8],

      todayProduction: registers[9],

      totalProduction: this.uint32(registers[10], registers[11]),

      temperature: registers[12],

      operatingStatus: registers[13],

      alarmCode: registers[14],

      alarmCount: registers[15],

      linkStatus: registers[16]

    };

  }

  parseSerial(registers) {

    return (
      registers[0].toString().padStart(4, '0') +
      registers[1].toString().padStart(4, '0') +
      registers[2].toString().padStart(4, '0')
    );

  }

  uint32(high, low) {

    return (high << 16) + low;

  }

}

module.exports = HoymilesParser;