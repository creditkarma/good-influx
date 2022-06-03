'use strict';

const Dgram = require('dgram');
const Stream = require('stream');
const Os = require('os');
const Url = require('url');

const Hoek = require('@hapi/hoek');
const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        threshold: 20,
        schema: 'good-influx',
        udpType: 'udp4',
        host: Os.hostname(),
        metadata: false
    }
};

class GoodInfluxUdp extends Stream.Writable {
    constructor(endpoint, config, schemas) {
        super({ objectMode: true, decodeStrings: false });

        // Limit threshold for UDP protocol to avoid transmission errors
        if (isNaN(config.threshold) || config.threshold > 5) {
            config.threshold = 5;
        }

        config = config || {};
        const settings = Object.assign({}, internals.defaults, config);

        this._settings = settings;
        this._endpoint = Url.parse(endpoint);
        this._data = [];
        this._udpClient = Dgram.createSocket(settings.udpType);

        // Standard users
        this.once('finish', () => {

            this._sendMessages();
        });
        this.config = Hoek.applyToDefaults(internals.defaults, config);
        this.schemas = schemas;
    }

    _write(data, encoding, callback) {

        this._data.push(data);
        if (this._data.length >= this._settings.threshold) {
            this._sendMessages((err) => {

                // always clear the data so we don't buffer this forever if there is ever a failed POST
                this._data = [];
                return callback(err);
            });
        }
        else {
            setImmediate(callback);
        }
    }

    _sendMessages(callback) {
        let lineData = [];
        this._data.forEach((event) => {
            const lines = LineProtocol.format(event, this.config, this.schemas);
            lineData = lineData.concat(lines);
        });

        const payload = Buffer.from(lineData.join('\n'));

        // Prevent this from user tampering
        this._udpClient.send(payload, 0, payload.length, this._endpoint.port, this._endpoint.hostname, callback);
    }
}

module.exports = GoodInfluxUdp;
