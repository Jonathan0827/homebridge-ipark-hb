let Service, Characteristic;
const Lightbulb = require("./lightbulb");

module.exports = (api) => {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;
    api.registerPlatform("ipark-hb", "IPARKHB", Platform);
};

class Platform {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.accessories = [];
        api.on("didFinishLaunching", async () => {
            await this.initialize();
        });
    }

    configureAccessory(acc) {
        this.accessories.push(acc);
    }

    async initialize() {
        let devices = [];
        try {
            devices = await this.lightulb.discoverDevices();
        } catch (e) {
            this.log.error("Discovery failed", e.message);
            return;
        }

        const validUUIDs = devices.map((d) => this.api.hap.uuid.generate(d.id));

        // const toRemove = this.accessories.filter(
        //     (acc) => !validUUIDs.includes(acc.UUID),
        // );

        // if (toRemove.length) {
        //     this.api.unregisterPlatformAccessories(
        //         "ipark-hb",
        //         "IPARKHB",
        //         toRemove,
        //     );
        // }

        devices.forEach((device) => {
            const uuid = this.api.hap.uuid.generate(device.id);

            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(device.name, uuid);
                acc.context = device;

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
            } else {
                acc.context = device;
            }

            if (!acc._lightbulbInstance) {
                acc._lightbulbInstance = new Lightbulb(this, acc);
            }
        });
    }
}
