const Lightbulb = require("./lightbulb");
const Thermostat = require("./thermostat");
const Elevator = require("./elevator");
const Door = require("./doors");
const axios = require("axios");
const https = require("https");
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

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
        this.http = (token) =>
            axios.create({
                baseURL: "https://idj1.hdc-smart.com/v2/api/features",
                headers: {
                    httpsAgent,
                    "access-token": token,
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                },
            });
        api.on("didFinishLaunching", async () => {
            await this.initialize();
        });
    }

    configureAccessory(acc) {
        this.accessories.push(acc);
    }
    async getAccessToken() {
        try {
            const res = await axios.post(
                "https://center.hdc-smart.com/v3/auth/login",
                "V2",
                {
                    httpsAgent,
                    headers: {
                        Authorization: this.config.auth,
                        "X-API-KEY": this.config.apiKey,
                        "User-Agent":
                            "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                    },
                },
            );

            return res.data["access-token"];
        } catch (e) {
            this.log.error("Authentication failed", e.message);
            return null;
        }
    }
    async initialize() {
        let lights = [];
        try {
            lights = await Lightbulb.discoverDevices(this);
        } catch (e) {
            this.log.error("Light discovery failed", e.message);
            return;
        }

        let thermostats = [];
        try {
            thermostats = await Thermostat.discoverDevices(this);
        } catch (e) {
            this.log.error("Thermostat discovery failed", e.message);
            return;
        }

        let elevators = [];
        try {
            elevators = await Elevator.discoverDevices(this);
        } catch (e) {
            this.log.error("Elevator discovery failed", e.message);
            return;
        }
        let doors = [];
        try {
            doors = await Door.discoverDevices(this);
        } catch (e) {
            this.log.error("Door discovery failed", e.message);
            return;
        }
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

        thermostats.forEach((thermostat) => {
            const uuid = this.api.hap.uuid.generate(thermostat.id);

            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(thermostat.name, uuid);
                acc.context = thermostat;

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
            } else {
                acc.context = thermostat;
            }

            if (!acc._thermostatInstance) {
                acc._thermostatInstance = new Thermostat(this, acc);
            }
        });

        elevators.forEach((elevator) => {
            const uuid = this.api.hap.uuid.generate(elevator.id);

            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(elevator.name, uuid);
                acc.context = elevator;

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
            } else {
                acc.context = elevator;
            }

            if (!acc._elevatorInstance) {
                acc._elevatorInstance = new Elevator(this, acc);
            }
        });
        doors.forEach((door) => {
            const uuid = this.api.hap.uuid.generate(door.id);

            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(door.name, uuid);
                acc.context = door;

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
            } else {
                acc.context = door;
            }

            if (!acc._doorInstance) {
                acc._doorInstance = new Door(this, acc);
            }
        });
    }
}
