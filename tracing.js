const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { SimpleSpanProcessor, BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { SpanKind } = require("@opentelemetry/api");

const process = require('process');
const opentelemetry = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { ConsoleSpanExporter } = require('@opentelemetry/sdk-trace-base');
const { Resource } = require('@opentelemetry/resources');
const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');
const { diag, DiagConsoleLogger, DiagLogLevel } = require('@opentelemetry/api');
const { CodeCovOpenTelemetry }  = require('@codecov/node-codecov-opentelemetry');

// For troubleshooting, set the log level to DiagLogLevel.DEBUG
diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.INFO);

const sampleRate = 1; //sample all spans, in most production contexts 0.1 makes more sense.
const untrackedExportRate = 1;
const version = "0.0.0";
const environment = "development";
const code = environment +  "::" + version; //<environment>::<versionIdentifier>

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
  spanProcessor: provider,
  traceExporter: new opentelemetry.tracing.ConsoleSpanExporter(),
  instrumentations: [getNodeAutoInstrumentations()]
});

sdk.start()
  .then(() => console.log('Tracing initialized'))
  .catch((error) => console.log('Error initializing tracing', error));
