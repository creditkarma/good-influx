'use strict';

const Code = require('code');
const Lab = require('lab');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const expect = Code.expect;

const Formatters = require('../lib/formatters');

describe('Formatters - Flatten', () => {
    it('flatten a nested object', (done) => {
        const data = {
            a: {
                b: 'test'
            },
            c: 5,
            d: 5.1,
            e: ['test', 'array'],
            f: 'string'
        };
        const flatData = Formatters.Flatten(data);

        expect(flatData['data.a.b']).to.equal('\"test\"');
        expect(flatData['data.c']).to.equal('5i');
        expect(flatData['data.d']).to.equal(5.1);
        expect(flatData['data.e']).to.equal('\"test,array\"');
        expect(flatData['data.f']).to.equal('\"string\"');
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
});
