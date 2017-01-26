'use strict'

const GoodInflux = require('../lib/influx-http')

const Stream = require('stream')
const Http = require('http')

const Code = require('code')
const Lab = require('lab')
const lab = exports.lab = Lab.script()

const describe = lab.describe
const it = lab.it
const expect = Code.expect

const testEvent = {
    event: 'ops',
    timestamp: 123456789,
    host: 'mytesthost',
    pid: 9876,
    os: {
        load: [ 1.8408203125, 1.44287109375, 1.15234375 ],
        mem: {
            total: 6089818112,
            free: 162570240 },
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
}

const mocks = {
    readStream() {
        const result = new Stream.Readable({ objectMode: true })
        // Need to overwrite this function. For some reason all it does is Error('not implemented')  Very helpful, no?
        /* eslint-disable no-empty-function */
        result._read = () => {}
        return result
    },

    getUri(server) {
        const address = server.address()
        return `http://${address.address}:${address.port}`
    },

    getServer(done) {
        const server = Http.createServer((req, res) => {
            let data = ''

            req.on('data', (chunk) => {
                data += chunk
            })
            req.on('end', () => {
                const dataRows = data.split('\n')
                expect(dataRows.length).to.be.greaterThan(1)

                dataRows.forEach((datum) => {
                    /* eslint max-len: ["error", 880, 4] */
                    expect(datum).to.equal('ops,host=mytesthost,pid=9876 os.cpu1m=1.8408203125,os.cpu5m=1.44287109375,os.cpu15m=1.15234375,os.freemem=162570240i,os.totalmem=6089818112i,os.uptime=11546i,proc.delay=0.07090700045228004,proc.heapTotal=41546080i,proc.heapUsed=27708712i,proc.rss=55812096i,proc.uptime=18.192,testing="superClutch" 123456789000000')
                })

                res.end()
                server.close(done)
            })
        })

        return server
    }
}

describe('InfluxHttp', () => {
    it('Sends events in a stream', (done) => {
        const server = mocks.getServer(done)

        const stream = mocks.readStream()

        server.listen(0, '127.0.0.1', () => {
            const reporter = new GoodInflux(mocks.getUri(server), {
                threshold: 5,
                metadata: { testing: 'superClutch' }
            })

            stream.pipe(reporter)

            for (let i = 0; i < 5; i += 1) {
                stream.push(testEvent)
            }
        })
    })
})
