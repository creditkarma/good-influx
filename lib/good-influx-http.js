'use strict';

const Hoek = require('@hapi/hoek');
const Stream = require('stream');
const Wreck = require('@hapi/wreck');
const Os = require('os');
const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        threshold: 20,
        errorThreshold: 0,
        schema: 'good-influx',
        wreck: {
            timeout: 60000,
            headers: {}
        },
        host: Os.hostname(),
        metadata: false
    }
};

class GoodInfluxHttp extends Stream.Writable {
    constructor(endpoint, config, schemas) {
        super({ objectMode: true, decodeStrings: false });
        config = config || {};
        const settings = Object.assign({}, internals.defaults, config);

        if (settings.errorThreshold === null) {
            settings.errorThreshold = -Infinity;
        }

        this._settings = settings;
        this._endpoint = endpoint;
        this._data = [];
        this._failureCount = 0;

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

                if (err && this._failureCount < this._settings.errorThreshold) {
                    this._failureCount++;
                    return callback();
                }

                this._data = [];
                this._failureCount = 0;

                return callback(this._settings.errorThreshold !== -Infinity && err);
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
        const wreckOptions = {
            payload: lineData.join('\n')
        };

        Hoek.merge(wreckOptions, this._settings.wreck, { nullOverride: false });

        // Prevent this from user tampering
        if(wreckOptions.headers){
            wreckOptions.headers['content-type'] = 'text/plain'
        } else {
            wreckOptions.headers = { 'content-type': 'text/plain' };
        }
        Wreck.request('post', this._endpoint, wreckOptions).then((req) => {
            return callback(null, req);
        });
    }
}

module.exports = GoodInfluxHttp;
