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
    event: 'log',
    host: 'mytesthost',
    timestamp: 1485996802647,
    tags: ['info', 'request'],
    data: 'Things are good',
    pid: 1234
};

const msgWithMetadata = 'log,host=mytesthost,pid=1234,testing=superClutch,version=0 data="Things are good",tags="info,request" 1485996802647000000';
const msgWithoutMetadata = 'log,host=mytesthost,pid=1234 data="Things are good",tags="info,request" 1485996802647000000';

/**
 * Checking that the events sent to InfluxDB are formatted properly.
 * Also checking that correct number of events are sent.
 *
 * @param [String] responseData
 * @param [Number] expectedEvents
 */
const validateResponses = (responseData, expectedEvents, expectedMessage) => {
    const expectedLength = expectedEvents || 25;
    const dataRows = responseData.split('\n');

    expect(dataRows.length).to.equal(expectedLength);
    dataRows.forEach((datum) => {
        expect(datum).to.equal(expectedMessage);
    });
};

const mocks = {
    readStream() {
        const result = new Stream.Readable({ objectMode: true });
        // Need to overwrite this function. For some reason all it does is Error('not implemented').
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
                validateResponses(data, 5, expectedMsg);

                res.end();
                if (hitCount >= 2) {
                    server.close(done);
                }
            });
        });

        return server;
    },

    getUdpServer(expectedNumberOfEvents, expectedMsg, done) {
        let hitCount = 0;
        const server = Dgram.createSocket('udp4');
        server.on('message', (msg) => {
            hitCount += 1;
            validateResponses(msg.toString(), expectedNumberOfEvents, expectedMsg);

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
    describe('HTTP URL =>', () => {
        it('Sends events in a stream to HTTP server', (done) => {
            const server = mocks.getHttpServer(msgWithMetadata, done);
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
    });

    describe('UDP URL =>', () => {
        it('Threshold not set => Sends 5 events in a stream to UDP server', (done) => {
            const server = mocks.getUdpServer(5, msgWithMetadata, done);
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

        it('Threshold of 3 => Sends 3 events in a stream to UDP server', (done) => {
            const server = mocks.getUdpServer(3, msgWithoutMetadata, done);
            const stream = mocks.readStream();

            server.on('listening', () => {
                const reporter = new GoodInflux(mocks.getUri(server, 'udp'), {
                    threshold: 3
                });

                stream.pipe(reporter);

                // Important to send 6 events. Threshold is 3, so two batches of events are sent.
                // Sending two batches proves that the callback is being passed properly to this._udpClient.send.
                for (let i = 0; i < 6; i += 1) {
                    stream.push(testEvent);
                }
            });
        });

        it('Threshold of 13 => Sends 5 events in a stream to UDP server', (done) => {
            const server = mocks.getUdpServer(5, msgWithoutMetadata, done);
            const stream = mocks.readStream();

            server.on('listening', () => {
                const reporter = new GoodInflux(mocks.getUri(server, 'udp'), {
                    threshold: 13
                });

                stream.pipe(reporter);

                // Important to send 10 events. Threshold is 5, so two batches of events are sent.
                // Sending two batches proves that the callback is being passed properly to this._udpClient.send.
                for (let i = 0; i < 10; i += 1) {
                    stream.push(testEvent);
                }
            });
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
        const server = mocks.getHttpServer(msgWithMetadata, done);
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
