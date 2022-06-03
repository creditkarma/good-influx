'use strict';

const Code = require('@hapi/code');
const Lab = require('@hapi/lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Formatters = require('../lib/formatters');

describe('Formatters - Int', () => {
    it('formats an integer', () => {
        expect(Formatters.Int(1)).to.equal('1i');
    });

    it('formats a float', () => {
        expect(Formatters.Int(1.1)).to.equal('1i');
    });

    it('formats a string', () => {
        expect(Formatters.Int('1')).to.equal('1i');
    });

    it('does not format a non-number', () => {
        expect(Formatters.Int('a')).to.equal(undefined);
    });
});

describe('Formatters - String', () => {
    it('formats a basic string', () => {
        expect(Formatters.String('test')).to.equal('"test"');
    });

    it('formats a object', () => {
        expect(Formatters.String({ a: 'test' })).to.equal('"{\\"a\\":\\"test\\"}"');
    });

    it('formats an array', () => {
        expect(Formatters.String(['a','b'])).to.equal('"a,b"');
    });

    it('formats a string with newlines', () => {
        expect(Formatters.String('test\r\ntest')).to.equal('"test\\ntest"');
    });
});

describe('Formatters - Measurement', () => {
    it('formats a measurement', () => {
        expect(Formatters.Measurement('t,e st')).to.equal('t\\,e\\ st');
    });
});

describe('Formatters - Flatten', () => {
    it('flatten a nested object', () => {
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
    });

    it('flatten a nested object no prefix', () => {
        const data = {
            a: 'test'
        };
        const flatData = Formatters.Flatten(data, '');

        expect(flatData.a).to.equal('\"test\"');
    });

    it('flatten a string', () => {
        const data = 'string';
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('\"string\"');
    });

    it('flatten an array', () => {
        const data = ['test', 'array'];
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('\"test,array\"');
    });

    it('flatten a number', () => {
        const data = 5;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal('5i');
    });

    it('flatten a float', () => {
        const data = 5.1;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.equal(5.1);
    });

    it('flatten undefined', () => {
        const data = undefined;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.be.undefined();
    });

    it('flatten null', () => {
        const data = null;
        const flatData = Formatters.Flatten(data);

        expect(flatData.data).to.be.undefined();
    });

    it('flatten an object with circular reference', () => {
        const data = {
            a: 'test'
        };
        data.self = data;
        const flatData = Formatters.Flatten(data);

        expect(flatData['data.a']).to.equal('\"test\"');
        expect(flatData['data.self']).to.equal('\"...omitted (circular reference detected)...\"');
    });

    it('flatten a complex object with circular reference', () => {
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
    });
});
