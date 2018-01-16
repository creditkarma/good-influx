'use strict';

const LineProtocol = require('../lib/line-protocol');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

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

    it('custom formated log is processed as expected', (done) => {
        const testEvent = {
            event: 'log',
            host: 'mytesthost',
            timestamp: 1485996802647,
            tags: ['info', 'request'],
            data: {
                stats: {
                    stats1: 123,
                    stats2: 456.7,
                    stats3: '789.1sec',
                    stats4: 'abc'
                }
            },
            pid: 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, { customLogFormatter: (data) => data.stats });
        const expectedLogEvent = 'log,host=mytesthost,pid=1234 stats1=123i,stats2=456.7,stats3=789.1,stats4=\"abc\" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });

    it('throw error if customLogFormatter is not a function', (done) => {
        const testEvent = {
            event: 'log',
            host: 'mytesthost',
            timestamp: 1485996802647,
            tags: ['info', 'request'],
            data: {
                stats: {
                    stats1: 123
                }
            },
            pid: 1234
        };
        const throws = () => {
            LineProtocol.format(testEvent, { customLogFormatter: 'test-string' });
        };
        expect(throws).to.throw(Error, 'customLogFormatter should be a function');
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
            pid    : 1234
        };
        const formattedLogEvent = LineProtocol.format(testEvent, {});
        const expectedLogEvent = 'error,host=mytesthost,pid=1234 error.name="error1",error.message="this is an error msg",error.stack="stackoverflow",id="1234",url="/hello",method="GET",tags="error,crash" 1485996802647000000';
        expect(formattedLogEvent).to.equal(expectedLogEvent);
        done();
    });
});

describe('Unrecognized event', () => {
    it('LineProtocol simply returns', (done) => {
        const testEvent = {
            event: 'hello',
            host: 'mytesthost',
            timestamp: 1485996802647
        };
        expect(LineProtocol.format(testEvent, {})).to.equal(undefined);
        done();
    });
});

describe('Metadata', () => {
    const testEvent = {
        event: 'log',
        host: 'mytesthost',
        timestamp: 1485996802647,
        tags: ['info', 'request'],
        data: 'Things are good',
        pid: 1234
    };

    it('No metadata set => Tags contain host and PID', (done) => {
        const logEventNoMetadata = 'log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';
        expect(LineProtocol.format(testEvent, {})).to.equal(logEventNoMetadata);
        done();
    });

    it('Metadata set => Contained in tags', (done) => {
        const configs = {
            metadata: {
                protocol: 'magic'
            }
        };
        const logEventWithMetadata = 'log,host=mytesthost,pid=1234,protocol=magic data="Things are good",tags="info,request" 1485996802647000000';
        expect(LineProtocol.format(testEvent, configs)).to.equal(logEventWithMetadata);
        done();
    });

    it('Special characters properly escaped', (done) => {
        const configs = {
            metadata: {
                'hometown': 'BikeCity,USA',
                'protocol': 'mag=ic',
                'bless': 'the rains'
            }
        };

        const tagSet = 'host=mytesthost,pid=1234,hometown=BikeCity\\,USA,protocol=mag\\=ic,bless=the\\ rains';
        const logEventSpecialChars = `log,${tagSet} data="Things are good",tags="info,request" 1485996802647000000`;

        expect(LineProtocol.format(testEvent, configs)).to.equal(logEventSpecialChars);
        done();
    });

    it('Null, undefined and empty string => no metadata added', (done) => {
        const configs = {
            metadata: {
                nullValue: null,
                undefinedValue: undefined,
                emptyString: ''
            }
        };

        const logEventNoMetadata = 'log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';
        expect(LineProtocol.format(testEvent, configs)).to.equal(logEventNoMetadata);
        done();
    });
});

describe('Measurement prefixes', () => {

    const testEvent = {
        event: 'log',
        host: 'mytesthost',
        timestamp: 1485996802647,
        tags: ['info', 'request'],
        data: 'Things are good',
        pid: 1234
    };

    it('Are applied correctly', (done) => {
        const configs = {
            prefix: ['my', 'awesome', 'service']
        };
        const eventWithPrefix = 'my/awesome/service/log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';
        expect(LineProtocol.format(testEvent, configs)).to.equal(eventWithPrefix);
        done();
    });

    it('Special characters are escaped', (done) => {
        const configs = {
            prefix: ['my', ' ', 'awesome', ',', 'service', ' '],
            prefixDelimiter: ''
        };
        const eventWithSpecialCharsInPrefix = 'my\\ awesome\\,service\\ log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';
        expect(LineProtocol.format(testEvent, configs)).to.equal(eventWithSpecialCharsInPrefix);
        done();
    });
});
