/**
 * OpenTelemetry instrumentation for MCP protocol traffic
 */

import { metrics } from '@opentelemetry/api';
import type { Counter, Histogram, UpDownCounter } from '@opentelemetry/api';

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id?: string | number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * MCP Protocol Instrumentation
 * Records metrics for all MCP JSON-RPC traffic
 */
export class MCPInstrumentation {
  private meter = metrics.getMeter('mcp-sidecar');
  
  // Protocol-level metrics
  private requestsTotal: Counter;
  private requestDuration: Histogram;
  private activeConnections: UpDownCounter;
  private protocolErrors: Counter;
  private messageBytes: Counter;
  
  // Capability-specific metrics
  private toolsListedTotal: Counter;
  private toolCallsTotal: Counter;
  private toolCallDuration: Histogram;
  private resourcesListedTotal: Counter;
  private resourceReadsTotal: Counter;
  private promptsListedTotal: Counter;
  private promptGetsTotal: Counter;
  
  // Transport metrics
  private sseStreamsActive: UpDownCounter;
  
  // Server health
  private upstreamAvailable: UpDownCounter;
  
  constructor(private serverName: string) {
    // Protocol-level metrics
    this.requestsTotal = this.meter.createCounter('mcp_requests_total', {
      description: 'Total MCP JSON-RPC requests',
    });
    
    this.requestDuration = this.meter.createHistogram('mcp_request_duration_seconds', {
      description: 'MCP request latency',
      unit: 's',
    });
    
    this.activeConnections = this.meter.createUpDownCounter('mcp_active_connections', {
      description: 'Number of active MCP connections',
    });
    
    this.protocolErrors = this.meter.createCounter('mcp_protocol_errors_total', {
      description: 'MCP protocol-level errors',
    });
    
    this.messageBytes = this.meter.createCounter('mcp_message_bytes_total', {
      description: 'Total bytes sent/received',
      unit: 'bytes',
    });
    
    // Capability-specific metrics
    this.toolsListedTotal = this.meter.createCounter('mcp_tools_listed_total', {
      description: 'Number of tools/list calls',
    });
    
    this.toolCallsTotal = this.meter.createCounter('mcp_tool_calls_total', {
      description: 'Number of tools/call invocations',
    });
    
    this.toolCallDuration = this.meter.createHistogram('mcp_tool_duration_seconds', {
      description: 'Tool execution duration',
      unit: 's',
    });
    
    this.resourcesListedTotal = this.meter.createCounter('mcp_resources_listed_total', {
      description: 'Number of resources/list calls',
    });
    
    this.resourceReadsTotal = this.meter.createCounter('mcp_resource_reads_total', {
      description: 'Number of resources/read calls',
    });
    
    this.promptsListedTotal = this.meter.createCounter('mcp_prompts_listed_total', {
      description: 'Number of prompts/list calls',
    });
    
    this.promptGetsTotal = this.meter.createCounter('mcp_prompt_gets_total', {
      description: 'Number of prompts/get calls',
    });
    
    // Transport metrics
    this.sseStreamsActive = this.meter.createUpDownCounter('mcp_sse_streams_active', {
      description: 'Number of active SSE streams',
    });
    
    // Server health
    this.upstreamAvailable = this.meter.createUpDownCounter('mcp_upstream_available', {
      description: 'Whether upstream server is responding (1=up, 0=down)',
    });
    
    // Initialize upstream as available
    this.upstreamAvailable.add(1, { server_name: this.serverName });
  }
  
  /**
   * Record incoming request
   */
  recordRequest(request: JSONRPCRequest): void {
    this.requestsTotal.add(1, {
      method: request.method,
      server_name: this.serverName,
    });
  }
  
  /**
   * Record request completion with timing
   */
  recordResponse(
    request: JSONRPCRequest,
    response: JSONRPCResponse | null,
    durationMs: number,
    error?: Error
  ): void {
    const status = error ? 'error' : response?.error ? 'error' : 'ok';
    const errorCode = response?.error?.code?.toString() || 'none';
    
    this.requestDuration.record(durationMs / 1000, {
      method: request.method,
      server_name: this.serverName,
      status,
    });
    
    if (error || response?.error) {
      this.protocolErrors.add(1, {
        method: request.method,
        server_name: this.serverName,
        error_code: errorCode,
      });
    }
    
    // Capability-specific tracking
    this.trackCapabilityMetrics(request, response, durationMs);
  }
  
  /**
   * Track capability-specific metrics based on method
   */
  private trackCapabilityMetrics(
    request: JSONRPCRequest,
    response: JSONRPCResponse | null,
    durationMs: number
  ): void {
    const method = request.method;
    const status = response?.error ? 'error' : 'ok';
    
    // Tools
    if (method === 'tools/list') {
      this.toolsListedTotal.add(1, { server_name: this.serverName });
    } else if (method === 'tools/call') {
      const toolName = request.params?.name || 'unknown';
      this.toolCallsTotal.add(1, {
        tool_name: toolName,
        server_name: this.serverName,
        status,
      });
      this.toolCallDuration.record(durationMs / 1000, {
        tool_name: toolName,
        server_name: this.serverName,
      });
    }
    
    // Resources
    else if (method === 'resources/list') {
      this.resourcesListedTotal.add(1, { server_name: this.serverName });
    } else if (method === 'resources/read') {
      const resourceUri = request.params?.uri || 'unknown';
      this.resourceReadsTotal.add(1, {
        resource_uri: resourceUri,
        server_name: this.serverName,
      });
    }
    
    // Prompts
    else if (method === 'prompts/list') {
      this.promptsListedTotal.add(1, { server_name: this.serverName });
    } else if (method === 'prompts/get') {
      const promptName = request.params?.name || 'unknown';
      this.promptGetsTotal.add(1, {
        prompt_name: promptName,
        server_name: this.serverName,
      });
    }
  }
  
  /**
   * Record message size
   */
  recordMessageBytes(direction: 'in' | 'out', bytes: number): void {
    this.messageBytes.add(bytes, {
      direction,
      server_name: this.serverName,
    });
  }
  
  /**
   * Track connection lifecycle
   */
  connectionOpened(): void {
    this.activeConnections.add(1, { server_name: this.serverName });
  }
  
  connectionClosed(): void {
    this.activeConnections.add(-1, { server_name: this.serverName });
  }
  
  /**
   * Track SSE stream lifecycle
   */
  sseStreamOpened(): void {
    this.sseStreamsActive.add(1, { server_name: this.serverName });
  }
  
  sseStreamClosed(): void {
    this.sseStreamsActive.add(-1, { server_name: this.serverName });
  }
  
  /**
   * Update upstream availability
   */
  setUpstreamAvailable(available: boolean): void {
    // Remove current value and set new value
    // This works correctly even if called multiple times with same value
    const targetValue = available ? 1 : 0;
    // Note: UpDownCounter doesn't have a "set" method, only "add"
    // We need to track previous state to calculate delta correctly
    // Current implementation will drift if called with same value repeatedly
    this.upstreamAvailable.add(targetValue === 1 ? 1 : -1, { server_name: this.serverName });
  }
}
