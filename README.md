# hsplogs

## Usage

```
Options:
  --version       Show version number                                  [boolean]
  --iam, -i       IAM Endpoint
           [string] [default: "iam-client-test.us-east.philips-healthsuite.com"]
  --client, -c    OAuth2 client credential                   [string] [required]
  --user, -u      User Name with access to Logs              [string] [required]
  --pass, -w      Password                                   [string] [required]
  --log, -l       Log Query Endpoint
      [string] [default: "logquery-client-test.us-east.philips-healthsuite.com"]
  --product, -p   Logging product to query    [string] [default: "hsdpcdralcon"]
  --message, -m   Log message pattern                                   [string]
  --begin, -b     Beginning timestamp                                 [required]
  --end, -e       Ending timestamp         [default: "2021-12-13T11:49:11.446Z"]
  --interval, -v  Interval used to paginate requests  [number] [default: 300000]
  --help          Show help                                            [boolean]
```

## Examples
`npx hsplogs -c 'Base64 encoded <client:secret>' -u 'hsp_login@noname.cc' -w '<password>' -p '<product_name> -m 'message pattern' -b '2021-12-01T00:00:00Z'`