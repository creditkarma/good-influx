'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Formatters = require('../lib/formatters');

describe('Formatters - Int', () => {
    it('formats an integer', (done) => {
        expect(Formatters.Int(1)).to.equal('1i');
        done();
    });

    it('formats a float', (done) => {
        expect(Formatters.Int(1.1)).to.equal('1i');
        done();
    });

    it('formats a string', (done) => {
        expect(Formatters.Int('1')).to.equal('1i');
        done();
    });

    it('does not format a non-number', (done) => {
        expect(Formatters.Int('a')).to.equal(undefined);
        done();
    });
});

describe('Formatters - String', () => {
    it('formats a basic string', (done) => {
        expect(Formatters.String('test')).to.equal('"test"');
        done();
    });

    it('formats a object', (done) => {
        expect(Formatters.String({ a: 'test' })).to.equal('"{\\"a\\":\\"test\\"}"');
        done();
    });

    it('formats an array', (done) => {
        expect(Formatters.String(['a','b'])).to.equal('"a,b"');
        done();
    });

    it('formats a string with newlines', (done) => {
        expect(Formatters.String('test\r\ntest')).to.equal('"test\\ntest"');
        done();
    });
});

describe('Formatters - Measurement', () => {
    it('formats a measurement', (done) => {
        expect(Formatters.Measurement('t,e st')).to.equal('t\\,e\\ st');
        done();
    });
});

describe('Formatters - Flatten', () => {
    it('flatten a nested object', (done) => {
        const data = {
            a: {
                b: 'test'
            },
            c: 5,
            d: 5.1,
            e: ['test', 'array'],
            f: 'string',
            g: undefined
        };
        const flatData = Formatters.Flatten(data);

        expect(flatData['data.a.b']).to.equal('\"test\"');
        expect(flatData['data.c']).to.equal('5i');
        expect(flatData['data.d']).to.equal(5.1);
        expect(flatData['data.e']).to.equal('\"test,array\"');
        expect(flatData['data.f']).to.equal('\"string\"');
        expect(flatData['data.g']).to.not.exist();
        done();
    });

    it('flatten a nested object no prefix', (done) => {
        const data = {
            a: 'test'
        };
        const flatData = Formatters.Flatten(data, '');

        expect(flatData.a).to.equal('\"test\"');
        done();
    });

    it('flatten a string', (done) => {
        const data = 'string';
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('\"string\"');
        done();
    });

    it('flatten an array', (done) => {
        const data = ['test', 'array'];
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('\"test,array\"');
        done();
    });

    it('flatten a number', (done) => {
        const data = 5;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('5i');
        done();
    });

    it('flatten a float', (done) => {
        const data = 5.1;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal(5.1);
        done();
    });

    it('flatten undefined', (done) => {
        const data = undefined;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.be.undefined();
        done();
    });

    it('flatten null', (done) => {
        const data = null;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.be.undefined();
        done();
    });

    it('flatten an object with circular reference', (done) => {
        const data = {
            a: 'test'
        };
        data.self = data;
        const flatData = Formatters.Flatten(data);

        expect(flatData['data.a']).to.equal('\"test\"');
        expect(flatData['data.self']).to.equal('\"...omitted (circular reference detected)...\"');
        done();
    });

    it('flatten a complex object with circular reference', (done) => {
        const data = {
            a: 'test',
            b: {
                c: 'test',
                d: {}
            }
        };
        data.b.d.circular = data;
        const flatData = Formatters.Flatten(data);

        expect(flatData['data.a']).to.equal('\"test\"');
        expect(flatData['data.b.c']).to.equal('\"test\"');
        expect(flatData['data.b.d.circular']).to.equal('\"...omitted (circular reference detected)...\"');
        done();
    });
});
