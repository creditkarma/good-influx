'use strict';

const Os = require('os');
const Stringify = require('fast-safe-stringify');

const influxInt = (value) => {
    if (Number.isInteger(Number(value))) {
        return `${String(value)}i`;
    }
    return value;
};

const formatString = (value) => {
    let string;

    if (Object.prototype.toString.call(value) === '[object Object]' &&
        !Array.isArray(value)) {
        string = Stringify(value).replace(/"/g, '\\"');
    }
    else {
        string = String(value);
    }

    return `"${string}"`;
};

// If metadata is configured, add it to the tags.
// Special characters are escaped as defined in InfluxDB documentation:
// https://docs.influxdata.com/influxdb/v1.3/write_protocols/line_protocol_tutorial/
const tags = (config, event) => {

    const completeTags = {
        host: event.host || Os.hostname(),
        pid: event.pid
    };

    if (config.metadata) {
        Object.keys(config.metadata).forEach((key) => {
            const value = config.metadata[key];
            if (value !== undefined && value !== null && value !== '') {
                completeTags[key] = `${value}`
                    .replace(',', '\,')
                    .replace('=', '\=')
                    .replace(' ', '\ ');
            }
        });
    }

    return completeTags;
};

const serialize = (obj) => {
    return Object.keys(obj)
        .map((key) => `${key}=${obj[key]}`)
        .join(',');
};

module.exports = {
    Int: influxInt,
    String: formatString,
    tags,
    serialize
};
