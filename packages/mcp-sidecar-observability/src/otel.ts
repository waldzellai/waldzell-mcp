import { NodeSDK } from '@opentelemetry/sdk-node';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';

const exportIntervalMillis = Number(process.env.OTEL_METRIC_EXPORT_INTERVAL) || 60_000;

const metricReader = new PeriodicExportingMetricReader({
  exporter: new OTLPMetricExporter(), // uses OTEL_EXPORTER_OTLP_* envs
  exportIntervalMillis,
});

let started = false;

export async function startTelemetry() {
  if (started) return;
  const resource = resourceFromAttributes({
    'service.name': process.env.OTEL_SERVICE_NAME || 'mcp-server',
    'service.version': process.env.SERVICE_VERSION || '0.1.0',
    'deployment.environment': process.env.OTEL_ENV || 'dev',
  });
  const sdk = new NodeSDK({
    resource,
    metricReader,
  });

  await sdk.start();
  started = true;

  process.on('SIGTERM', () => {
    sdk.shutdown().catch(err => console.error('OTel shutdown error', err));
  });
}
