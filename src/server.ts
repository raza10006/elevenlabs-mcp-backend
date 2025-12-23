/**
 * Main Fastify server
 * Exposes MCP endpoint, health check, and REST backup endpoint
 */

// Load environment variables from .env file
import "dotenv/config";

import Fastify from "fastify";
import cors from "@fastify/cors";
import { handleMcpRequest } from "./mcp.js";
import { lookupOrder, formatOrderForAgent } from "./supabase.js";
import { requireAuth } from "./auth.js";
import { logger } from "./logger.js";
import { JsonRpcErrorCode } from "./types.js";

const PORT = parseInt(process.env.PORT || "3000", 10);

// Initialize Fastify
const fastify = Fastify({
  logger: false, // We use our custom logger
  requestIdLogLabel: "requestId",
  genReqId: () => `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
});

// Health check endpoint (no auth required)
fastify.get("/health", async (_request, _reply) => {
  return {
    ok: true,
    service: "elevenlabs-mcp-backend",
    timestamp: new Date().toISOString(),
  };
});

// Debug endpoint to check env vars (remove in production)
fastify.get("/debug/env", async (_request, _reply) => {
  const mcpSecret = process.env.MCP_SECRET;
  return {
    hasMcpSecret: !!mcpSecret,
    mcpSecretLength: mcpSecret?.length || 0,
    mcpSecretStart: mcpSecret?.substring(0, 20) || "not set",
    hasSupabaseUrl: !!process.env.SUPABASE_URL,
  };
});

// MCP JSON-RPC endpoint (requires auth)
fastify.post("/mcp", async (request, reply) => {
  // Check authentication
  await requireAuth(request, reply);
  if (reply.sent) {
    return; // Auth failed, response already sent
  }

  const requestId = request.id as string;
  const contextLogger = logger.withContext({ requestId });

  try {
    // Parse request body
    let body: unknown;
    try {
      body = request.body;
    } catch (error) {
      contextLogger.error("Failed to parse request body", error);
      return reply.status(400).send({
        jsonrpc: "2.0",
        id: null,
        error: {
          code: JsonRpcErrorCode.ParseError,
          message: "Parse error: Invalid JSON",
        },
      });
    }

    // Handle MCP request
    const response = await handleMcpRequest(body, requestId);
    return reply.send(response);
  } catch (error) {
    contextLogger.error("Unexpected error in /mcp endpoint", error);
    return reply.status(500).send({
      jsonrpc: "2.0",
      id: null,
      error: {
        code: JsonRpcErrorCode.InternalError,
        message: "Internal server error",
      },
    });
  }
});

// REST backup endpoint for lookup_order (requires auth)
fastify.post("/lookup-order", async (request, reply) => {
  // Check authentication
  await requireAuth(request, reply);
  if (reply.sent) {
    return; // Auth failed, response already sent
  }

  const requestId = request.id as string;
  const contextLogger = logger.withContext({ requestId });

  try {
    const body = request.body as { order_id?: string };

    if (!body || typeof body.order_id !== "string" || body.order_id.trim() === "") {
      contextLogger.warn("Invalid lookup-order request", { body });
      return reply.status(400).send({
        error: "Invalid request",
        message: "order_id is required and must be a non-empty string",
      });
    }

    const { order_id } = body;

    contextLogger.info("REST lookup-order request", { orderId: order_id });

    const order = await lookupOrder(order_id, {
      requestId,
      orderId: order_id,
    });

    if (!order) {
      contextLogger.info("Order not found via REST", { orderId: order_id });
      return reply.status(404).send({
        error: "Order not found",
        message: `Order with ID '${order_id}' was not found`,
      });
    }

    // Return same data shape as MCP tool
    const formattedText = formatOrderForAgent(order);

    return reply.send({
      order_id: order.order_id,
      status: order.status,
      eta: order.eta,
      carrier: order.carrier,
      tracking_number: order.tracking_number,
      last_update: order.last_update,
      issue_flag: order.issue_flag,
      notes: order.notes,
      formatted_text: formattedText,
    });
  } catch (error) {
    contextLogger.error("Unexpected error in /lookup-order endpoint", error);
    return reply.status(500).send({
      error: "Internal server error",
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  const requestId = request.id as string;
  logger.error("Fastify error", error, { requestId, path: request.url });
  
  reply.status(error.statusCode || 500).send({
    error: "Internal server error",
    message: error.message,
  });
});

// 404 handler
fastify.setNotFoundHandler((request, reply) => {
  logger.warn("Route not found", { path: request.url, method: request.method });
  reply.status(404).send({
    error: "Not Found",
    message: `Route ${request.method} ${request.url} not found`,
  });
});

// Start server
async function start() {
  try {
    // Verify environment variables are loaded
    const mcpSecret = process.env.MCP_SECRET;
    if (!mcpSecret) {
      logger.error("MCP_SECRET not found in environment variables");
      throw new Error("MCP_SECRET environment variable is required");
    }
    logger.info("Environment variables loaded", {
      hasMcpSecret: !!mcpSecret,
      mcpSecretLength: mcpSecret.length,
      hasSupabaseUrl: !!process.env.SUPABASE_URL,
    });
    
    // Register CORS plugin
    await fastify.register(cors, {
      origin: true, // Allow all origins (adjust for production)
      credentials: true,
    });
    
    const address = await fastify.listen({
      port: PORT,
      host: "0.0.0.0", // Listen on all interfaces for deployment
    });

    logger.info(`Server listening on ${address}`, {
      port: PORT,
      environment: process.env.NODE_ENV || "development",
    });
  } catch (error) {
    logger.error("Failed to start server", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await fastify.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down gracefully");
  await fastify.close();
  process.exit(0);
});

// Start the server
start();

