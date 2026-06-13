const axios = require("axios");

class Lightbulb {
    constructor(platform, acc) {
        this.platform = platform;
        this.acc = acc;

        const Service = platform.api.hap.Service;
        const Characteristic = platform.api.hap.Characteristic;

        const service =
            acc.getService(Service.Lightbulb) ||
            acc.addService(Service.Lightbulb);

        service
            .getCharacteristic(Characteristic.On)
            .onGet(this.onGet.bind(this))
            .onSet(this.onSet.bind(this));
    }

    static async discoverDevices(platform) {
        const token = await platform.getAccessToken();
        if (!token) return [];

        const http = platform.http(token);
        let allLights = [];

        // living room
        try {
            const res = await http.get(`/livinglight/1/apply`);
            if (res.data?.result !== "fail") {
                const units = res.data.units || [];
                for (const u of units) {
                    allLights.push({
                        id: `living-1-${u.unit}`,
                        type: "livinglight",
                        room: 1,
                        unit: u.unit,
                        name: u.name || `Living ${u.unit}`,
                    });
                }
            }
        } catch (e) {
            platform.log.error("Living room discovery failed", e.message);
        }

        // other rooms
        let i = 1;
        while (true) {
            try {
                const res = await http.get(`/light/${i}/apply`);
                if (res.data?.result !== "ok") break;

                const units = res.data.units || [];
                for (const u of units) {
                    allLights.push({
                        id: `room-${i}-${u.unit}`,
                        type: "light",
                        room: i,
                        unit: u.unit,
                        name: u.name || `Room ${i} ${u.unit}`,
                    });
                }

                i++;
            } catch (e) {
                platform.log.error(`Room ${i} discovery failed`, e.message);
                break;
            }
        }

        return allLights;
    }

    async onGet() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const path =
            acc.context.type === "livinglight"
                ? `/livinglight/${acc.context.room}/apply`
                : `/light/${acc.context.room}/apply`;

        const res = await platform.http(platform.token).get(path);
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );

        return device?.state === "on";
    }

    async onSet(value) {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const path =
            acc.context.type === "livinglight"
                ? `/livinglight/${acc.context.room}/apply`
                : `/light/${acc.context.room}/apply`;

        await platform.http(platform.token).put(path, {
            unit: acc.context.unit,
            state: value ? "on" : "off",
        });
    }
}

module.exports = Lightbulb;
