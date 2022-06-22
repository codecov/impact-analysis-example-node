// Include Dependencies
const { CodeCovOpenTelemetry }  = require('@codecov/node-codecov-opentelemetry');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { SpanKind } = require("@opentelemetry/api");

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

// Setup OpenTelemetry
const sampleRate = 1; //sample all spans, in most production contexts 0.1 makes more sense.
const untrackedExportRate = 1;
const version = "0.0.0";
const environment = "development";
const code = environment +  "::" + version; //<environment>::<versionIdentifier>
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

// Setup Codecov OTEL
const codecov = new CodeCovOpenTelemetry(
  {
    repositoryToken: process.env.IMPACT_ANALYSIS_TOKEN, //from repository settings page on Codecov.
    environment, //or others as appropriate
    versionIdentifier: version, //semver, commit SHA, etc
    filters: {
      allowedSpanKinds: [SpanKind.SERVER],
    },
    codecovEndpoint: "api.codecov.io",
    sampleRate,
    untrackedExportRate,
    code: code
  }
)

const provider = new NodeTracerProvider();
provider.register();
provider.addSpanProcessor(codecov.processor);
provider.addSpanProcessor(new BatchSpanProcessor(codecov.exporter));
provider.addSpanProcessor(new SimpleSpanProcessor(new opentelemetry.tracing.ConsoleSpanExporter()));

const sdk = new opentelemetry.NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: 'codecov',
  }),
  // spanProcessor: provider,
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

// initialize the SDK and register with the OpenTelemetry API
// this enables the API to record telemetry
sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error));

// gracefully shut down the SDK on process exit
process.on('SIGTERM', () => {
  sdk.shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});

const express = require('express')
const app = express()
const port = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.get('/time', (req,res) => {
    let dt = new Date().toISOString();
    res.send(dt);
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
