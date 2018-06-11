'use strict';

const Code = require('code');
const Lab = require('lab');
const Sinon = require('sinon');
const Os = require('os');
const lab = exports.lab = Lab.script();

const describe = lab.describe;
const it = lab.it;
const beforeEach = lab.beforeEach;
const afterEach = lab.afterEach;
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
});

describe('Formatters - tags', () => {
    let sandbox;

    beforeEach((done) => {
        sandbox = Sinon.createSandbox();
        sandbox.stub(Os, 'hostname').returns('test');
        done();
    });

    afterEach((done) => {
        sandbox.restore();
        done();
    });

    it('formats tags with no config', (done) => {
        const config = {};
        const event = {
            pid: 1
        };
        const values = {};

        const tags = Formatters.tags(config, event, values);
        expect(tags).to.equal({
            host: 'test',
            pid: 1
        });

        done();
    });

    it('formats tags with metadata', (done) => {
        const config = {
            metadata: {
                a: 'test',
                b: undefined,
                c: null,
                d: ''
            }
        };
        const event = {
            host: 'host',
            pid: 1
        };
        const values = {};

        const tags = Formatters.tags(config, event, values);
        expect(tags).to.equal({
            host: 'host',
            pid: 1,
            a: 'test'
        });

        done();
    });

    it('formats tags with field tags', (done) => {
        const config = {
            fieldTags: ['a', 'b', 'c']
        };
        const event = {
            host: 'host',
            pid: 1
        };
        const values = {
            a: 'test',
            b: '"test"'
        };

        const tags = Formatters.tags(config, event, values);
        expect(tags).to.equal({
            host: 'host',
            pid: 1,
            a: 'test',
            b: 'test'
        });

        done();
    });
});
