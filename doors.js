const axios = require("axios");

class Doors {
    constructor(platform, acc) {
        this.platform = platform;
        this.acc = acc;

        const Service = platform.api.hap.Service;
        const Characteristic = platform.api.hap.Characteristic;

        const service =
            acc.getService(Service.GarageDoorOpener) ||
            acc.addService(Service.GarageDoorOpener);

        service.getCharacteristic(Characteristic.CurrentDoorState).onGet(0);
        service.getCharacteristic(Characteristic.ObstructionDetected).onGet(0);
        service
            .getCharacteristic(Characteristic.TargetDoorState)
            .onGet(0)
            .onSet(this.open.bind(this));
    }

    static async discoverDevices(platform) {
        platform.token = await platform.getAccessToken();
        try {
            const res = await axios.get(
                "https://idj1.hdc-smart.com/v2/api/onepass/doors",
                {
                    headers: {
                        "access-token": platform.token,
                    },
                },
            );
            const doors = res.data.doors || [];
            let doorList = [];
            for (const d of doors) {
                doorList.push({
                    id: `door-${d.id}`,
                    type: "garagedoor",
                    unit: d.id,
                    name: d.lobby_name,
                });
            }
            return doorList;
        } catch (e) {
            platform.log.error("Door discovery failed", e.message);
        }
    }

    async open() {
        const { platform, acc } = this;

        platform.token = await platform.getAccessToken();

        const res = await axios.post(
            `https://idj1.hdc-smart.com/v2/api/onepass/doors/${acc.context.unit}/apply`,
            {
                appname: "스마트홈2.0",
                alias: "",
            },
            {
                headers: {
                    "access-token": platform.token,
                },
            },
        );
    }
}

module.exports = Doors;
