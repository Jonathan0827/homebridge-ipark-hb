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
            headers: { "access-token": `${config.token}` },
        });

        api.on("didFinishLaunching", () => this.init());
    }

    configureAccessory(acc) {
        this.accessories.push(acc);
    }
    setup(acc) {
        const svc =
            acc.getService(Service.Lightbulb) ||
            acc.addService(Service.Lightbulb);

        svc.getCharacteristic(Characteristic.On)
            .onGet(async () => {
                const res = await this.http.get(
                    `/light/${acc.context.room}/apply`,
                );

                const device = res.data.units.find(
                    (u) => u.unit === acc.context.unit,
                );

                return device?.state === "on";
            })
            .onSet(async (value) => {
                await this.http.put(`/light/${acc.context.room}/apply`, {
                    unit: acc.context.unit,
                    state: value ? "on" : "off",
                });
            });
    }
}
