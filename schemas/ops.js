'use strict';

const opsRequests = {
    metric: 'ops_requests',
    splitLines: { splitOn: 'load.requests', splitKey: 'port' },
    tags: [
        { key: 'port', value: 'port' }
    ],
    fields: [
        {
            type: 'iterator',
            iteratorBase: 'load.requests.${port}.statusCodes',
            itemKey: 'code',
            fields: [
                { key: 'requests${code}', type: 'float', value: 'load.requests.${port}.statusCodes.${code}' }
            ]
        },
        { key: 'requestsTotal', type: 'float', value: 'load.requests.${port}.total' },
        { key: 'requestsDisconnects', type: 'float', value: 'load.requests.${port}.disconnects' }
    ]
};

const opsConcurrents = {
    metric: 'ops_concurrents',
    splitLines: { splitOn: 'load.concurrents', splitKey: 'port' },
    tags: [
        { key: 'port', value: 'port' }
    ],
    fields: [
        { key: 'concurrents', type: 'float', value: 'load.concurrents.${port}' }
    ]
};

const opsResponseTimes = {
    metric: 'ops_responseTimes',
    splitLines: { splitOn: 'load.responseTimes', splitKey: 'port' },
    tags: [
        { key: 'port', value: 'port' }
    ],
    fields: [
        { key: 'avg', type: 'float', value: 'load.responseTimes.${port}.avg', default: 0 },
        { key: 'max', type: 'float', value: 'load.responseTimes.${port}.max', default: 0 }
    ]
};

const opsSockets = {
    metric: 'ops_sockets',
    fields: [
        {
            type: 'iterator',
            iteratorBase: 'load.sockets',
            itemKey: 'protocol',
            fields: [
                { key: '${protocol}Total', type: 'float', value: 'load.sockets.${protocol}.total' }
            ]
        }
    ]
};

const ops = {
    metric: 'ops',
    fields: [
        { key: 'os.cpu1m', type: 'float', value: 'os.load[0]' },
        { key: 'os.cpu5m', type: 'float', value: 'os.load[1]' },
        { key: 'os.cpu15m', type: 'float', value: 'os.load[2]' },
        { key: 'os.freemem', type: 'int', value: 'os.mem.free' },
        { key: 'os.totalmem', type: 'int', value: 'os.mem.total' },
        { key: 'os.uptime', type: 'int', value: 'os.uptime' },
        { key: 'proc.delay', type: 'float', value: 'proc.delay' },
        { key: 'proc.heapTotal', type: 'int', value: 'proc.mem.heapTotal' },
        { key: 'proc.heapUsed', type: 'int', value: 'proc.mem.heapUsed' },
        { key: 'proc.rss', type: 'int', value: 'proc.mem.rss' },
        { key: 'proc.uptime', type: 'float', value: 'proc.uptime' }
    ]
};

module.exports = [
    opsRequests,
    opsConcurrents,
    opsResponseTimes,
    opsSockets,
    ops
];
