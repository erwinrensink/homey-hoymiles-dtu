'use strict';

class ModbusExplorer {

  constructor(client) {
    this.client = client;
  }

  async scan(startAddress = 0x0000, endAddress = 0x3000, blockSize = 20) {

    console.log('==========================================');
    console.log('        HOYMILES MODBUS EXPLORER');
    console.log('==========================================');

    for (let address = startAddress; address <= endAddress; address += blockSize) {

      try {

        const result = await this.client.readHoldingRegisters(address, blockSize);

        // Alleen blokken tonen waar iets anders staat dan 0
        const hasData = result.data.some(value => value !== 0);

        if (!hasData)
          continue;

        console.log('');
        console.log(
          `Registers 0x${address.toString(16).toUpperCase().padStart(4,'0')} - 0x${(address + blockSize - 1).toString(16).toUpperCase().padStart(4,'0')}`
        );

        result.data.forEach((value, index) => {

          const reg = address + index;

          console.log(
            `0x${reg.toString(16).toUpperCase().padStart(4,'0')} = ${value}`
          );

        });

      } catch (err) {

        console.log(
          `0x${address.toString(16).toUpperCase()} -> ${err.message}`
        );

      }

    }

    console.log('');
    console.log('Explorer finished.');

  }

}

module.exports = ModbusExplorer;