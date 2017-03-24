'use strict';

const LineProtocol = require('../lib/line-protocol');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const testHost = 'myservice.awesome.com';

const getExpectedMessage = (ports, metadata) => {
    const plusMetadata = metadata || '';
    /* eslint max-len: ["error", 440, 4] */
    const expectedBaseMessage = `ops,host=${testHost},pid=9876 os.cpu1m=3.05078125,os.cpu5m=2.11279296875,os.cpu15m=1.625,os.freemem=147881984i,os.totalmem=6089818112i,os.uptime=23489i,proc.delay=32.29,proc.heapTotal=47271936i,proc.heapUsed=26825384i,proc.rss=64290816i,proc.uptime=22.878${plusMetadata} 1485996802647000000`;
    const eventHost = 'host=myservice.awesome.com,pid=128';
    const loadOpsEvents = ports.map((port) => {
        return [
            `ops_requests,${eventHost} port=${port},requestsTotal=1,requestsDisconnects=1,requests200=61`,
            `ops_concurrents,${eventHost} port=${port},concurrents=23`,
            `ops_responseTimes,${eventHost} port=${port},avg=990,max=1234`,
            `ops_sockets,${eventHost} port=${port},httpTotal=19,httpsTotal=49`
        ].join('\n');
    });
    return expectedBaseMessage + '\n' + loadOpsEvents.join('\n');
};

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

describe('ops', () => {
    it('One port => two events created', (done) => {
        const testEvent = JSON.parse(testOpsEventBase);
        const formattedEvent = LineProtocol.format(testEvent, {});
        expect(formattedEvent).to.equal(getExpectedMessage(['8080']));
        done();
    });
});

describe('log', () => {
    it('Event log is formatted as expected', (done) => {
        const testEvent = {
            event: 'log',
            host: 'mytesthost',
            timestamp: 1485996802647,
            tags: ['info', 'request'],
            data: 'Things are good',
            pid: 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, {});
        const expectedLogEvent = 'log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });
});

describe('request', () => {
    it('Event request is formatted as expected', (done) => {
        const testEvent = {
            event: 'request',
            host: 'mytesthost',
            timestamp: 1485996802647,
            data: 'userid=001',
            id: '4321',
            path: '/hello',
            method: 'POST',
            tags: ['request','blahblahblah'],
            pid: 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, {});
        const expectedLogEvent = 'request,host=mytesthost,pid=1234 data="userid=001",id="4321",method="POST",path="/hello",tags="request,blahblahblah" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });
});


describe('response', () => {
    it('Event response is formatted as expected', (done) => {
        const testEvent = {
            event: 'response',
            host: 'mytesthost',
            timestamp: 1485996802647,
            httpVersion   : '1.1',
            id            : '1234',
            instance      : 'mytesthost',
            labels        : 'label001',
            method        : 'GET',
            path          : '/hello',
            source : {
                referer       : 'referer',
                remoteAddress : '127.0.0.1',
                userAgent     : 'Chrome'
            },
            query : {
                k1: 'v1', k2: 'v2'
            },
            responseTime  : 500,
            statusCode    : 200,
            pid           : 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, {});
        const expectedLogEvent = 'response,host=mytesthost,pid=1234 httpVersion="1.1",id="1234",instance="mytesthost",labels="label001",method="GET",path="/hello",query="k1=v1&k2=v2",referer="referer",remoteAddress="127.0.0.1",responseTime=500i,statusCode=200i,userAgent="Chrome" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });
});

describe('error', () => {
    it('Event error is formatted as expected', (done) => {
        const testEvent = {
            event: 'error',
            host: 'mytesthost',
            timestamp: 1485996802647,
            error : {
                name   : 'error1',
                message : 'this is an error msg',
                stack  : 'stackoverflow'
            },
            id     : '1234',
            url    : '/hello',
            method : 'GET',
            tags   : ['error','crash'],
            pid: 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, {});
        const expectedLogEvent = 'error,host=mytesthost,pid=1234 error.name="error1",error.message="this is an error msg",error.stack="stackoverflow",id="1234",url="/hello",method="GET",tags="error,crash" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });
});
