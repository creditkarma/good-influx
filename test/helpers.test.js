'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Helpers = require('../lib/helpers');

describe('measurementPrefix', () => {
    it('should preserve raw strings', (done) => {
        const config = {
            prefix: 'my-awesome-service-'
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my-awesome-service-');
        done();
    });
    it('should join string arrays with a / by default', (done) => {
        const config = {
            prefix: ['my', 'awesome', 'service']
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my/awesome/service/');
        done();
    });
    it('should join string arrays with a specified delimiter', (done) => {
        const config = {
            prefix: ['my', 'awesome', 'service'],
            prefixDelimiter: '/'
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my/awesome/service/');
        done();
    });
    it('should return an empty string, given an empty config', (done) => {
        const prefix = Helpers.measurementPrefix({});
        expect(prefix).to.equal('');
        done();
    });
    it('should return an empty string, given no config', (done) => {
        const prefix = Helpers.measurementPrefix();
        expect(prefix).to.equal('');
        done();
    });
});
