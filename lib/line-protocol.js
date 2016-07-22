'use strict';

/**
 * Converts event data to InfluxDB line protocol
 * https://docs.influxdata.com/influxdb/v0.12/write_protocols/line/
 */

// Load modules

const Os = require('os');
const Hoek = require('hoek');
const Stringify = require('fast-safe-stringify');

// Declare internals

const internals = {
    host: Os.hostname()
};

internals.Int = (value) => (isNaN(Number(value))) ? value : String(value) + 'i';

internals.String = (value) => {

    const string = (value instanceof Object && !Array.isArray(value)) ?
        Stringify(value).replace(/"/g, '\\"') :
        String(value);

    return `"${string}"`;
};

internals.tags = (event) => {

    return {
        host : event.host || internals.host,
        pid  : event.pid
    };
};

internals.values = {
    error: (event) => {

        return {
            'error.message' : internals.String(event.data.message),
            'error.stack'   : internals.String(event.data.stack),
            id              : internals.String(event.id),
            method          : internals.String(event.method && event.method.toUpperCase()),
            url             : internals.String(event.url)
        };
    },
    log: (event) => {

        return {
            data : internals.String(event.data),
            tags : internals.String(event.tags)
        };
    },
    ops: (event) => {

        const load = Hoek.reach(event, 'os.load', { default: new Array(3) });

        return {
            'os.cpu1m'       : load[0],
            'os.cpu5m'       : load[1],
            'os.cpu15m'      : load[2],
            'os.freemem'     : internals.Int(Hoek.reach(event, 'os.mem.free')),
            'os.totalmem'    : internals.Int(Hoek.reach(event, 'os.mem.total')),
            'os.uptime'      : internals.Int(Hoek.reach(event, 'os.uptime')),
            'proc.delay'     : Hoek.reach(event, 'proc.delay'),
            'proc.heapTotal' : internals.Int(Hoek.reach(event, 'proc.mem.heapTotal')),
            'proc.heapUsed'  : internals.Int(Hoek.reach(event, 'proc.mem.heapUsed')),
            'proc.rss'       : internals.Int(Hoek.reach(event, 'proc.mem.rss')),
            'proc.uptime'    : Hoek.reach(event, 'proc.uptime')
        };
    },
    request: (event) => {

        if (event.data.isBoom) {
            return {
                'error.message' : internals.String(event.data.message),
                'error.stack'   : internals.String(event.data.stack),
                id              : internals.String(event.id),
                method          : internals.String(event.method && event.method.toUpperCase()),
                path            : internals.String(event.path),
                tags            : internals.String(event.tags)
            };
        }

        return {
            data   : internals.String(event.data),
            id     : internals.String(event.id),
            method : internals.String(event.method),
            path   : internals.String(event.path),
            tags   : internals.String(event.tags)
        };
    },
    response: (event) => {

        return {
            httpVersion   : internals.String(event.httpVersion),
            id            : internals.String(event.id),
            instance      : internals.String(event.instance),
            labels        : internals.String(event.labels),
            method        : internals.String(event.method),
            path          : internals.String(event.path),
            query         : internals.String(event.query),
            referer       : internals.String(Hoek.reach(event, 'source.referer')),
            remoteAddress : internals.String(Hoek.reach(event, 'source.remoteAddress')),
            responseTime  : internals.Int(event.responseTime),
            statusCode    : internals.Int(event.statusCode),
            userAgent     : internals.String(Hoek.reach(event, 'source.userAgent')),
        };
    }
}

internals.serialize = (obj) => Object.keys(obj)
    .map((key) => `${key}=${obj[key]}`)
    .join(',');

module.exports.format = (event) => {

    const eventName = event.event;
    const timestamp = event.timestamp;

    let getEventValues = internals.values[eventName];
    if (!getEventValues) { return; }

    const tags   = internals.serialize(internals.tags(event));
    const values = internals.serialize(getEventValues(event))

    // Timestamp in InfluxDB is in nanoseconds
    return `${eventName},${tags} ${values} ${timestamp}000000`;
};
