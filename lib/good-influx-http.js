'use strict';

const Hoek = require('@hapi/hoek');
const GoodHttp = require('good-http');
const Wreck = require('@hapi/wreck');
const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        metadata: false
    }
};

class GoodInfluxHttp extends GoodHttp {
    constructor(endpoint, config, schemas) {
        super(endpoint, config, schemas);
        this._settings.schema = 'good-influx';
        this.config = Hoek.applyToDefaults(internals.defaults, config);
        this.schemas = schemas;
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

        Hoek.merge(wreckOptions, this._settings.wreck, false);

        // Prevent this from user tampering
        wreckOptions.headers['content-type'] = 'text/plain';
        Wreck.request('post', this._endpoint, wreckOptions, callback);
    }
}

module.exports = GoodInfluxHttp;
