'use strict';

/**
 * Converts event data to InfluxDB line protocol
 * https://docs.influxdata.com/influxdb/v1.2/write_protocols/line_protocol_tutorial/
 */

// Load modules
const Querystring = require('querystring');
const Url = require('url');
const Hoek = require('hoek');
const OpsFormatter = require('./ops-format');
const Helpers = require('./helpers');

const Formatters = require('./formatters');

const internals = {};

internals.formatError = (error) => {

    const result = {
        'error.name': Formatters.String(error.name),
        'error.message': Formatters.String(error.message),
        'error.stack': Formatters.String(error.stack)
    };

    if (error.isBoom) {
        result['error.statusCode'] = Formatters.Int(error.output.statusCode);

        Object.keys(error.data).forEach((key) => {

            result[`error.data.${key}`] = Formatters.String(error.data[key]);
        });
    }

    return result;
};

internals.values = {
    error: (event) => Object.assign(
        {},
        internals.formatError(event.error),
        {
            id: Formatters.String(event.id),
            url: Formatters.String(event.url && Url.format(event.url)),
            method: Formatters.String(event.method && event.method.toUpperCase()),
            tags: Formatters.String(event.tags)
        }
    ),
    log: (event, config) => {

        if (event.data instanceof Error) {

            return Object.assign(
                {},
                internals.formatError(event.data),
                { tags: Formatters.String(event.tags) }
            );
        }

        const fieldKey = config.customLogField;
        if (fieldKey && Hoek.reach(event.data, fieldKey)) {
            const customlogField = event.data[fieldKey];
            return Object.keys(customlogField).reduce((agg, key) => {
                const val = customlogField[key];
                if (!isNaN(val)) {
                    agg[Formatters.TagKV(key)] = Formatters.Int(val);
                }
                else if (!isNaN(parseFloat(val))) {
                    agg[Formatters.TagKV(key)] = Formatters.Int(parseFloat(val));
                }
                return agg;
            }, {});
        }

        return {
            data: Formatters.String(event.data),
            tags: Formatters.String(event.tags)
        };
    },
    ops: (event) => {

        const load = Hoek.reach(event, 'os.load', { default: new Array(3) });

        return {
            'os.cpu1m': load[0],
            'os.cpu5m': load[1],
            'os.cpu15m': load[2],
            'os.freemem': Formatters.Int(Hoek.reach(event, 'os.mem.free')),
            'os.totalmem': Formatters.Int(Hoek.reach(event, 'os.mem.total')),
            'os.uptime': Formatters.Int(Hoek.reach(event, 'os.uptime')),
            'proc.delay': Hoek.reach(event, 'proc.delay'),
            'proc.heapTotal': Formatters.Int(Hoek.reach(event, 'proc.mem.heapTotal')),
            'proc.heapUsed': Formatters.Int(Hoek.reach(event, 'proc.mem.heapUsed')),
            'proc.rss': Formatters.Int(Hoek.reach(event, 'proc.mem.rss')),
            'proc.uptime': Hoek.reach(event, 'proc.uptime')
        };
    },
    request: (event) => {

        if (event.data instanceof Error) {

            return Object.assign(
                {},
                internals.formatError(event.data),
                {
                    id: Formatters.String(event.id),
                    method: Formatters.String(event.method && event.method.toUpperCase()),
                    path: Formatters.String(event.path),
                    tags: Formatters.String(event.tags)
                }
            );
        }

        return {
            data: Formatters.String(event.data),
            id: Formatters.String(event.id),
            method: Formatters.String(event.method && event.method.toUpperCase()),
            path: Formatters.String(event.path),
            tags: Formatters.String(event.tags)
        };
    },
    response: (event) => {

        return {
            httpVersion: Formatters.String(event.httpVersion),
            id: Formatters.String(event.id),
            instance: Formatters.String(event.instance),
            labels: Formatters.String(event.labels),
            method: Formatters.String(event.method && event.method.toUpperCase()),
            path: Formatters.String(event.path),
            query: Formatters.String(Querystring.stringify(event.query)),
            referer: Formatters.String(Hoek.reach(event, 'source.referer')),
            remoteAddress: Formatters.String(Hoek.reach(event, 'source.remoteAddress')),
            responseTime: Formatters.Int(event.responseTime),
            statusCode: Formatters.Int(event.statusCode),
            userAgent: Formatters.String(Hoek.reach(event, 'source.userAgent'))
        };
    }
};

module.exports.format = (event, config) => {
    const eventName = event.event;
    const timestamp = event.timestamp;

    const getEventValues = internals.values[eventName];
    if (!getEventValues) {
        return;
    }

    // Tag set
    const tags = Formatters.serialize(Formatters.tags(config, event));

    // Field set
    const values = Formatters.serialize(getEventValues(event, config));

    const prefix = Helpers.measurementPrefix(config);
    const finalEventName = Formatters.Measurement(`${prefix}${eventName}`);

    let loadValues = [];
    if (eventName === 'ops') {
        loadValues = OpsFormatter.format(event,config);
    }
    const eventValue = `${finalEventName},${tags} ${values} ${timestamp}000000`;
    // Timestamp in InfluxDB is in nanoseconds
    if (loadValues.length === 0) {
        return eventValue;
    }
    return [eventValue].concat(loadValues).join('\n');
};
