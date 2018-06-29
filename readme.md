# Schedule Change

Microservice to fetch schedule of an event and send changes to Discord webhook.

This app is intended to be used with [Serverless Framework with AWS Lambda](https://serverless.com/framework/docs/providers/aws/guide/quick-start/).

## Deploy

First setup `.env` file in this directory.

For example, for GDQ's donation tracker,

```conf
EVENT_NAME=SGDQ2018             # name as you like
OUTPUT_WEBHOOK="https://..."    # main output of schedule changes
SYSTEM_WEBHOOK="https://..."    # system info output (errors etc)
TRACKER_EVENT_ID=12             # tracker's event ID
TRACKER_URL="https://..."       # tracker's endpoint
# ... and any custom environment variables
```

Then deploy with

```bash
sls deploy -s MYEVENT2050
```

## Invoke

It runs every 6 minutes, but you can manually invoke the function

```bash
sls invoke [local] -f run -s MYEVENT2050
```

Adding local runs the function in local machine.
