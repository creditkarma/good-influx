'use strict';

const GoodInflux = require('../lib/index');

const Hoek = require('hoek');

const Stream = require('stream');
const Http = require('http');
const Dgram = require('dgram');

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const testEvent = {
    event: 'ops',
    timestamp: 123456789,
    host: 'mytesthost',
    pid: 9876,
    os: {
        load: [1.8408203125, 1.44287109375, 1.15234375],
        mem: {
            total: 6089818112,
            free: 162570240
        },
        uptime: 11546
    },
    proc: {
        uptime: 18.192,
        mem: {
            rss: 55812096,
            heapTotal: 41546080,
            heapUsed: 27708712
        },
        delay: 0.07090700045228004
    },
    load: {
        requests: {},
        concurrents: { '8080': 0 },
        responseTimes: {}
    }
};
/* eslint max-len: ["error", 440, 4] */
const expectedMessage = 'ops,host=mytesthost,pid=9876,testing="superClutch",version="0",name="" os.cpu1m=1.8408203125,os.cpu5m=1.44287109375,os.cpu15m=1.15234375,os.freemem=162570240i,os.totalmem=6089818112i,os.uptime=11546i,proc.delay=0.07090700045228004,proc.heapTotal=41546080i,proc.heapUsed=27708712i,proc.rss=55812096i,proc.uptime=18.192 123456789000000';
const msgWithoutMetadata = 'ops,host=mytesthost,pid=9876 os.cpu1m=1.8408203125,os.cpu5m=1.44287109375,os.cpu15m=1.15234375,os.freemem=162570240i,os.totalmem=6089818112i,os.uptime=11546i,proc.delay=0.07090700045228004,proc.heapTotal=41546080i,proc.heapUsed=27708712i,proc.rss=55812096i,proc.uptime=18.192 123456789000000';

const mocks = {
    readStream() {
        const result = new Stream.Readable({ objectMode: true });
        // Need to overwrite this function. For some reason all it does is Error('not implemented')  Very helpful, no?
        /* eslint-disable no-empty-function */
        result._read = () => { };
        return result;
    },

    getUri(server, protocol) {
        const address = server.address();
        return `${protocol}://${address.address}:${address.port}`;
    },

    getHttpServer(expectedMsg, done) {
        let hitCount = 0;
        const server = Http.createServer((req, res) => {
            let data = '';

            req.on('data', (chunk) => {
                data += chunk;
            });
            req.on('end', () => {
                hitCount += 1;
                const dataRows = data.split('\n');

                // Because threshold is 5, expect 5 events to be sent at a time
                expect(dataRows.length).to.equal(5);
                dataRows.forEach((datum) => {
                    expect(datum).to.equal(expectedMsg);
                });

                res.end();
                if (hitCount >= 2) {
                    server.close(done);
                }
            });
        });

        return server;
    },

    getUdpServer(done) {
        let hitCount = 0;
        const server = Dgram.createSocket('udp4');
        server.on('message', (msg) => {
            hitCount += 1;
            const splitMessage = msg.toString().split('\n');

            // Because threshold is 5, expect 5 events to be sent at a time
            expect(splitMessage.length).to.equal(5);
            splitMessage.forEach((msgRow) => {
                expect(msgRow).to.equal(expectedMessage);
            });
            if (hitCount >= 2) {
                server.close(done);
            }
        });
        server.bind(9876, '127.0.0.1');
        return server;
    }
};

const Options = {
    threshold: 5,
    metadata: {
        testing: 'superClutch',
        version: 0,
        name: ''
    }
};

describe('GoodInflux', () => {
    it('Http URL => Sends events in a stream to HTTP server', (done) => {
        const server = mocks.getHttpServer(expectedMessage, done);
        const stream = mocks.readStream();

        server.listen(0, '127.0.0.1', () => {
            const reporter = new GoodInflux(mocks.getUri(server, 'http'), Options);

            stream.pipe(reporter);

            // Important to send 10 events. Threshold is 5, so two batches of events are sent.
            // Sending two batches proves that the callback is being passed properly to Wreck.request.
            for (let i = 0; i < 10; i += 1) {
                stream.push(testEvent);
            }
        });
    });

    it('Udp URL => Sends events in a stream to UDP server', (done) => {
        const server = mocks.getUdpServer(done);
        const stream = mocks.readStream();

        server.on('listening', () => {
            const reporter = new GoodInflux(mocks.getUri(server, 'udp'), Options);

            stream.pipe(reporter);

            // Important to send 10 events. Threshold is 5, so two batches of events are sent.
            // Sending two batches proves that the callback is being passed properly to this._udpClient.send.
            for (let i = 0; i < 10; i += 1) {
                stream.push(testEvent);
            }
        });
    });

    it('Unsupported protocol => throw error', (done) => {
        expect(() => {
            return new GoodInflux('ftp://abcd:1234', {});
        }).to.throw(Error, 'Unsupported protocol ftp:. Supported protocols are udp, http or https');
        done();
    });

    it('Omit metadata when not defined', (done) => {
        const server = mocks.getHttpServer(msgWithoutMetadata, done);
        const stream = mocks.readStream();

        server.listen(0, '127.0.0.1', () => {
            const reporter = new GoodInflux(mocks.getUri(server, 'http'), {
                threshold: 5
            });

            stream.pipe(reporter);

            // Important to send 10 events. Threshold is 5, so two batches of events are sent.
            // Sending two batches proves that the callback is being passed properly to Wreck.request.
            for (let i = 0; i < 10; i += 1) {
                stream.push(testEvent);
            }
        });
    });

    it('Omit metadata when empty', (done) => {
        const server = mocks.getHttpServer(msgWithoutMetadata, done);
        const stream = mocks.readStream();

        server.listen(0, '127.0.0.1', () => {
            const reporter = new GoodInflux(mocks.getUri(server, 'http'), {
                threshold: 5,
                metadata: {}
            });

            stream.pipe(reporter);

            // Important to send 10 events. Threshold is 5, so two batches of events are sent.
            // Sending two batches proves that the callback is being passed properly to Wreck.request.
            for (let i = 0; i < 10; i += 1) {
                stream.push(testEvent);
            }
        });
    });

    it('Omit undefined metadata', (done) => {
        const server = mocks.getHttpServer(expectedMessage, done);
        const stream = mocks.readStream();

        const opts = Hoek.clone(Options);
        opts.metadata.notDefined = undefined;
        opts.metadata.isNull = null;

        server.listen(0, '127.0.0.1', () => {
            const reporter = new GoodInflux(mocks.getUri(server, 'http'), opts);

            stream.pipe(reporter);

            // Important to send 10 events. Threshold is 5, so two batches of events are sent.
            // Sending two batches proves that the callback is being passed properly to Wreck.request.
            for (let i = 0; i < 10; i += 1) {
                stream.push(testEvent);
            }
        });
    });
});
