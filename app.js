// Include Dependencies
const { CodeCovOpenTelemetry }  = require('@codecov/node-codecov-opentelemetry');
const { NodeTracerProvider } = require('@opentelemetry/sdk-trace-node');
const { BatchSpanProcessor } = require("@opentelemetry/sdk-trace-base");
const { SpanKind } = require("@opentelemetry/api");

// Setup OpenTelemetry
const sampleRate = 1; //sample all spans, in most production contexts 0.1 makes more sense.
const untrackedExportRate = 1;
const version = "0.0.0";
const environment = "development";
const code = environment +  "::" + version; //<environment>::<versionIdentifier>

const provider = new NodeTracerProvider();
provider.register();

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

provider.addSpanProcessor(codecov.processor);
provider.addSpanProcessor(new BatchSpanProcessor(codecov.exporter))

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