# Homey Hoymiles DTU

A professional Homey Pro app to locally monitor and control your Hoymiles DTU (Data Transfer Unit) via Modbus TCP. Fast, secure, and 100% local without cloud dependencies.

## Features

- **Local Modbus TCP Communication:** Direct, real-time polling of your Hoymiles DTU over your local network.
- **Comprehensive Monitoring:** Track live power generation (`measure_power`), total energy yield (`meter_power`), and system/DTU temperature.
- **Homey Energy Integration:** Seamlessly integrates with Homey's native Energy tab to visualize your solar production.
- **Advanced Flow Support:**
  - **Triggers:** Trigger flows when power generation exceeds a specific limit.
  - **Conditions:** Check if current power generation or system temperature is above a threshold.
  - **Actions:** Remotely adjust the active power limit (%) of your entire solar installation dynamically using register `0xC001` (Curtailment / Power Throttling).

## Roadmap

- [x] Local Modbus TCP connection & data parsing
- [x] Homey Energy integration
- [x] Custom Flow Cards (Triggers & Conditions)
- [x] Active power limit control (Curtailment via register `0xC001`)
- [ ] Extended firmware testing & telemetry optimization
- [ ] Official Homey App Store publication