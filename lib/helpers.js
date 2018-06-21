'use strict';

/**
 * Extracts the measurement prefix from the configuration.
 */
const measurementPrefix = (config) => {

    config = config || {};
    const prefix = config.prefix;
    let delimiter = config.prefixDelimiter;

    let result = '';
    if (Array.isArray(prefix)) {
        if (typeof delimiter !== 'string') {
            delimiter = '/';
        }
        result = `${prefix.join(delimiter)}${delimiter}`;
    }
    else if (typeof prefix === 'string') {
        result = prefix;
    }
    return result;
};

module.exports = {
    measurementPrefix
};
