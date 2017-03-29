'use strict';

const Os = require('os');
const Stringify = require('fast-safe-stringify');

const Int = (value) => {
    if (Number.isInteger(Number(value))) {
        return `${String(value)}i`;
    }
    return value;
};

const formattedString = (value) => {
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

const tags = (event) => {
    return {
        host : event.host || internals.host,
        pid  : event.pid
    };
};

const serialize = (obj) => {
    return Object.keys(obj)
        .map((key) => `${key}=${obj[key]}`)
        .join(',');
};

module.exports = {
    host: Os.hostname(),
    Int,
    String: formattedString,
    tags,
    serialize
};
