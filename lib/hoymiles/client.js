'use strict';
const ModbusRTU = require('modbus-serial');
const Parser = require('./parser');
const HoymilesModel = require('./model');

class HoymilesClient {
  constructor(host, port = 502, unitId = 1) {
    this.host = host;
    this.port = port;
    this.unitId = unitId;
    this.client = new ModbusRTU();
    this.parser = new Parser();
    
    this.cachedBlocks = null;
    this.lastDiscoveryTime = 0;
    
    // Antwoord-cache om de dubbele aanroep vanuit device.js op te vangen
    this.lastRecords = [];
    this.lastReadTime = 0;
  }

  async connect() {
    if (!this.client.isOpen) {
      await this.client.connectTCP(this.host, { port: this.port });
      this.client.setID(this.unitId);
    }
  }

  async discoverActiveBlocks() {
    const now = Date.now();
    if (this.cachedBlocks && (now - this.lastDiscoveryTime < 10 * 60 * 1000)) {
      return this.cachedBlocks;
    }

    await this.connect();
    this.client.setTimeout(800);

    let baseAddress = null;

    // Scan alleen de eerste paar blokken rustig af om de start te vinden
    for (let addr = 0x1000; addr < 0x1100; addr += 120) {
      try {
        const res = await this.client.readHoldingRegisters(addr, 120);
        if (res && res.data && res.data.some(val => val !== 0)) {
          baseAddress = addr;
          break;
        }
      } catch (err) {
        // Doorgaan bij timeout
      }
      // Ademruimte voor de DTU
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    if (!baseAddress) baseAddress = 0x1000;

    const activeBlocks = [];
    for (let i = 0; i < 8; i++) {
      activeBlocks.push(baseAddress + (i * 0x78));
    }

    this.cachedBlocks = activeBlocks;
    this.lastDiscoveryTime = now;
    return this.cachedBlocks;
  }

  async readRealtimeData() {
    const now = Date.now();
    
    // BEVEILIGING: Als device.js deze functie binnen 3 seconden 2x aanroept, 
    // stuur dan de data uit het geheugen terug om de DTU te ontlasten.
    if (now - this.lastReadTime < 3000 && this.lastRecords.length > 0) {
      return this.lastRecords;
    }

    try {
      await this.connect();
      this.client.setTimeout(1000);

      const blocks = await this.discoverActiveBlocks();
      let allRecords = [];
      
      for (let i = 0; i < blocks.length; i++) {
        const startAddr = blocks[i];
        try {
          const result = await this.client.readHoldingRegisters(startAddr, 120);
          if (result && result.data) {
            const records = this.parser.parse(result.data, startAddr);
            
            const inverterNumber = Math.floor(i / 2) + 1;
            const assignedInverterId = `Inverter_${inverterNumber}`;
            const isSecondBlock = i % 2 === 1;

            records.forEach((r, idx) => {
              r.id = assignedInverterId;
              r.port = (idx + 1) + (isSecondBlock ? 3 : 0);
              allRecords.push(r);
            });
          }
        } catch (blockErr) {
          console.log(`[HoymilesClient] Blok ${i} (0x${startAddr.toString(16)}) time-out. DTU is druk.`);
        }
        
        // BEVEILIGING: Verplichte rust van 100ms tussen Modbus commando's. 
        // Dit voorkomt dat de DTU de verbinding afbreekt.
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      const uniqueMap = new Map();
      for (const rec of allRecords) {
        const key = `${rec.id}_P${rec.port}`;
        uniqueMap.set(key, rec);
      }

      this.lastRecords = Array.from(uniqueMap.values());
      this.lastReadTime = Date.now();

      return this.lastRecords;
    } catch (err) {
      console.log('Modbus verbindingsfout:', err.message);
      return this.lastRecords || [];
    }
  }

  async readInstallationSummary() {
    const records = await this.readRealtimeData();
    return new HoymilesModel(records);
  }

  /**
   * Stelt het maximale actieve vermogen van de installatie in percentages in via register 0xC001 (FC 0x06).
   * @param {number} percentage - Waarde tussen 2 en 100
   */
  async setPowerLimit(percentage) {
    if (!this.client || !this.client.isOpen) {
      throw new Error('Modbus client niet verbonden');
    }

    // Begrens het percentage veilig tussen 2% en 100% (voor HM-serie)
    const limitValue = Math.max(2, Math.min(100, Number(percentage)));

    // Zet de juiste unit ID
    this.client.setID(this.unitId);

    // Register 0xC001 = Active Power Limit (%)
    const registerAddress = 0xC001; 

    try {
      console.log(`[HoymilesClient] Schrijf vermogenslimiet ${limitValue}% naar 0xC001 via writeRegister (FC 0x06)...`);
      
      // Gebruik writeRegister (Functiecode 0x06) zoals in de praktijk is vastgesteld
      await this.client.writeRegister(registerAddress, limitValue);
      
      console.log(`[HoymilesClient] Vermogenslimiet succesvol ingesteld op ${limitValue}%!`);
      return true;
    } catch (err) {
      console.error(`[HoymilesClient] Fout bij schrijven vermogenslimiet naar register 0xC001:`, err);
      throw err;
    }
  }

}

module.exports = HoymilesClient;