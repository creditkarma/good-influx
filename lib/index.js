'use strict'

const Stream = require('stream')
const Os = require('os')
const Url = require('url')
const Hoek = require('hoek')
const Wreck = require('wreck')
const LineProtocol = require('./line-protocol')

const internals = {
    defaults: {
        threshold: 20,
        errorThreshold: 0,
        // TODO: Necessary?
        // schema: 'good-http',
        metadata: false,
        wreck: {
            timeout: 60000,
            headers: {}
        }
    },
    host: Os.hostname()
}

class GoodInflux extends Stream.Writable {
    constructor(endpoint, config) {
        config = config || {}
        const settings = Object.assign({}, internals.defaults, config)

        if (settings.errorThreshold === null) {
            settings.errorThreshold = -Infinity
        }

        super({ objectMode: true, decodeStrings: false })
        this._settings = settings
        this._endpoint = endpoint
        this._data = []
        this._failureCount = 0

        this.once('finish', () => {
            this._sendMessages()
        })
    }

    _write(data, encoding, callback) {

        this._data.push(data);
        if (this._data.length >= this._settings.threshold) {
            this._sendMessages((err) => {

                if (err && this._failureCount < this._settings.errorThreshold) {
                    this._failureCount++;
                    return callback();
                }

                this._data = [];
                this._failureCount = 0;

                return callback(this._settings.errorThreshold !== -Infinity && err);
            });
        }
        else {
            setImmediate(callback);
        }
    }

    _sendMessages(callback) {
        const payload = this._data
            .map((event) => LineProtocol.format(event, this._settings))
            .join('\n')

        const endpointUrl = Url.parse(this._endpoint)
        if (endpointUrl.protocol === 'udp:') {
            this._sendViaUdp(payload)
        } else if (endpointUrl.protocol === 'http:' || endpointUrl.protocol === 'https:') {
            this._sendViaHttp(payload, callback)
        } else {
            throw (`Unsupported protocol ${endpointUrl.protocol}. Supported protocols are udp, http or https`)
        }
    }

    _sendViaHttp(payload, callback) {
        const wreckOptions = { payload }

        Hoek.merge(wreckOptions, this._settings.wreck, false)

        // Prevent this from user tampering
        wreckOptions.headers['content-type'] = 'text/plain'
        Wreck.request('post', this._endpoint, wreckOptions, callback)
    }

    _sendViaUdp(payload) {
        throw ('Not implemented')
    }
}

module.exports = GoodInflux
