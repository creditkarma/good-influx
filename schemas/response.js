'use strict';

const _ = require('lodash');

const queryTransform = (value) => {
    return _.map(value, (queryVal, queryKey) => {
        return `${queryKey}=${queryVal}`;
    }).join('&');
};

const response = {
    metric: 'response',
    fields: [
        { key: 'httpVersion', type: 'string', value: 'httpVersion' },
        { key: 'id', type: 'string', value: 'id' },
        { key: 'instance', type: 'string', value: 'instance' },
        { key: 'labels', type: 'string', value: 'labels' },
        { key: 'method', type: 'string', value: 'method', transform: _.toUpper },
        { key: 'path', type: 'string', value: 'path' },
        { key: 'query', type: 'string', value: 'query', transform: queryTransform },
        { key: 'referer', type: 'string', value: 'source.referer' },
        { key: 'remoteAddress', type: 'string', value: 'source.remoteAddress' },
        { key: 'responseTime', type: 'int', value: 'responseTime' },
        { key: 'statusCode', type: 'int', value: 'statusCode' },
        { key: 'userAgent', type: 'string', value: 'source.userAgent' }
    ]
};

module.exports = response;
