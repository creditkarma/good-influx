# good-influx

[InfluxDB](https://docs.influxdata.com/) broadcasting for Good process monitor, based on [good-http](https://github.com/hapijs/good-http).
It can write to HTTP or UDP Telegraf endpoints.

![Current Version](https://img.shields.io/npm/v/good-influx.svg)
[![Build Status](https://circleci.com/gh/creditkarma/good-influx.svg?style=shield&circle-token=aeb10ab0821c3b83e296d3f2d113c2db68afafc6)](https://circleci.com/gh/creditkarma/good-influx.svg?style=shield&circle-token=aeb10ab0821c3b83e296d3f2d113c2db68afafc6)
[![Greenkeeper badge](https://badges.greenkeeper.io/creditkarma/good-influx.svg)](https://greenkeeper.io/)


`Good Influx` will format your Good data according to the [InfluxDB Line Protocol](https://docs.influxdata.com/influxdb/v1.1/write_protocols/line_protocol_tutorial/).

## Usage

`good-influx` is a write stream used to send events to InfluxDB endpoints in batches. If your `endpoint` is `http://` or `https://`, it makes a "POST" request with a plain-text payload to the supplied `endpoint`. It will make a final "POST" request to the endpoint to flush the rest of the data on "finish".

If the supplied `endpoint` is a `udp://` endpoint then `good-influx` will send the stats via UDP.  This may improve application performance since UDP does not wait for a response.  Though it does fail silently, so you run the risk that your stats are failing to record and you don't know about it.

### Example

```javascript
const Hapi = require('hapi');
const server = new Hapi.Server();
server.connection();

const options = {
	ops: {
	    interval: 1000
	},
    reporters: {
    	// Send only 'ops' events to InfluxDB
        influx: [{
            module: 'good-squeeze',
            name: 'Squeeze',
            args: [{ ops: '*' }]
        }, {
            module: 'good-influx',
            args: ['http://localhost:8086/write?db=good', {
                threshold: 10,
                defaultTags: {
                    serviceName: 'SuperAwesomeService',
                    dataCenter: 'Banff'
                },
                prefix: ['my', 'awesome', 'service']
            }]
        }]
    }
};

server.register({
    register: require('good'),
    options: options
}, (err) => {

    if (err) {
        console.error(err);
    } else {
        server.start(() => {
            console.info('Server started at ' + server.info.uri);
        });
    }
});
```


## Good Influx
### GoodInflux (endpoint, config)

Creates a new GoodInflux object where:

- `endpoint` - full path to remote server's InfluxDB HTTP API end point to transmit InfluxDB statistics (e.g. `http://localhost:8086/write?db=good`)
- `config` - configuration object *(Optional)*
  - `[threshold]` - number of events to hold before transmission. Defaults to `5`. Set to `0` to have every event start transmission instantly.
    - *Note that for UDP, threshold above `5` will be set to `5`.  Why?  Because if UDP packets get too big they fail to transmit.*
  - `[errorThreshold]` - number of erroring message sends to tolerate before the plugin fails.  Default is 0.
  - `[wreck]` - configuration object to pass into [`wreck`](https://github.com/hapijs/wreck#advanced). Defaults to `{ timeout: 60000, headers: {} }`. `content-type` is always "text/plain".
  - `[udpType]` - UDP type; defaults to `udp4`. Probably not necessary to change, but more documentation is available on the [NodeJS Dgram Documentation](https://nodejs.org/api/dgram.html#dgram_dgram_createsocket_type_callback)
  - `[prefix]` - applied to each measurement name. Useful if you want to limit the scope of your measurements to a specific service. You can specify a string, or an array of strings (recommended). Arrays will be joined by *prefixDelimiter* below. For example, using `prefix: ['my', 'awesome', 'service']` the `ops` measurement will be renamed to
  `my/awesome/service/ops`
  - `[prefixDelimiter]` - Used to delimit measurement prefix arrays defined in *prefix* above. Defaults to `/`.
  - `[defaultTags]` - An object which contains default influxdb tags to add to every event.
    - Example: 
    ```js
    defaultTags: {
        version: '1.0.0'
    }
    ```
  - `[defaultFields]` - An object which contains default influxdb fields to add to every event.
    - Example: 
    ```js
    defaultFields: {
        serviceName: 'my-service'
    }
  - `[eventName]` - Either a string or a function. 
    - If it is a string, all events, regardless of what they are actually logged as, will be processed as an event of that name.
      - Example: `eventName: 'test'` will process all events with the schemas defined for `test`.
    - If it is a function, that function is called with the `event` object and then the event will be processed as if it was whatever event name is returned (or the original name if `undefined` is returned).
      - Example: `eventName: (event) => { return event.isMetric ? 'metric' : 'log' }` will process all events with a truthy value of `isMetric` under the `metric` schema, and all other events under the `log` schema.
  - `[schemas]` - An object where the keys are the event names to handle and the values are either a schema or array of schemas. When defining schemas here, they are merged with the default schemas such that if you provide one that exists in the default (such as `ops`), it will overwrite all of those default schemas. See [Schemas](#schemas)
    - Example:
    ```js
    schemas: {
        metrics: myMetricsSchema
        ops: [myOps1Schema, myOps2Schema]
    }
    ```

## Schemas
Good-Influx uses a schema system to determine how to format an event. Each event can have multiple schemas attached to it. While giving you all the fields and some basic examples of how to use them with schemas is helpful, I also strongly suggest looking at the default ones defined in the `schemas` folder to see how they are built and how each type is used.

**NOTE** However you define your schemas, all line items will additionally have `host` and `pid` attached to them.

### Schema Definition
- `[metric]` - The metric to use for this schema. This applies before `prefix` is applied such that if your `prefix` is 'test', `prefixDelimiter` is '/' and your `metric` is 'log', you would have a final metric name of `test/log`.
- `[splitLines]` - This allows you to generate multiple line items from one event and one schema which are similar, but key off an objects keys.
  - `[splitOn]` - This is the base field to split on. This value is retrieved with `_.get`, so you can use dot and array syntax to reach nested fields.
  - `[splitKey]` - This creates a reusable name which can reference the keys you are splitting on.
  - Example
  Given:
  ```js
  event = {
      my: {
          fieldA: {
              data: 'testA'
          },
          fieldB: {
              data: 'testB'
          }
      }
  }
  ```
  I can define:
  ```js
  splitLines: { splitOn: 'my', splitKey: 'field' }
  ```
  This means that for all the tags and fields, I can specify keys like: `${field}Data` and values like `my.${field}.data`. The end result of this definition will be two different line items.
- `[tags]` - An array of [SchemaItems](#schema-item) which will be processed into tags for the line item(s). The `type` field of the SchemaItem is ignored for tags as all tags are processed as a special type of string.
- `[fields]` - An array of [SchemaItems](#schema-item) which will be processed into fields for the line item(s). 

### Schema Item
There are a couple of different items you can define and they behave a little differently.

#### Basic Items
- `[key]` - What name to give this item in the resultant line item. You can use template syntax (`${var}`) to reference any keys from `splitKey` or `arrayKey` which are available.
- `[type]` - How to format the value. Available types are:
  - string
  - int
  - float
  - [iterator](#iterator-items)
  - [object](#object-items)
- `[value]` - Where the value to format lives on the event object. This can also look up keys from `splitKey` and `arrayKey` which are available. You can also use template syntax (`${var}`) to replace values in the path and dot or array syntax to find nested data.
  - Example: If `value` is `my.${field}.data` from the above example, it would fine `testA` in the first line pass and `testB` in the second.
- `[default]` - If the value does not resolve to anything, an optional default value can be defined. *Note: This value should not be pre-formatted to the type and still must be valid for the type defined.*
- `[transform]` - A function which can be specified to transform the value after it is retrieved but before it is formatted. 

#### Iterator Items
Iterator items allow you to process a set of similarly structured data from the event. This is very similar to the concept behind `splitLines` above, but it does not create a new line item for each iteration.
- `[type]` - In this case, you must set type to `iterator`.
- `[iteratorBase]` - The path to the base object you will be iterating over 
- `[itemKey]` - This creates a reusable name which can be used in templating for the resultant fields and their keys.
- `[tags]` - A set of [Schema Item](#schema-item) tags to generate which have access to the `itemKey` for templating their `key` and `value`.
- `[fields]` - A set of [Schema Item](#schema-item) fields to generate which have access to the `itemKey` for templating their `key` and `value`.

#### Object Items
Object items allow you to take things with unknown or arbitrary data and flatten them into your response. This will support any level of nesting and will reduce it to dot notation. As part of the flattening, the data will be formatted to the most appropriate matching type between `string`, `float`, and `int`.

*NOTE: You should still make an attempt to know what your data looks like before using this formatter. Influx only allows one type per field, and once it is set, and lines which attempt to place a different type in that field will just not be logged at all.*

*NOTE: Objects with circular references are automatically truncated*

- `[type]` - In this case, you must set type to `object`.
- `[value]` - The base path to the object you want to flatten.
- `[keyPrefix]` - Allows you to set a prefix for all values that are flattened.
  - Example: If your value resolves to `{ a: 'test' }` and your `keyPrefix` is "data", the resultant field will be `data.a="test"`.

## Built-in Schemas
Please look at the actual schema definitions in the `schemas` folder to see what is captured for each event.
- error
- ops
  - ops
  - ops_requests (multiple lines split on `load.requests`)
  - ops_concurrents (multiple lines split on `load.concurrents`)
  - ops_responseTiems (multiple lines split on `load.responseTimes`)
  - ops_sockets
- log
- request
- response

## License

[MIT](LICENSE.txt)
