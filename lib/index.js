'use strict';
// Load modules

const Hoek = require('hoek');
const GoodHttp = require('good-http');
const Wreck = require('wreck');

const LineProtocol = require('./line-protocol.js');

class GoodInflux extends GoodHttp {
    constructor(endpoint, config) {
        super(endpoint, config);
        this._settings.schema = 'good-influx';
    }
    _sendMessages(callback) {

        var wreckOptions = {
            payload: this._data
                .map((event) => LineProtocol.format(event))
                .join('\n')
        };

        Hoek.merge(wreckOptions, this._settings.wreck, false);

        // Prevent this from user tampering
        wreckOptions.headers['content-type'] = 'text/plain';
        Wreck.request('post', this._endpoint, wreckOptions, callback);
    }
}


module.exports = GoodInflux;
