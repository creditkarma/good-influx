'use strict';

const _ = require('lodash');

const error = {
    metric: 'error',
    fields: [
        { key: 'error.name', type: 'string', value: 'error.name' },
        { key: 'error.message', type: 'string', value: 'error.message' },
        { key: 'error.stack', type: 'string', value: 'error.stack' },
        { key: 'error.statusCode', type: 'string', value: 'error.output.statusCode' },
        { type: 'object', value: 'error.data', keyPrefix: 'error' },
        { key: 'id', type: 'string', value: 'id' },
        { key: 'url', type: 'url', value: 'url' },
        { key: 'method', type: 'string',  value: 'method', transform: _.toUpper },
        { key: 'tags', type: 'string', value: 'tags' }
    ]
};

module.exports = error;
