# good-influx

[InfluxDB](https://docs.influxdata.com/) broadcasting for Good process monitor, based on [good-http](https://github.com/hapijs/good-http).
It can write to HTTP or UDP Telegraf endpoints.

[![Maintainers Wanted](https://img.shields.io/badge/maintainers-wanted-red.svg)](https://github.com/fhemberger/good-influx/issues/9)
![Current Version](https://img.shields.io/npm/v/good-influx.svg)
[![Build Status](https://travis-ci.org/fhemberger/good-influx.svg?branch=master)](https://travis-ci.org/fhemberger/good-influx)
[![Greenkeeper badge](https://badges.greenkeeper.io/fhemberger/good-influx.svg)](https://greenkeeper.io/)


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
                metadata: {
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
  - `[metadata]` - arbitrary tags you would like to add to your InfluxDB stats.  This helps you query InfluxDB for the statistics you want.
  - `[prefix]` - applied to each measurement name. Useful if you want to limit the scope of your measurements to a specific service. You can specify a string, or an array of strings (recommended). Arrays will be joined by *prefixDelimiter* below. For example, using `prefix: ['my', 'awesome', 'service']` the `ops` measurement will be renamed to
  `my/awesome/service/ops`
  - `[prefixDelimiter]` - Used to delimit measurement prefix arrays defined in *prefix* above. Defaults to `/`.

## Series

### Error

time | host | pid | error | id | method | url
-----|------|-----|-------|----|--------|----

### Log

time | host | pid | data | tags
-----|------|-----|------|-----

### Ops

Each Ops event from the Hapi Good plugin is separated out into 5 events for InfluxDB.  Why?  Because `ops` events are multilayered, so we can't capture the full information in one event.

_Standard tags: host,pid, metadata (optional)_

event             | numEvents | tags       | fields
------------------|-----------|------------|------------------------------------------
ops               | 1         | _Standard_ | os.cpu1m, os.cpu5m, os.cpu15m, os.freemem, os.totalmem, os.uptime, os.totalmem, proc.delay, proc.heapTotal, proc.heapUsed, proc.rss, proc.uptime
ops_requests      | 1 per port|_Standard_ + port| requestsTotal, requestsDisconnects, requests200* -- one field for each status code
ops_concurrents   | 1 per port|_Standard_ + port| concurrents
ops_responseTimes | 1 per port|_Standard_ + port| avg, max
ops_sockets       | 1         |_Standard_| httpTotal, httpsTotal

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
