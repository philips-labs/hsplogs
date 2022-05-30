#!/usr/bin/env node
"use strict";
const rp = require('request-promise-native');

async function oauth2(opts, data) {
  return rp.post(`https://${opts.iam}/authorize/oauth2/token`, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept': 'application/json',
      'api-version': '2',
      'Authorization': `Basic ${opts.client}`
    },
    json: true,
    form: data
  });
}

async function getToken(opts) {
  return oauth2(opts, {
    'grant_type': 'password',
    'username': opts.user,
    'password': opts.pass
  })
}

async function refreshToken(opts, refreshToken) {
  return oauth2(opts, {
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken
  })
}

async function getLogs(token, opts, query) {
  let url = `https://${opts.log}/core/log/${opts.product}/_search?from=0&size=1000`;
  let fetch = async (u, t, q) => {
    return rp.post(u, {
      headers: {
        'api-version': '1',
        'Authorization': `Bearer ${t}`
      },
      json: q
    });
  }
  while (true) {
    let rsp = await fetch(url, token, query);
    // console.log(JSON.stringify(rsp));
    let logs = rsp.hits.map(h => h._source.LogEvent ?
        `${h._source.LogEvent.logTime}\t${h._source.LogEvent.severity}\t${h._source.LogEvent.applicationName}\t${h._source.LogEvent.component}\t${h._source.LogEvent.logData.message}` :
        h._source.msg)
      .join('');
    if (logs)
      console.log(logs);
    let link = rsp.link.find(l => l.relation === 'next');
    if (!link) break;
    url = link.url;
  }
}

async function main(opts) {
  let tokenRsp = await getToken(opts);
  var token = tokenRsp.access_token;
  var timer;
  let wait = function (delay, fn) {
    return new Promise((rs, rj) => timer = setTimeout(rs, delay)).then(fn);
  }, refresh = async function () {
    const refreshRsp = await refreshToken(opts, tokenRsp.refresh_token);
    token = refreshRsp.access_token;
    wait((refreshRsp.expires_in - 5) * 1000, refresh);
  }
  wait((tokenRsp.expires_in - 5) * 1000, refresh);
  let param = {
    "query": {
      "bool": {
        "must": [
          {
            "range": {
              "@timestamp": {
                "gte": 0,
                "lt": 0,
                "format": "epoch_millis"
              }
            }
          }
        ]
      }
    }
  };
  if (opts.message) {
    param.query.bool.must.push({
      "match": {
        "LogEvent.logData.message": opts.message
      }
    })
  }
  for (let i = opts.begin; i < opts.end; i = i + opts.interval) {
    param.query.bool.must[0].range['@timestamp'].gte = i;
    param.query.bool.must[0].range['@timestamp'].lt = i + opts.interval;
    try {
      await getLogs(token, opts, param)
    } catch (e) {
      console.error(e)
    }

  }
  clearTimeout(timer);
}

let opts = require('yargs')
  .option('iam', {
    alias: 'i',
    describe: 'IAM Endpoint',
    demandOption: false,
    default: 'iam-client-test.us-east.philips-healthsuite.com',
    type: 'string'
  })
  .option('client', {
    alias: 'c',
    describe: 'OAuth2 client credential',
    demandOption: true,
    type: 'string'
  })
  .option('user', {
    alias: 'u',
    describe: 'User Name with access to Logs',
    demandOption: true,
    type: 'string'
  })
  .option('pass', {
    alias: 'w',
    describe: 'Password',
    demandOption: true,
    type: 'string'
  })
  .option('log', {
    alias: 'l',
    describe: 'Log Query Endpoint',
    demandOption: false,
    default: 'logquery-client-test.us-east.philips-healthsuite.com',
    type: 'string'
  })
  .option('product', {
    alias: 'p',
    describe: 'Logging product to query',
    demandOption: false,
    default: 'hsdpcdralcon',
    type: 'string'
  })
  .option('message', {
    alias: 'm',
    describe: 'Log message pattern',
    demandOption: false,
    type: 'string'
  })
  .option('begin', {
    alias: 'b',
    describe: 'Beginning timestamp',
    demandOption: true,
    coerce: Date.parse
  })
  .option('end', {
    alias: 'e',
    describe: 'Ending timestamp',
    demandOption: false,
    default: new Date(Date.now()).toISOString(),
    coerce: Date.parse
  })
  .option('interval', {
    alias: 'v',
    describe: 'Interval used to paginate requests',
    demandOption: false,
    default: 5 * 60 * 1000,
    type: 'number'
  })
  .help().argv;

main(opts);
