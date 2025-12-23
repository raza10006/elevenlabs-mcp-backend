/**
 * MCP (Model Context Protocol) JSON-RPC 2.0 handler
 * Implements: initialize, ping, tools/list, tools/call
 */

import {
  JsonRpcRequest,
  JsonRpcResponse,
  JsonRpcErrorCode,
  InitializeResult,
  ToolsListResult,
  ToolCallResult,
} from "./types.js";
import { lookupOrder, formatOrderForAgent } from "./supabase.js";
import { logger } from "./logger.js";
import { z } from "zod";

// Validation schemas
const ToolCallParamsSchema = z.object({
  name: z.string(),
  arguments: z.record(z.unknown()),
});

const LookupOrderArgumentsSchema = z.object({
  order_id: z.string().min(1, "order_id is required"),
});

/**
 * Validates JSON-RPC 2.0 request structure
 */
function validateJsonRpcRequest(body: unknown): body is JsonRpcRequest {
  if (typeof body !== "object" || body === null) {
    return false;
  }

  const req = body as Record<string, unknown>;
  return (
    req.jsonrpc === "2.0" &&
    typeof req.method === "string" &&
    (req.id === null || typeof req.id === "string" || typeof req.id === "number")
  );
}

/**
 * Creates a JSON-RPC success response
 */
function createSuccessResponse(
  id: string | number | null,
  result: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    result,
  };
}

/**
 * Creates a JSON-RPC error response
 */
function createErrorResponse(
  id: string | number | null,
  code: JsonRpcErrorCode,
  message: string,
  data?: unknown
): JsonRpcResponse {
  return {
    jsonrpc: "2.0",
    id,
    error: {
      code,
      message,
      ...(data !== undefined && { data }),
    },
  };
}

/**
 * Handles the initialize method
 */
function handleInitialize(
  id: string | number | null,
  _params?: Record<string, unknown>
): JsonRpcResponse {
  logger.debug("Handling initialize method", { method: "initialize" });

  const result: InitializeResult = {
    protocolVersion: "2024-11-05",
    capabilities: {
      tools: {},
    },
    serverInfo: {
      name: "elevenlabs-mcp-backend",
      version: "1.0.0",
    },
  };

  return createSuccessResponse(id, result);
}

/**
 * Handles the ping method
 */
function handlePing(id: string | number | null): JsonRpcResponse {
  logger.debug("Handling ping method", { method: "ping" });
  return createSuccessResponse(id, { ok: true });
}

/**
 * Handles the tools/list method
 */
function handleToolsList(id: string | number | null): JsonRpcResponse {
  logger.debug("Handling tools/list method", { method: "tools/list" });

  const result: ToolsListResult = {
    tools: [
      {
        name: "lookup_order",
        description:
          "Looks up order details by order ID. Returns status, delivery estimate, tracking number, carrier, and last update time.",
        inputSchema: {
          type: "object",
          properties: {
            order_id: {
              type: "string",
              description: "The order ID to look up (e.g., 'TR-10001')",
            },
          },
          required: ["order_id"],
        },
      },
    ],
  };

  return createSuccessResponse(id, result);
}

/**
 * Handles the tools/call method
 */
