'use strict';

const LineProtocol = require('../lib/line-protocol');
const Schemas = require('../schemas');

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const testHost = 'myservice.awesome.com';

const testOpsEventBase = JSON.stringify({
    event: 'ops',
    timestamp: 1485996802647,
    host: testHost,
    pid: 9876,
    os: {
        load: [3.05078125, 2.11279296875, 1.625],
        mem: { total: 6089818112, free: 147881984 },
        uptime: 23489
    },
    proc: {
        uptime: 22.878,
        mem: { rss: 64290816, heapTotal: 47271936, heapUsed: 26825384 },
        delay: 32.29
    },
    load: {
        requests: { '8080':
            { total: 94, disconnects: 1, statusCodes: { '200': 61 } }
        },
        concurrents: { '8080': 23 },
        responseTimes: { '8080': { avg: 990, max: 1234 } },
        sockets: { http: { total: 19 }, https: { total: 49 } }
    }
});

const getExpectedMessage = (ports, metadata, responseTimesAvg, responseTimesMax) => {
    const plusMetadata = metadata ? `,${metadata}` : '';
    const avg = isNaN(responseTimesAvg) ? 990 : responseTimesAvg;
    const max = isNaN(responseTimesMax) ? 1234 : responseTimesMax;
    const eventHost = `host=${testHost},pid=9876`;
    const expectedBaseMessage = [
        `ops,${eventHost}${plusMetadata} os.cpu1m=3.05078125,os.cpu5m=2.11279296875,`
        + 'os.cpu15m=1.625,os.freemem=147881984i,os.totalmem=6089818112i,'
        + 'os.uptime=23489i,proc.delay=32.29,proc.heapTotal=47271936i,'
        + 'proc.heapUsed=26825384i,proc.rss=64290816i,'
        + 'proc.uptime=22.878 1485996802647000000'
    ];

    const loadOpsRequestsEvents = ports.map((port) => {
        return `ops_requests,${eventHost}${plusMetadata},port=${port} requests200=61,requestsTotal=94,requestsDisconnects=1 1485996802647000000`;
    });
    const loadOpsConcurrentsEvents = ports.map((port) => {
        return `ops_concurrents,${eventHost}${plusMetadata},port=${port} concurrents=23 1485996802647000000`;
    });
    const loadOpsResponseTimesEvents = ports.map((port) => {
        return `ops_responseTimes,${eventHost}${plusMetadata},port=${port} avg=${avg},max=${max} 1485996802647000000`;
    });
    const loadOpsSocketsEvents = [`ops_sockets,${eventHost}${plusMetadata} httpTotal=19,httpsTotal=49 1485996802647000000`];

    const finalOpsEvents = [
        loadOpsRequestsEvents,
        loadOpsConcurrentsEvents,
        loadOpsResponseTimesEvents,
        loadOpsSocketsEvents,
        expectedBaseMessage
    ].reduce( (a,b) => a.concat(b));

    return finalOpsEvents;
};

describe('ops all events', () => {
    it('One port => five events created', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage(['8080']));
    });
    it('Two ports => nine events created', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        testEvent.load.requests['8081'] = testEvent.load.requests['8080'];
        testEvent.load.concurrents['8081'] = testEvent.load.concurrents['8080'];
        testEvent.load.responseTimes['8081'] = testEvent.load.responseTimes['8080'];
        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage(['8080','8081']));
    });
    it('No ports reported => Only format the ops event', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        testEvent.load.requests = {};
        testEvent.load.concurrents = {};
        testEvent.load.responseTimes = {};

        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage([]));
    });
    it('Undefined conurrrents reported => handles as empty object', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        testEvent.load.requests = {};
        testEvent.load.concurrents = undefined;
        testEvent.load.responseTimes = {};

        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage([]));
    });
});

describe('ops_responseTimes avg max', () => {
    it('avg is null and max is string => avg and max shall be 0s', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        testEvent.load.responseTimes['8080'].avg = null;
        testEvent.load.responseTimes['8080'].max = 'abc';
        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage(['8080'],null,0,0));
    });
    it('avg and max are both numbers => avg and max shall be numbers', () => {
        const testEvent = JSON.parse(testOpsEventBase);
        testEvent.load.responseTimes['8080'].avg = 123;
        testEvent.load.responseTimes['8080'].max = '456';
        const formattedEvent = LineProtocol.format(testEvent, {}, Schemas);
        expect(formattedEvent).to.equal(getExpectedMessage(['8080'],null,123,456));
    });
});
