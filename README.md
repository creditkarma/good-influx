# good-influx

InfluxDB broadcasting for Good process monitor, based on [good-http](https://github.com/hapijs/good-http).

![Current Version](https://img.shields.io/npm/v/good-influx.svg)

## Usage

`good-influx` is a write stream use to send event to remote endpoints in batches. It makes a "POST" request with a plain-text payload to the supplied `endpoint`. It will make a final "POST" request to the endpoint to flush the rest of the data on "finish".

## Good Influx
### GoodInflux (endpoint, config)

Creates a new GoodInflux object where:

- `endpoint` - full path to remote server's HTTP API end point to transmit logs (e.g. `http://localhost:8086/write?db=good`)
- `config` - configuration object
	- `[threshold]` - number of events to hold before transmission. Defaults to `20`. Set to `0` to have every event start transmission instantly. It is strongly suggested to have a set threshold to make data transmission more efficient.
  - `[wreck]` - configuration object to pass into [`wreck`](https://github.com/hapijs/wreck#advanced). Defaults to `{ timeout: 60000, headers: {} }`. `content-type` is always "text/plain".


## Series

### Error

time | host | pid | error | id | method | url
-----|------|-----|-------|----|--------|----

### Log

time | host | pid | data | tags
-----|------|-----|------|-----

### Ops

time | host | pid | os | proc
-----|------|-----|----|-----

- os includes: `cpu1m`, `cpu5m`, `cpu15m`, `freemem`, `totalmem` and `uptime`
- proc includes: `delay`, `heapTotal`, `heapUsed`, `rss` and `uptime`

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
