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
        return 0;
    }

    async getTargetState() {
        return 0;
    }

    async setTargetState(value) {
        return;
    }

    async getCurrentTemperature() {
        return 20;
    }

    async getTargetTemperature() {
        return 22;
    }

    async setTargetTemperature(value) {
        return;
    }
}

module.exports = Thermostat;
