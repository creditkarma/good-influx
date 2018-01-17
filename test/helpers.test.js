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

describe('firstCommonItem', () => {
    it('undefined if input is not array', (done) => {
        const a = [1,2,3];
        const b = 4;
        const result = Helpers.firstCommonItem(a, b);
        expect(result).to.be.undefined();
        done();
    });
    it('undefined if input is not array', (done) => {
        const b = [1,2,3];
        const a = 4;
        const result = Helpers.firstCommonItem(a, b);
        expect(result).to.be.undefined();
        done();
    });
    it('undefind if inputs have no common item', (done) => {
        const a = [1,2,3];
        const b = [4];
        const result = Helpers.firstCommonItem(a, b);
        expect(result).to.be.undefined();
        done();
    });
    it('should return first common item in b', (done) => {
        const a = [1,2,3];
        const b = [2,3,4];
        const result = Helpers.firstCommonItem(a, b);
        expect(result).to.equal(2);
        done();
    });
    it('should return first common item in b', (done) => {
        const a = [3,2,1];
        const b = [2,3,4];
        const result = Helpers.firstCommonItem(a, b);
        expect(result).to.equal(2);
        done();
    });

});
