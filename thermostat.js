const axios = require("axios");

class Thermostat {
    constructor(platform, acc) {
        this.platform = platform;
        this.acc = acc;

        const Service = platform.api.hap.Service;
        const Characteristic = platform.api.hap.Characteristic;

        const service =
            acc.getService(Service.Thermostat) ||
            acc.addService(Service.Thermostat);

        service
            .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .onGet(this.getCurrentState.bind(this));

        service
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .onGet(this.getTargetState.bind(this))
            .onSet(this.setTargetState.bind(this));

        service
            .getCharacteristic(Characteristic.CurrentTemperature)
            .onGet(this.getCurrentTemperature.bind(this));

        service
            .getCharacteristic(Characteristic.TargetTemperature)
            .onGet(this.getTargetTemperature.bind(this))
            .onSet(this.setTargetTemperature.bind(this));
    }

    static async discoverDevices(platform) {
        const token = await platform.getAccessToken();
        if (!token) return [];

        const http = platform.http(token);
        let devices = [];
        const tlistres = await http.get(`/thermostat/1/apply`);
        const tlist = tlistres.data.units || [];
        let i = 1;
        for (const t of tlist) {
            devices.push({
                id: `thermostat-${i}-${t.unit}`,
                type: "thermostat",
                room: i,
                unit: t.unit,
                name: "Thermostat " + (t.name || t.unit),
            });
            i++;
        }

        return devices;
    }

    async getCurrentState() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        if (dl[0] === "off") return 0;
        else return 1;
    }

    async getTargetState() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        if (dl[0] === "off") return 0;
        else return 3;
    }

    async setTargetState(value) {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        const currentTargetTemp = dl[1];
        const targetMode = value === 0 ? "off" : "on";
        await platform.http(platform.token).put("/thermostat/1/apply", {
            unit: acc.context.unit,
            state: `${targetMode}/${currentTargetTemp || "20"}`,
        });
    }

    async getCurrentTemperature() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        return dl[2];
    }

    async getTargetTemperature() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        return dl[1];
    }

    async setTargetTemperature(value) {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .get("/thermostat/1/apply");
        const device = res.data?.units?.find(
            (u) => u.unit === acc.context.unit,
        );
        const ds = device?.state;
        const dl = ds.split("/");
        const currentTargetMode = dl[0];
        await platform.http(platform.token).put("/thermostat/1/apply", {
            unit: acc.context.unit,
            state: `${currentTargetMode}/${value}`,
        });
    }
}

module.exports = Thermostat;
