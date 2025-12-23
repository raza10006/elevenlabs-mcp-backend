/**
 * TypeScript types for MCP server and order management
 */

// MCP JSON-RPC 2.0 Types
export interface JsonRpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params?: Record<string, unknown>;
}

export interface JsonRpcSuccessResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result: unknown;
}

export interface JsonRpcErrorResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

export type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

// MCP Method-specific Types
export interface InitializeParams {
  protocolVersion?: string;
  capabilities?: Record<string, unknown>;
  clientInfo?: {
    name: string;
    version: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: {};
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface Tool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolsListResult {
  tools: Tool[];
}

export interface ToolCallParams {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  structured?: Record<string, unknown>;
}

// Order Types
export interface Order {
  id: string;
  order_id: string;
  status: OrderStatus;
  eta: string | null;
  carrier: string | null;
  tracking_number: string | null;
  last_update: string;
  issue_flag: string | null;
  notes: string | null;
}

export type OrderStatus =
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELED"
  | "RETURNED"
  | "ON_HOLD";

export interface LookupOrderRequest {
  order_id: string;
}

export interface LookupOrderResponse {
  // Core order info
  order_id: string;
  status: OrderStatus;
  order_status?: string | null;
  
  // Customer info
  customer_name?: string | null;
  customer_phone?: string | null;
  
  // Product info
  product_id?: string | null;
  product_name?: string | null;
  category?: string | null;
  
  // Delivery info
  eta: string | null;
  estimated_delivery_date?: string | null;
  carrier: string | null;
  delivery_partner?: string | null;
  delivery_address?: string | null;
  tracking_number: string | null;
  
  // Payment info
  payment_method?: string | null;
  
  // Dates
  order_date?: string | null;
  created_at?: string | null;
  last_update: string;
  
  // Issues and returns
  issue_flag?: string | null;
  issue_type?: string | null;
  return_eligible?: boolean | null;
  refund_amount?: number | null;
  
  // Additional notes
  notes?: string | null;
}

// Error Codes (JSON-RPC 2.0 + MCP extensions)
export enum JsonRpcErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  // Custom error codes
  OrderNotFound = -32004,
}

