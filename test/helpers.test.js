'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Helpers = require('../lib/helpers');

describe('measurementPrefix', () => {
    it('should preserve raw strings', () => {
        const config = {
            prefix: 'my-awesome-service-'
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my-awesome-service-');
    });

    it('should join string arrays with a / by default', () => {
        const config = {
            prefix: ['my', 'awesome', 'service']
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my/awesome/service/');
    });

    it('should join string arrays with a specified delimiter', () => {
        const config = {
            prefix: ['my', 'awesome', 'service'],
            prefixDelimiter: '/'
        };
        const prefix = Helpers.measurementPrefix(config);

        expect(prefix).to.equal('my/awesome/service/');
    });

    it('should return an empty string, given an empty config', () => {
        const prefix = Helpers.measurementPrefix({});
        expect(prefix).to.equal('');
    });

    it('should return an empty string, given no config', () => {
        const prefix = Helpers.measurementPrefix();
        expect(prefix).to.equal('');
    });
});
