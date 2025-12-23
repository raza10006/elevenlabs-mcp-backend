/**
 * Authentication middleware for Bearer token validation
 */

import { FastifyRequest, FastifyReply } from "fastify";
import { logger } from "./logger.js";

/**
 * Gets MCP_SECRET from environment variables
 * Reads at runtime to ensure dotenv has loaded
 */
function getMcpSecret(): string {
  const secret = process.env.MCP_SECRET;
  if (!secret) {
    throw new Error("MCP_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Extracts Bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}

/**
 * Middleware to validate Bearer token authentication
 * Supports both "Authorization" and "Authorization2" headers
 */
export async function requireAuth(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Check both Authorization and Authorization2 headers (case-insensitive)
  const authHeader = 
    request.headers.authorization || 
    request.headers.authorization2 ||
    (request.headers as any)['Authorization'] ||
    (request.headers as any)['Authorization2'];
  const token = extractBearerToken(authHeader);

  if (!token) {
    logger.warn("Missing or invalid Authorization header", {
      path: request.url,
      method: request.method,
    });
    await reply.status(401).send({
      error: "Unauthorized",
      message: "Missing or invalid Authorization header. Expected: Bearer <token>",
    });
    return;
  }

  const expectedSecret = getMcpSecret();
  
  // Trim both to handle any whitespace issues
  const trimmedToken = token.trim();
  const trimmedExpected = expectedSecret.trim();
  
  // Debug logging (safe - only shows lengths and first few chars)
  logger.debug("Auth check", {
    tokenLength: trimmedToken.length,
    expectedLength: trimmedExpected.length,
    tokenStart: trimmedToken.substring(0, 15),
    expectedStart: trimmedExpected.substring(0, 15),
    match: trimmedToken === trimmedExpected,
  });
  
  if (trimmedToken !== trimmedExpected) {
    logger.warn("Invalid authentication token", {
      path: request.url,
      method: request.method,
      tokenLength: trimmedToken.length,
      expectedLength: trimmedExpected.length,
      tokenStart: trimmedToken.substring(0, 15),
      expectedStart: trimmedExpected.substring(0, 15),
      // Don't log full tokens, but log starts for debugging
    });
    await reply.status(403).send({
      error: "Forbidden",
      message: "Invalid authentication token",
    });
    return;
  }

  // Authentication successful, continue
}

