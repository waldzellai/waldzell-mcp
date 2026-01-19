/**
 * Configuration for MCP Observability Sidecar
 */

export interface MCPSidecarConfig {
  /** Upstream MCP server to proxy to */
  upstream: {
    /** Base URL of upstream MCP server (e.g., http://weather-server:3000) */
    url: string;
    /** Friendly name for metrics labels */
    serverName: string;
    /** Timeout for upstream requests in ms */
    timeoutMs?: number;
  };
  
  /** Listen configuration for incoming MCP clients */
  listen: {
    port: number;
    host?: string;
  };
  
  /** OpenTelemetry configuration */
  otel: {
    serviceName: string;
    serviceVersion: string;
    environment: string;
    exportIntervalMs: number;
    endpoint?: string;
  };
}

/**
 * Load configuration from environment variables
 */
export function loadConfig(): MCPSidecarConfig {
  const upstreamUrl = process.env.MCP_UPSTREAM_URL;
  if (!upstreamUrl) {
    throw new Error('MCP_UPSTREAM_URL environment variable is required');
  }
  
  return {
    upstream: {
      url: upstreamUrl,
      serverName: process.env.MCP_UPSTREAM_NAME || 'upstream',
      timeoutMs: Number(process.env.MCP_UPSTREAM_TIMEOUT_MS) || 30000,
    },
    listen: {
      port: Number(process.env.PORT) || 4000,
      host: process.env.HOST || '0.0.0.0',
    },
    otel: {
      serviceName: process.env.OTEL_SERVICE_NAME || 'mcp-sidecar',
      serviceVersion: process.env.SERVICE_VERSION || '0.2.0',
      environment: process.env.OTEL_ENV || 'dev',
      exportIntervalMs: Number(process.env.OTEL_METRIC_EXPORT_INTERVAL) || 10_000,
      endpoint: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    },
  };
}

/**
 * Validate configuration
 */
export function validateConfig(config: MCPSidecarConfig): void {
  try {
    new URL(config.upstream.url);
  } catch (err) {
    throw new Error(`Invalid MCP_UPSTREAM_URL: ${config.upstream.url}`);
  }
  
  if (config.listen.port < 1 || config.listen.port > 65535) {
    throw new Error(`Invalid PORT: ${config.listen.port}`);
  }
}
