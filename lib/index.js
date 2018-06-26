'use strict';

const GoodInfluxHttp = require('./good-influx-http');
const GoodInfluxUdp = require('./good-influx-udp');
const Url = require('url');
const Schemas = require('../schemas');

const GoodInflux = function (endpoint, config) {
    const finalSchemas = Object.assign({}, Schemas, config.schemas);
    const endpointUrl = Url.parse(endpoint);
    if (endpointUrl.protocol === 'udp:') {
        return new GoodInfluxUdp(endpoint, config, finalSchemas);
    }
    else if (endpointUrl.protocol === 'http:' || endpointUrl.protocol === 'https:') {
        return new GoodInfluxHttp(endpoint, config, finalSchemas);
    }
    throw new Error(`Unsupported protocol ${endpointUrl.protocol}. Supported protocols are udp, http or https`);
};

module.exports = GoodInflux;
