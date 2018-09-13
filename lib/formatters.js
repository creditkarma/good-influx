'use strict';

const Stringify = require('fast-safe-stringify');

const influxInt = (value) => {
    const num = parseInt(+value, 10);
    if (!isNaN(num)) {
        return `${num}i`;
    }
};

const formatString = (value) => {
    let string;

    if (Object.prototype.toString.call(value) === '[object Object]' &&
        !Array.isArray(value)) {
        string = Stringify(value);
    }
    else {
        string = String(value);
    }

    string = string.replace(/"/g, '\\"').replace(/(\r)?\n/g, '\\n');

    return `"${string}"`;
};

/**
 * Format a measurement name. Commas and spaces must be escaped.
 * @see https://docs.influxdata.com/influxdb/v1.3/write_protocols/line_protocol_tutorial
 */
const formatMeasurement = (name) => {
    return `${name}`
        .replace(/,/g, '\\,')
        .replace(/ /g, '\\ ');
};

/**
 * Format a tag key or value. Commas, spaces, and equals signs must be escaped.
 * @see https://docs.influxdata.com/influxdb/v1.3/write_protocols/line_protocol_tutorial
 */
const formatTagKV = (value) => {
    return `${value}`
        .replace(/,/g, '\\,')
        .replace(/=/g, '\\=')
        .replace(/ /g, '\\ ');
};

const serialize = (obj) => {
    return Object.keys(obj)
        .map((key) => `${key}=${obj[key]}`)
        .join(',');
};

const flatten = (data, prefix = 'data', stack = []) => {
    if (stack.includes(data)) {
        return {
            [`${prefix}`]: formatVal('...omitted (circular reference detected)...')
        };
    }

    if (data && typeof data === 'object' && !Array.isArray(data)) {
        let returnVal = {};
        stack.push(data);
        Object.keys(data).forEach((key) => {
            const val = data[key];
            const newPrefix = (prefix ? prefix + '.' : '') + key;
            returnVal = Object.assign(returnVal, flatten(val, newPrefix, stack));
        });
        stack.pop();
        return returnVal;
    }

    if (data === null || data === undefined) {
        return {};
    }

    return {
        [`${prefix}`]: formatVal(data)
    };
};

const formatVal = (value) => {
    if (Array.isArray(value)) {
        return formatString(value);
    }
    else if (Number.isInteger(+value) && isFinite(value)) {
        return influxInt(value);
    }
    else if (!isNaN(+value) && isFinite(value)) {
        return +value;
    }

    return formatString(value);
};

module.exports = {
    Int: influxInt,
    String: formatString,
    Flatten: flatten,
    Measurement: formatMeasurement,
    TagKV: formatTagKV,
    serialize
};
