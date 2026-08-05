'use strict';

const RECORD_SIZE = 40;
const IDX_PV_VOLTAGE  = 4;
const IDX_PV_CURRENT  = 5;
const IDX_GRID_VOLT   = 6;  
const IDX_FREQUENCY   = 7;  
const IDX_POWER       = 8;  
const IDX_TODAY_ENERGY = 18;
const IDX_TEMP        = 24; 

class HoymilesParser {

    readUInt16(data, index) { 
        return data[index] || 0; 
    }
    
    readInt16(data, index) {
        let val = data[index] || 0;
        return val > 32767 ? val - 65536 : val;
    }

    parseRecord(raw, sourceBlock, offset, index) {
        const rawTemp = this.readInt16(raw, IDX_TEMP);
        let temp = rawTemp / 10;
        
        if (temp < -40 || temp > 130) {
            temp = 25.0; 
        }

        const rawToday = this.readUInt16(raw, IDX_TODAY_ENERGY);

        return {
            sourceBlock,
            startRegister: sourceBlock + offset,
            index,

            pvVoltage: this.readUInt16(raw, IDX_PV_VOLTAGE) / 10,
            pvCurrent: this.readUInt16(raw, IDX_PV_CURRENT) / 100,

            voltage: this.readUInt16(raw, IDX_GRID_VOLT) / 10,
            frequency: this.readUInt16(raw, IDX_FREQUENCY) / 100,
            power: this.readUInt16(raw, IDX_POWER) / 10,

            todayEnergy: Number((rawToday * 0.1).toFixed(3)),
            totalEnergy: 0, // Homey / meter houdt de lifetime totaalstand keurig bij

            temperature: Number(temp.toFixed(1)),

            operatingStatusText: 'Normaal',
            alarmCode: 0,
            linkStatus: 1,
        };
    }

    parse(registers, sourceBlock = 0x1000) {
        const records = [];
        for (let offset = 0; offset + RECORD_SIZE <= registers.length; offset += RECORD_SIZE) {
            const raw = registers.slice(offset, offset + RECORD_SIZE);
            const record = this.parseRecord(raw, sourceBlock, offset, records.length);
            if (record) records.push(record);
        }
        return records;
    }
}

module.exports = HoymilesParser;