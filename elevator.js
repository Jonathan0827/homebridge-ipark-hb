const axios = require("axios");
const https = require("https");
const httpsAgent = new https.Agent({ rejectUnauthorized: false });
class Elevator {
    constructor(platform, acc) {
        this.platform = platform;
        this.acc = acc;

        const Service = platform.api.hap.Service;
        const Characteristic = platform.api.hap.Characteristic;

        const service =
            acc.getService(Service.Switch) || acc.addService(Service.Switch);

        service
            .getCharacteristic(Characteristic.On)
            .onGet(this.getCurrentState.bind(this))
            .onSet(this.setTargetState.bind(this));
    }
    static discoverDevices(platform) {
        return [
            // {
            //     id: "elevator",
            //     type: "button",
            //     unit: "up",
            //     name: "Elevator Up",
            // },
            {
                id: "elevator",
                type: "button",
                unit: "down",
                name: "Call Elevator",
            },
        ];
    }
    async getCurrentState() {
        return false;
    }
    async setTargetState(value) {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await axios.post(
            "https://idj1.hdc-smart.com/v2/api/elevator/down",
            "down",
            {
                httpsAgent,
                headers: {
                    "access-token": platform.token,
                    "User-Agent":
                        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148",
                },
            },
        );
    }
}

module.exports = Elevator;
