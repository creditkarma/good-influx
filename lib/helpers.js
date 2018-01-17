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

const isFunction = (v) => typeof v === 'function';

const commonItems = (a, b) => {
    if (Array.isArray(a) && Array.isArray(b)) {
        const aSet = new Set(a);
        return b.filter((item) => aSet.has(item));
    }
    return [];
};

const firstCommonItem = (a, b) => {
    const items = commonItems(a, b);
    return items.length > 0 ? items[0] : undefined;
};

module.exports = {
    measurementPrefix,
    isFunction,
    commonItems,
    firstCommonItem
};
