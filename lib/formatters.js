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

const tags = (config, event) => {

    const completeTags = {
        host: event.host || Os.hostname(),
        pid: event.pid
    };

    if (config.metadata) {
        Object.keys(config.metadata).forEach((key) => {
            const value = config.metadata[key];
            if (value !== undefined && value !== null && value !== '') {
                completeTags[key] = formatString(config.metadata[key]);
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
