'use strict';

/**
 * Converts event data to InfluxDB line protocol
 * https://docs.influxdata.com/influxdb/v1.2/write_protocols/line_protocol_tutorial/
 */

// Load modules
const _ = require('lodash');
const Os = require('os');
const Url = require('url');
const Helpers = require('./helpers');

const Formatters = require('./formatters');

const formatSchema = (event, schema, config) => {
    const lines = [];
    if (schema.splitLines) {
        const base = _.get(event, schema.splitLines.splitOn);
        Object.keys(base).forEach((key) => {
            const dataObj = {};
            if (schema.splitLines.splitKey) {
                dataObj[schema.splitLines.splitKey] = key;
            }

            const chunk = formatSchemaChunk(event, schema, config, dataObj);

            if (chunk) {
                lines.push(chunk);
            }
        });
    }
    else {
        const chunk = formatSchemaChunk(event, schema, config, {});

        if (chunk) {
            lines.push(chunk);
        }
    }

    return lines;
};

const formatSchemaChunk = (event, schema, config, data) => {
    const timestamp = event.timestamp;
    let metric = schema.metric;
    let tags = {
        host: event.host || Os.hostname(),
        pid: event.pid
    };
    let fields = formatData(event, schema.fields, data, false);

    fields = _.omitBy(fields, _.isUndefined);

    if (_.isEmpty(fields)) {
        return;
    }

    if (schema.tags) {
        Object.assign(tags, formatData(event, schema.tags, data, true));
    }

    if (config.defaultFields) {
        fields = Object.assign({},
            Formatters.Flatten(config.defaultFields, ''),
            fields
        );
    }

    if (config.defaultTags) {
        tags = Object.assign({},
            config.defaultTags,
            tags
        );
    }
    tags = _.omitBy(tags, _.isUndefined);
    fields = _.omitBy(fields, _.isUndefined);

    const prefix = Helpers.measurementPrefix(config);
    metric = Formatters.Measurement(`${prefix}${metric}`);

    const serializedFields = Formatters.serialize(fields);

    // Tag set
    const serializedTags = Formatters.serialize(tags);

    const eventValue = `${metric},${serializedTags} ${serializedFields} ${timestamp}000000`;
    return eventValue;
};

const formatData = (event, dataSchema, templateVars, isTag) => {
    let resultData = {};
    templateVars = templateVars || {};

    dataSchema.forEach((schemaItem) => {
        let key;
        let value;

        if (schemaItem.key) {
            key = _.template(schemaItem.key)(templateVars);
        }

        if (schemaItem.value) {
            const valuePath = _.template(schemaItem.value)(templateVars);
            value = _.get(event, valuePath);

            // Allow retrieving a name from the stored keys
            if (value === undefined) {
                value = _.get(templateVars, valuePath);
            }

            if (value === undefined && schemaItem.default !== undefined) {
                value = schemaItem.default;
            }

            if (value !== undefined && typeof schemaItem.transform === 'function') {
                value = schemaItem.transform(value);
            }
        }

        if (isTag) {
            if (value !== undefined) {
                resultData[Formatters.TagKV(key)] = Formatters.TagKV(value);
            }

            return;
        }

        switch (schemaItem.type) {
            case 'url':
                if (value !== undefined) {
                    resultData[key] = Formatters.String(Url.format(value));
                }
                break;
            case 'string':
                if (value !== undefined) {
                    resultData[key] = Formatters.String(value);
                }
                break;
            case 'int':
                if (isNaN(value) && schemaItem.default !== undefined) {
                    value = schemaItem.default;
                }
                if (value !== undefined && !isNaN(value)) {
                    resultData[key] = Formatters.Int(value);
                }
                break;
            case 'float':
                if (isNaN(value) && schemaItem.default !== undefined) {
                    value = schemaItem.default;
                }
                if (value !== undefined && !isNaN(value)) {
                    resultData[key] = +value;
                }
                break;
            case 'iterator':
                if (schemaItem.iteratorBase) {
                    const baseSelector = _.template(schemaItem.iteratorBase)(templateVars);
                    const base = _.get(event, baseSelector);

                    Object.keys(base).forEach((iteratorKey) => {
                        const newTemplateVars = Object.assign({}, templateVars);
                        if (schemaItem.itemKey) {
                            newTemplateVars[schemaItem.itemKey] = iteratorKey;
                        }
                        resultData = Object.assign({},
                            resultData,
                            formatData(event, schemaItem.fields, newTemplateVars)
                        );
                    });
                }
                break;
            case 'object':
                if (value !== undefined) {
                    resultData = Object.assign({},
                        resultData,
                        Formatters.Flatten(value, schemaItem.keyPrefix)
                    );
                }
                break;
        }
    });

    return resultData;
};

module.exports.format = (event, config, schemas) => {
    let lines = [];
    let eventName = event.event;

    if (config.eventName) {
        if (typeof config.eventName === 'string') {
            eventName = config.eventName;
        }
        else if (typeof config.eventName === 'function') {
            eventName = config.eventName(event) || event.event;
        }
    }

    const matchingSchemas = schemas[eventName];

    if (matchingSchemas) {
        if (Array.isArray(matchingSchemas)) {
            matchingSchemas.forEach((schema) => {
                lines = lines.concat(formatSchema(event, schema, config));
            });
        }
        else {
            lines = lines.concat(formatSchema(event, matchingSchemas, config));
        }
    }

    return lines;
};
