'use strict'

const Hoek = require('hoek');
const GoodHttp = require('good-http');
const Wreck = require('wreck');

const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        metadata: false
    }
}

class GoodInfluxHttp extends GoodHttp {
    constructor(endpoint, config) {
        super(endpoint, config);
        this._settings.schema = 'good-influx';
        this.config = Hoek.applyToDefaults(internals.defaults, config)
    }
    _sendMessages(callback) {

        const wreckOptions = {
            payload: this._data
                .map((event) => LineProtocol.format(event, this.config))
                .join('\n')
        };

        Hoek.merge(wreckOptions, this._settings.wreck, false);

        // Prevent this from user tampering
        wreckOptions.headers['content-type'] = 'text/plain';
        Wreck.request('post', this._endpoint, wreckOptions, callback);
    }
}

module.exports = GoodInfluxHttp;
