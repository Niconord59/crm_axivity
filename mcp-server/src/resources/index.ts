import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerSchemaResource } from "./schema.js";
import { registerEnumsResource } from "./enums.js";

export function registerAllResources(server: McpServer): void {
  registerSchemaResource(server);
  registerEnumsResource(server);
}
