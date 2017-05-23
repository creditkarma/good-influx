'use strict';

const GoodInfluxHttp = require('./good-influx-http');
const GoodInfluxUdp = require('./good-influx-udp');
const Url = require('url');

const GoodInflux = function (endpoint, config) {
    const endpointUrl = Url.parse(endpoint);
    if (endpointUrl.protocol === 'udp:') {
        return new GoodInfluxUdp(endpoint, config);
    }
    else if (endpointUrl.protocol === 'http:' || endpointUrl.protocol === 'https:') {
        return new GoodInfluxHttp(endpoint, config);
    }
    throw new Error(`Unsupported protocol ${endpointUrl.protocol}. Supported protocols are udp, http or https`);
};

module.exports = GoodInflux;
