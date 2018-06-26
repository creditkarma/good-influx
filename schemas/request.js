'use strict';

const _ = require('lodash');

const request = {
    metric: 'request',
    fields: [
        { type: 'object', value: 'data' },
        { key: 'id', type: 'string', value: 'id' },
        { key: 'method', type: 'string',  value: 'method', transform: _.toUpper },
        { key: 'path', type: 'string',  value: 'path' },
        { key: 'tags', type: 'string', value: 'tags' }
    ]
};

module.exports = request;
