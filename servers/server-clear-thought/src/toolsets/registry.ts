import { z, ZodTypeAny } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

export interface OperationSpec {
  name: string;
  description: string;
  schema: Record<string, ZodTypeAny>;
  handler: (args: any) => Promise<any>;
}

export class ToolsetRegistry {
  private operations: OperationSpec[] = [];

  constructor(private slug: string, private description: string) {}

  addOperation(op: OperationSpec): void {
    this.operations.push(op);
  }

  register(server: McpServer): void {
    if (this.operations.length === 0) return;
    const schemas = this.operations.map((op) =>
      z.object({ operation: z.literal(op.name), ...op.schema })
    );
    const schema =
      schemas.length === 1
        ? schemas[0]
        : z.union(
            [schemas[0], schemas[1], ...schemas.slice(2)] as [
              z.ZodTypeAny,
              z.ZodTypeAny,
              ...z.ZodTypeAny[]
            ]
          );
    const dispatcher = async (args: any) => {
      const op = this.operations.find((o) => o.name === args.operation);
      if (!op) throw new Error(`Unknown operation: ${args.operation}`);
      return op.handler(args);
    };
    server.tool(this.slug, this.description, schema as any, dispatcher);
  }
}

export function collectOperations(
  registerFn: (server: McpServer, state: any) => void,
  state: any
): OperationSpec[] {
  const ops: OperationSpec[] = [];
  const fakeServer = {
    tool(name: string, description: string, schema: any, handler: any) {
      ops.push({ name, description, schema, handler });
    }
  } as unknown as McpServer;
  registerFn(fakeServer, state);
  return ops;
}
