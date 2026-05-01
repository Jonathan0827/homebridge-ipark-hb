const axios = require("axios");

let Service, Characteristic;

module.exports = (api) => {
    Service = api.hap.Service;
    Characteristic = api.hap.Characteristic;
    api.registerPlatform("ipark-hb", "IPARKHB", Platform);
};

class Platform {
    constructor(log, config, api) {
        this.log = log;
        this.api = api;
        this.config = config;
        this.accessories = [];

        this.http = axios.create({
            baseURL: "https://idj1.hdc-smart.com/v2/api/features",
            timeout: 5000,
            headers: {
                "access-token": config.token,
                "Content-Type": "application/json",
            },
        });

        api.on("didFinishLaunching", () => this.discoverDevices());
    }

    configureAccessory(acc) {
        this.accessories.push(acc);
    }

    async discoverDevices() {
        let allLights = [];
        let roomIndex = 1;

        while (true) {
            try {
                const res = await this.http.get(`/light/${roomIndex}/apply`);

                if (res.data.result === "fail") break;

                const roomName = res.data.map?.name || `Room ${roomIndex}`;
                const units = res.data.units || [];

                for (const u of units) {
                    allLights.push({
                        id: `${roomIndex}-${u.unit}`,
                        room: roomIndex,
                        unit: u.unit,
                        name: u.name || `${roomName} ${u.unit}`,
                    });
                }

                this.log.info(`Room ${roomIndex}: ${units.length} devices`);
                roomIndex++;
            } catch (e) {
                this.log.error(
                    `Discovery error at room ${roomIndex}`,
                    e.message,
                );
                break;
            }
        }

        for (const light of allLights) {
            const uuid = this.api.hap.uuid.generate(light.id);
            let acc = this.accessories.find((a) => a.UUID === uuid);

            if (!acc) {
                acc = new this.api.platformAccessory(light.name, uuid);
                acc.context = light;

                this.setupAccessory(acc);

                this.api.registerPlatformAccessories("ipark-hb", "IPARKHB", [
                    acc,
                ]);
                this.log.info(`Added accessory: ${light.name}`);
            } else {
                acc.context = light;
                this.setupAccessory(acc);
            }
        }
    }

    setupAccessory(acc) {
        const service =
            acc.getService(Service.Lightbulb) ||
            acc.addService(Service.Lightbulb);

        acc.service = service;

        service
            .getCharacteristic(Characteristic.On)
            .onGet(async () => {
                try {
                    const res = await this.http.get(
                        `/light/${acc.context.room}/apply`,
                    );

                    const device = res.data.units.find(
                        (u) => u.unit === acc.context.unit,
                    );

                    return device?.state === "on";
                } catch (e) {
                    this.log.error(
                        `GET failed for ${acc.displayName}`,
                        e.message,
                    );
                    return false;
                }
            })
            .onSet(async (value) => {
                try {
                    await this.http.put(`/light/${acc.context.room}/apply`, {
                        unit: acc.context.unit,
                        state: value ? "on" : "off",
                    });

                    this.log.info(
                        `SET ${acc.displayName} -> ${value ? "on" : "off"}`,
                    );
                } catch (e) {
                    this.log.error(
                        `SET failed for ${acc.displayName}`,
                        e.message,
                    );
                    throw e;
                }
            });
    }
}
