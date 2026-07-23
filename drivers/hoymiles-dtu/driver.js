'use strict';

const Homey = require('homey');

module.exports = class HoymilesDTUDriver extends Homey.Driver {

  async onInit() {
    this.log('Hoymiles DTU Driver initialized');
  }

  async onPair(session) {

    this.log('Pair session started');

    session.setHandler('list_devices', async () => {

      this.log('list_devices called');

      return [{
        name: 'Hoymiles DTU',
        data: {
          id: 'hoymiles-dtu',
        },
      }];

    });

  }

};