async function handleToolsCall(
  id: string | number | null,
  params: unknown,
  requestId?: string
): Promise<JsonRpcResponse> {
  const contextLogger = logger.withContext({
    requestId,
    method: "tools/call",
  });

  contextLogger.debug("Handling tools/call method");

  // Validate params structure
  const paramsValidation = ToolCallParamsSchema.safeParse(params);
  if (!paramsValidation.success) {
    contextLogger.warn("Invalid tools/call params", {
      errors: paramsValidation.error.errors,
    });
    return createErrorResponse(
      id,
      JsonRpcErrorCode.InvalidParams,
      "Invalid params: name and arguments are required",
      paramsValidation.error.errors
    );
  }

  const { name, arguments: toolArgs } = paramsValidation.data;

  contextLogger.info("Tool call received", { toolName: name });

  // Handle lookup_order tool
  if (name === "lookup_order") {
    // Validate arguments
    const argsValidation = LookupOrderArgumentsSchema.safeParse(toolArgs);
    if (!argsValidation.success) {
      contextLogger.warn("Invalid lookup_order arguments", {
        errors: argsValidation.error.errors,
      });
      return createErrorResponse(
        id,
        JsonRpcErrorCode.InvalidParams,
        "Invalid arguments: order_id is required and must be a non-empty string",
        argsValidation.error.errors
      );
    }

    const { order_id } = argsValidation.data;

    contextLogger.info("Looking up order", { toolName: name, orderId: order_id });

    try {
      const order = await lookupOrder(order_id, {
        requestId,
        orderId: order_id,
      });

      if (!order) {
        contextLogger.info("Order not found", { orderId: order_id });
        return createErrorResponse(
          id,
          JsonRpcErrorCode.OrderNotFound,
          `Order not found: ${order_id}`
        );
      }

      // Format response for agent
      const formattedText = formatOrderForAgent(order);

      const result: ToolCallResult = {
        content: [
          {
            type: "text",
            text: formattedText,
          },
        ],
        structured: {
          order_id: order.order_id,
          status: order.status,
          eta: order.eta,
          carrier: order.carrier,
          tracking_number: order.tracking_number,
          last_update: order.last_update,
          ...(order.issue_flag && { issue_flag: order.issue_flag }),
          ...(order.notes && { notes: order.notes }),
        },
      };

      contextLogger.info("Order lookup successful", {
        orderId: order.order_id,
        status: order.status,
      });

      return createSuccessResponse(id, result);
    } catch (error) {
      contextLogger.error("Error in lookup_order tool", error, {
        orderId: order_id,
      });
      return createErrorResponse(
        id,
        JsonRpcErrorCode.InternalError,
        "Internal server error while looking up order",
        error instanceof Error ? error.message : String(error)
      );
    }
  } else {
    contextLogger.warn("Unknown tool name", { toolName: name });
    return createErrorResponse(
      id,
      JsonRpcErrorCode.InvalidParams,
      `Unknown tool: ${name}. Available tools: lookup_order`
    );
  }
}

/**
 * Main MCP request handler
 * Processes JSON-RPC 2.0 requests and returns appropriate responses
 */
export async function handleMcpRequest(
  body: unknown,
  requestId?: string
): Promise<JsonRpcResponse> {
  const contextLogger = logger.withContext({ requestId });

  // Validate JSON-RPC structure
  if (!validateJsonRpcRequest(body)) {
    contextLogger.warn("Invalid JSON-RPC request structure");
    return createErrorResponse(
      null,
      JsonRpcErrorCode.InvalidRequest,
      "Invalid JSON-RPC 2.0 request. Must have jsonrpc: '2.0', method (string), and id (string|number|null)"
    );
  }

  const request = body as JsonRpcRequest;
  const { method, id, params } = request;

  contextLogger.info("Processing MCP request", { method, id: String(id) });

  try {
    // Route to appropriate handler
    switch (method) {
      case "initialize":
        return handleInitialize(id, params as Record<string, unknown> | undefined);

      case "ping":
        return handlePing(id);

      case "tools/list":
        return handleToolsList(id);

      case "tools/call":
        return await handleToolsCall(id, params, requestId);

      default:
        contextLogger.warn("Method not found", { method });
        return createErrorResponse(
          id,
          JsonRpcErrorCode.MethodNotFound,
          `Method not found: ${method}`
        );
    }
  } catch (error) {
    contextLogger.error("Unexpected error in MCP handler", error, { method });
    return createErrorResponse(
      id,
      JsonRpcErrorCode.InternalError,
      "Internal server error",
      error instanceof Error ? error.message : String(error)
    );
  }
}

