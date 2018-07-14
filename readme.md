# Schedule Change
[![Build Status](https://travis-ci.org/JapaneseRestream/schedule-change.svg?branch=master)](https://travis-ci.org/JapaneseRestream/schedule-change)

Microservice to fetch speedrunning events schedule and notify changes to Discord webhook. Made for language restreamers.

Written in TypeScript. Run `yarn build` to transpile to JavaScript.

This app is designed to be used with [AWS Lambda with Serverless Framework](https://serverless.com/framework/docs/providers/aws/guide/quick-start/).

## Deploy to AWS Lambda

First setup JSON config file in `config` directory. Refer to `template.json`. File name must be Serverless' stage.

Then deploy with

```
$ sls deploy -s [development/staging/production/etc]
```

## Invoke

It runs every 6 minutes by default, but you can manually invoke the function.

```
$ sls invoke (local) -f run -s MYEVENT2050
```

Adding `local` lets you run the function on your local machine instead of actual AWS Lambda instances.

## Adding custom notifier

> Please refer to what's inside src/esa2018-one as well.

This service is devided into 3 main stages.

- `Fetcher`: Fetch and parse into data format that is useful for the rest of the logic.
- `Comparer`: Compare with last schedule and get diff
- `Formatter`: Format the diff into human-readable string

Each stage is represented by functions that takes the data from previous stage as arguments.

In `src/example-event.ts`,
```ts
import {scheduleChange} from '../lib';

export default () => {
	scheduleChange(
		'example-event',
		new URL('https://example.com/schedule'),
		(rawData) => parseRawData(rawData),
		(lastFetchedSchedule, latestSchedule) =>
			compareThem(lastFetchedSchedule, latestSchedule),
		(compareResult) => formatThem(compareResult)
	)
}
```

The `scheduleChange` funtion is strongly typed with generics, allowing to define each function freely and safely.

Then register this function in `serverless.yml`.

```yaml
functions:
  example-event:
    handler: build/example-event.default
    events:
	  - schedule: cron(0/6 * * * ? *)
	  # or any other events to invoke this function (like Discord command)
```

Now you can deploy to have your custom schedule change notifier!
