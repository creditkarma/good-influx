'use strict';

/**
 * Converts event data to InfluxDB line protocol
 * https://docs.influxdata.com/influxdb/v0.12/write_protocols/line/
 */

// Load modules

const Os = require('os');
const Qs = require('querystring');
const Url = require('url');
const Hoek = require('hoek');
const Stringify = require('fast-safe-stringify');

// Declare internals

const internals = {
    host: Os.hostname()
};

/* eslint-disable no-confusing-arrow */
internals.Int = (value) => Number.isInteger(Number(value)) ? `${value}i` : value;

internals.String = (value) => {
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

internals.tags = (config, event) => {

    const tags = {
        host: event.host || internals.host,
        pid: event.pid
    };

    if (config.metadata) {
        Object.keys(config.metadata).forEach((key) => {
            if (config.metadata[key] !== undefined && config.metadata[key] !== null) {
                tags[key] = internals.String(config.metadata[key]);
            }
        });
    }

    return tags;
};

internals.formatError = (error) => {

    if (!error instanceof Error) {
        return internals.String(error);
    }

    const result = {
        'error.name': internals.String(error.name),
        'error.message': internals.String(error.message),
        'error.stack': internals.String(error.stack)
    };

    if (error.isBoom) {
        result['error.statusCode'] = internals.Int(error.output.statusCode);

        Object.keys(error.data).forEach((key) => {

            result[`error.data.${key}`] = internals.String(error.data[key]);
        });
    }

    return result;
};

internals.values = {
    error: (event) => Object.assign(
        {},
        internals.formatError(event.error),
        {
            id: internals.String(event.id),
            url: internals.String(event.url && Url.format(event.url)),
            method: internals.String(event.method && event.method.toUpperCase()),
            tags: internals.String(event.tags)
        }
    ),
    log: (event) => {

        if (event.data instanceof Error) {

            return Object.assign(
                {},
                internals.formatError(event.data),
                { tags: internals.String(event.tags) }
            );
        }

        return {
            data: internals.String(event.data),
            tags: internals.String(event.tags)
        };
    },
    ops: (event) => {

        const load = Hoek.reach(event, 'os.load', { default: new Array(3) });

        return {
            'os.cpu1m': load[0],
            'os.cpu5m': load[1],
            'os.cpu15m': load[2],
            'os.freemem': internals.Int(Hoek.reach(event, 'os.mem.free')),
            'os.totalmem': internals.Int(Hoek.reach(event, 'os.mem.total')),
            'os.uptime': internals.Int(Hoek.reach(event, 'os.uptime')),
            'proc.delay': Hoek.reach(event, 'proc.delay'),
            'proc.heapTotal': internals.Int(Hoek.reach(event, 'proc.mem.heapTotal')),
            'proc.heapUsed': internals.Int(Hoek.reach(event, 'proc.mem.heapUsed')),
            'proc.rss': internals.Int(Hoek.reach(event, 'proc.mem.rss')),
            'proc.uptime': Hoek.reach(event, 'proc.uptime')
        };
    },
    request: (event) => {

        if (event.data instanceof Error) {

            return Object.assign(
                {},
                internals.formatError(event.data),
                {
                    id: internals.String(event.id),
                    method: internals.String(event.method && event.method.toUpperCase()),
                    path: internals.String(event.path),
                    tags: internals.String(event.tags)
                }
            );
        }

        return {
            data: internals.String(event.data),
            id: internals.String(event.id),
            method: internals.String(event.method && event.method.toUpperCase()),
            path: internals.String(event.path),
            tags: internals.String(event.tags)
        };
    },
    response: (event) => {

        return {
            httpVersion: internals.String(event.httpVersion),
            id: internals.String(event.id),
            instance: internals.String(event.instance),
            labels: internals.String(event.labels),
            method: internals.String(event.method && event.method.toUpperCase()),
            path: internals.String(event.path),
            query: Qs.stringify(internals.String(event.query)),
            referer: internals.String(Hoek.reach(event, 'source.referer')),
            remoteAddress: internals.String(Hoek.reach(event, 'source.remoteAddress')),
            responseTime: internals.Int(event.responseTime),
            statusCode: internals.Int(event.statusCode),
            userAgent: internals.String(Hoek.reach(event, 'source.userAgent'))
        };
    }
};

internals.serialize = (obj) => Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join(',');

module.exports.format = (event, config) => {
    const eventName = event.event;
    const timestamp = event.timestamp;

    const getEventValues = internals.values[eventName];
    if (!getEventValues) {
        return;
    }

    // Tag set
    const tags = internals.serialize(internals.tags(config, event));

    // Field set
    const values = internals.serialize(getEventValues(event));

    // Timestamp in InfluxDB is in nanoseconds
    return `${eventName},${tags} ${values} ${timestamp}000000`;
};
