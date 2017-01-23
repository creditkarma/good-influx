# good-influx

[InfluxDB](https://docs.influxdata.com/) broadcasting for Good process monitor, based on [good-http](https://github.com/hapijs/good-http).

![Current Version](https://img.shields.io/npm/v/good-influx.svg)

`Good Influx` will format your Good data according to the [InfluxDB Line Protocol](https://docs.influxdata.com/influxdb/v1.1/write_protocols/line_protocol_tutorial/).

## Usage

`good-influx` is a write stream used to send events to InfluxDB endpoints in batches. It makes a "POST" request with a plain-text payload to the supplied `endpoint`. It will make a final "POST" request to the endpoint to flush the rest of the data on "finish".

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
                metadata: {
                    serviceName: 'SuperAwesomeService'
                }
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
	- `[threshold]` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
  - `[wreck]` - configuration object to pass into [`wreck`](https://github.com/hapijs/wreck#advanced). Defaults to `{ timeout: 60000, headers: {} }`. `content-type` is always "text/plain".
  - `[metadata]` - arbitrary information you would like to include in your InfluxDB stats.  This helps you query InfluxDB for the statistics you want.

## Series

### Error

time | host | pid | error | id | method | url
-----|------|-----|-------|----|--------|----

### Log

time | host | pid | data | tags
-----|------|-----|------|-----

### Ops

time | host | pid | os | proc | <metadata>
-----|------|-----|----|------|-----------

- os includes: `cpu1m`, `cpu5m`, `cpu15m`, `freemem`, `totalmem` and `uptime`
- proc includes: `delay`, `heapTotal`, `heapUsed`, `rss` and `uptime`
- <metadata> includes any decorators you may have added as part of the `metadata` config option above.

### Request

time | host | pid | data | id | method | path | tags
-----|------|-----|------|----|--------|------|-----

### Response

time | host | pid | httpVersion | id | instance | labels | method | path | query |
-----|------|-----|-------------|----|----------|--------|--------|------|-------|

referer | remoteAddress | responseTime | statusCode | userAgent
---------|---------------|--------------|------------|----------

## License

[MIT](LICENSE.txt)
