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
        this.token = null;
        this.http = (accessToken) =>
            axios.create({
                baseURL: "https://idj1.hdc-smart.com/v2/api/features",
                timeout: 5000,
                headers: {
                    "access-token": accessToken,
                    "Content-Type": "application/json",
                },
            });

        api.on("didFinishLaunching", () => this.discoverDevices());
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
                    headers: {
                        Authorization: this.config.auth,
                        "X-API-KEY": this.config.apiKey,
                    },
                },
            );

            return res.data["access-token"];
        } catch (e) {
            this.log.error("Authentication failed", e.message);
            return null;
        }
    }
    async discoverDevices() {
        if (!this.token) {
            this.token = await this.getAccessToken();
        }
        let allLights = [];
        // living room
        try {
            const res = await this.http(this.token).get(`/livinglight/1/apply`);

            if (res.data.result !== "fail") {
                const roomName = res.data.map?.name || "Living Room";
                const units = res.data.units || [];

                for (const u of units) {
                    allLights.push({
                        id: `living-1-${u.unit}`,
                        type: "livinglight",
                        room: 1,
                        unit: u.unit,
                        name: u.name || `${roomName} ${u.unit}`,
                    });
                }

                this.log.info(`Living room: ${units.length} devices`);
            }
        } catch (e) {
            this.log.error("Living room discovery failed", e.message);
        }

        // other rooms
        let j = 1;
        while (true) {
            try {
                const res = await this.http(this.token).get(
                    `/light/${j}/apply`,
                );
                if (res.data.result !== "ok") break;

                const roomName = res.data.map?.name || `Room ${j}`;
                const units = res.data.units || [];

                for (const u of units) {
                    allLights.push({
                        id: `room-${j}-${u.unit}`,
                        type: "light",
                        room: j,
                        unit: u.unit,
                        name: u.name || `${roomName} ${u.unit}`,
                    });
                }

                this.log.info(`Room ${j}: ${units.length} devices`);
                j++;
            } catch (e) {
                this.log.error(`Room ${j} discovery failed`, e.message);
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
                this.log.info(`Added ${light.name}`);
            } else {
                acc.context = light;
                this.setupAccessory(acc);
            }
        }
        const validUUIDs = allLights.map((l) =>
            this.api.hap.uuid.generate(l.id),
        );

        // const toRemove = this.accessories.filter(
        //     (acc) => !validUUIDs.includes(acc.UUID),
        // );

        // if (toRemove.length) {
        //     this.api.unregisterPlatformAccessories(
        //         "ipark-hb",
        //         "IPARKHB",
        //         toRemove,
        //     );

        //     this.log.info(`Removed ${toRemove.length} stale accessories`);
        // }
    }

    setupAccessory(acc) {
        let service = acc.getService(Service.Lightbulb);
        if (!service) {
            service = acc.addService(Service.Lightbulb);
        }

        acc.service = service;

        service
            .getCharacteristic(Characteristic.On)
            .onGet(async () => {
                if (!this.token) {
                    this.token = await this.getAccessToken();
                }
                const path =
                    acc.context.type === "livinglight"
                        ? `/livinglight/${acc.context.room}/apply`
                        : `/light/${acc.context.room}/apply`;

                const res = await this.http(this.token).get(path);
                if (!res.data || !res.data.units) return false;

                const device = res.data.units.find(
                    (u) => u.unit === acc.context.unit,
                );
                return device?.state === "on";
            })
            .onSet(async (value) => {
                if (!this.token) {
                    this.token = await this.getAccessToken();
                }
                const path =
                    acc.context.type === "livinglight"
                        ? `/livinglight/${acc.context.room}/apply`
                        : `/light/${acc.context.room}/apply`;

                await this.http(this.token).put(path, {
                    unit: acc.context.unit,
                    state: value ? "on" : "off",
                });
            });
    }
}
