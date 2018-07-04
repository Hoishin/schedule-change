# Schedule Change

Microservice to fetch speedrunning events schedule and notify changes to Discord webhook. Made for language restreamers.

Written in TypeScript. Run `yarn build` to compile.

This app is designed to be used with [AWS Lambda with Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/quick-start/).

The `main.js` file exposes the API after compiling.

## Deploy to AWS Lambda

First setup `.env` file in this directory. It will be available in runtime with `dotenv`.

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

It runs every 6 minutes by default, but you can manually invoke the function.

```bash
sls invoke [local] -f run -s MYEVENT2050
```

Adding `local` lets you run the function on your local machine instead of actual AWS Lambda instances.

## Customize for other endpoints (*Future plan)

This service is devided into 4 main stages.

- `Fetcher`: Fetch, parse, and abstract the latest schedule
- `Comparer`: Compare with last schedule and get diff
- `Formatter`: Format the diff into human-readable string
- `Notifier`: Send notification to Discord

Also, as side jobs, it saves the latest schedule data to DB, and notify errors to system output.
