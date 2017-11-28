'use strict';

const GoodUdp = require('good-udp');
const Hoek = require('hoek');
const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        metadata: false
    }
};

class GoodInfluxUdp extends GoodUdp {
    constructor(endpoint, config) {
        // Limit threshold for UDP protocol to avoid transmission errors
        if (isNaN(config.threshold) || config.threshold > 5) {
            config.threshold = 5;
        }
        super(endpoint, config);
        this._settings.schema = 'good-influx';
        this.config = Hoek.applyToDefaults(internals.defaults, config);
    }

    _sendMessages(callback) {
        const lineData = this._data
            .map((event) => LineProtocol.format(event, this.config))
            .join('\n');

        const payload = new Buffer(lineData);

        // Prevent this from user tampering
        this._udpClient.send(payload, 0, payload.length, this._endpoint.port, this._endpoint.hostname, callback);
    }
}

module.exports = GoodInfluxUdp;
