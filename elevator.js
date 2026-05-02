const axios = require("axios");

class Elevator {
    constructor(platform, acc) {
        this.platform = platform;
        this.acc = acc;

        const Service = platform.api.hap.Service;
        const Characteristic = platform.api.hap.Characteristic;

        const service =
            acc.getService(Service.Button) || acc.addService(Service.Button);

        service
            .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
            .onGet(this.getCurrentState.bind(this))
            .onSet(this.setTargetState.bind(this));
    }
    static discoverDevices(platform) {
        return [
            {
                id: "elevator-up",
                type: "button",
                unit: "up",
                name: "Elevator Up",
            },
            {
                id: "elevator-down",
                type: "button",
                unit: "down",
                name: "Elevator Down",
            },
        ];
    }
    async getCurrentState() {
        return false;
    }
    async setTargetState(value) {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await platform
            .http(platform.token)
            .post(`/elevator/${acc.context.unit}`, acc.context.unit);
    }
}

module.exports = Elevator;
