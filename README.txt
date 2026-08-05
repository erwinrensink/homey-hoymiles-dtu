Hoymiles DTU
Take your solar energy management to the next level with the Hoymiles DTU app for Homey Pro. This app enables direct, local communication via Modbus TCP, giving you lightning-fast and 100% local (cloud-free) insight into your solar panels and active control over your installation.

Key Features
100% Local via Modbus TCP: No cloud delays or privacy concerns; direct communication with your DTU over your local network.

Comprehensive Monitoring: Track live power generation (measure_power), total energy yield (meter_power), and system temperature in real time.

Homey Energy Integration: Seamlessly integrated with Homey's native Energy tab for a clear overview of your generation within your energy system.

Power Limitation (Curtailment / Throttling): Dynamically control the maximum output power of your installation via register 0xC001. Ideal for negative energy prices, grid congestion, or limiting excessive feed-in.

Advanced Flows Support
Get the most out of your installation with powerful Flow options:

Triggers: Start a Flow when power generation exceeds a specific limit.

Conditions: Check if current power generation or system temperature is above a set threshold.

Actions: Directly adjust the maximum power limit percentage (from 5% to 100%), perfectly combinable with dynamic energy prices (such as Tibber or ANWB Energie) or your own HEMS automations.

Requirements
A Hoymiles DTU (with Modbus TCP support enabled) connected to your local network.