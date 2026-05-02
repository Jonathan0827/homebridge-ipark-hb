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
        let lights = [];
        try {
            lights = await this.lightulb.discoverDevices();
        } catch (e) {
            this.log.error("Discovery failed", e.message);
            return;
        }

        const validUUIDs = lights.map((l) => this.api.hap.uuid.generate(l.id));

        lights.forEach((light) => {
            const uuid = this.api.hap.uuid.generate(light.id);

            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(light.name, uuid);
                acc.context = light;

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
            } else {
                acc.context = light;
            }

            if (!acc._lightbulbInstance) {
                acc._lightbulbInstance = new Lightbulb(this, acc);
            }
        });
    }
}
