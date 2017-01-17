'use strict';
// Load modules

const Hoek = require('hoek');
const GoodHttp = require('good-http');
const Wreck = require('wreck');

const LineProtocol = require('./line-protocol.js');

const internals = {
    defaults: {
        metadata: false
    }
}

class GoodInflux extends GoodHttp {
    constructor(endpoint, config) {
        super(endpoint, config);
        this._settings.schema = 'good-influx';
        this.config = Hoek.applyToDefaults(internals.defaults, config)
    }
    _sendMessages(callback) {

        var wreckOptions = {
            payload: this._data
                .map((event) => LineProtocol.format(event, this.config))
                .join('\n')
        };

        Hoek.merge(wreckOptions, this._settings.wreck, false);

        // Prevent this from user tampering
        wreckOptions.headers['content-type'] = 'text/plain';
        console.log(`Making a request to ${this._endpoint}`)
        Wreck.request('post', this._endpoint, wreckOptions, callback);
    }
}


module.exports = GoodInflux;
