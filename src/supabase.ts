/**
 * Supabase client and order query functions
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { LookupOrderResponse, OrderStatus } from "./types.js";
import { logger } from "./logger.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL) {
  throw new Error("SUPABASE_URL environment variable is required");
}

if (!SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("SUPABASE_SERVICE_ROLE_KEY environment variable is required");
}

// Initialize Supabase client with service role key (bypasses RLS)
export const supabase: SupabaseClient = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

/**
 * Looks up an order by order_id
 * Returns null if order not found
 */
export async function lookupOrder(
  orderId: string,
  logContext?: { requestId?: string; orderId?: string }
): Promise<LookupOrderResponse | null> {
  const contextLogger = logger.withContext({
    ...logContext,
    orderId,
  });

  try {
    contextLogger.debug("Querying Supabase for order", { orderId });

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("order_id", orderId)
      .single();

    if (error) {
      // Handle "not found" case (Supabase returns PGRST116 when no rows found)
      if (error.code === "PGRST116") {
        contextLogger.info("Order not found", { orderId });
        return null;
      }

      // Log other Supabase errors safely (no secrets)
      contextLogger.error("Supabase query error", error, {
        errorCode: error.code,
        errorMessage: error.message,
        // Do not log error.details or error.hint as they might contain sensitive info
      });
      throw new Error(`Database query failed: ${error.message}`);
    }

    if (!data) {
      contextLogger.info("Order not found (null data)", { orderId });
      return null;
    }

    // Debug: Log the raw data structure to help diagnose issues
    contextLogger.debug("Raw order data from Supabase", {
      orderId,
      dataKeys: Object.keys(data),
      dataSample: {
        order_id: (data as any).order_id,
        status: (data as any).status,
        order_status: (data as any).order_status,
        hasStatus: !!(data as any).status,
        hasOrderStatus: !!(data as any).order_status,
      },
    });

    const rawData = data as any;

    // Map existing columns to expected format
    // Support both new schema (status) and existing schema (order_status)
    const statusValue = rawData.status || rawData.order_status;
    
    // Map status values to our expected format
    let mappedStatus: OrderStatus;
    if (statusValue) {
      const upperStatus = String(statusValue).toUpperCase();
      // Map common status values
      if (upperStatus.includes('SHIPPED') || upperStatus.includes('SHIPPING')) {
        mappedStatus = 'SHIPPED';
      } else if (upperStatus.includes('DELIVERED') || upperStatus.includes('DELIVERY')) {
        mappedStatus = 'DELIVERED';
      } else if (upperStatus.includes('PROCESSING') || upperStatus.includes('PROCESS')) {
        mappedStatus = 'PROCESSING';
      } else if (upperStatus.includes('CANCELED') || upperStatus.includes('CANCELLED')) {
        mappedStatus = 'CANCELED';
      } else if (upperStatus.includes('RETURNED') || upperStatus.includes('RETURN')) {
        mappedStatus = 'RETURNED';
      } else if (upperStatus.includes('HOLD') || upperStatus.includes('ON_HOLD')) {
        mappedStatus = 'ON_HOLD';
      } else {
        // Try to use as-is if it matches our enum
        mappedStatus = upperStatus as OrderStatus;
      }
    } else {
      // Default to PROCESSING if no status found
      mappedStatus = 'PROCESSING';
      contextLogger.warn("No status found, defaulting to PROCESSING", { orderId });
    }

    // Map other fields - support both new and existing column names
    const eta = rawData.eta || rawData.estimated_delivery_date;
    const carrier = rawData.carrier || rawData.delivery_partner;
    const tracking_number = rawData.tracking_number || rawData.tracking_id || rawData.tracking;
    const last_update = rawData.last_update || rawData.updated_at || rawData.order_date || rawData.created_at || new Date().toISOString();
    const issue_flag = rawData.issue_flag || rawData.issue_type;
    const notes = rawData.notes || rawData.order_notes;

    // Validate required fields
    if (!rawData.order_id) {
      contextLogger.error("Order data missing order_id", { data });
      throw new Error("Invalid order data: missing order_id");
    }

    contextLogger.info("Order found", {
      orderId: rawData.order_id,
      status: mappedStatus,
      originalStatus: statusValue,
    });

    // Helper function to safely convert to string or null
    const toStr = (val: unknown): string | null => val ? String(val) : null;
    const toDateStr = (val: unknown): string | null => {
      if (!val) return null;
      if (typeof val === 'string') {
        // If it's already a date string, try to parse it
        try {
          const date = new Date(val);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        } catch {
          return null;
        }
        return null;
      }
      if (val instanceof Date) {
        return val.toISOString().split('T')[0];
      }
      if (typeof val === 'number') {
        try {
          return new Date(val).toISOString().split('T')[0];
        } catch {
          return null;
        }
      }
      return null;
    };
    const toTimestampStr = (val: unknown): string => {
      if (!val) return new Date().toISOString();
      if (typeof val === 'string') {
        try {
          const date = new Date(val);
          if (!isNaN(date.getTime())) {
            return date.toISOString();
          }
        } catch {
          return new Date().toISOString();
        }
        return new Date().toISOString();
      }
      if (val instanceof Date) {
        return val.toISOString();
      }
      if (typeof val === 'number') {
        try {
          return new Date(val).toISOString();
        } catch {
          return new Date().toISOString();
        }
      }
      return new Date().toISOString();
    };

    // Transform to response format with ALL available fields
    const response: LookupOrderResponse = {
      // Core order info
      order_id: String(rawData.order_id),
      status: mappedStatus,
      order_status: toStr(rawData.order_status),
      
      // Customer info
      customer_name: toStr(rawData.customer_name),
      customer_phone: toStr(rawData.customer_phone),
      
      // Product info
      product_id: toStr(rawData.product_id),
      product_name: toStr(rawData.product_name),
      category: toStr(rawData.category),
      
      // Delivery info
      eta: toDateStr(eta),
      estimated_delivery_date: toDateStr(rawData.estimated_delivery_date),
      carrier: toStr(carrier),
      delivery_partner: toStr(rawData.delivery_partner),
      delivery_address: toStr(rawData.delivery_address),
      tracking_number: toStr(tracking_number),
      
      // Payment info
      payment_method: toStr(rawData.payment_method),
      
      // Dates
      order_date: toTimestampStr(rawData.order_date),
      created_at: toTimestampStr(rawData.created_at),
      last_update: toTimestampStr(last_update),
      
      // Issues and returns
      issue_flag: toStr(issue_flag),
      issue_type: toStr(rawData.issue_type),
      return_eligible: rawData.return_eligible !== undefined ? Boolean(rawData.return_eligible) : null,
      refund_amount: rawData.refund_amount !== undefined ? Number(rawData.refund_amount) : null,
      
      // Additional notes
      notes: toStr(notes),
    };

    return response;
  } catch (error) {
    contextLogger.error("Unexpected error in lookupOrder", error);
    throw error;
  }
}

/**
 * Formats order data into a human-readable text for voice agents
 * Includes all available order information
 */
export function formatOrderForAgent(order: LookupOrderResponse): string {
  const parts: string[] = [];
  
  // Order ID and Status
  parts.push(`Order ${order.order_id} is ${order.status}`);

  // Customer Information
  if (order.customer_name) {
    parts.push(`Customer: ${order.customer_name}`);
  }
  if (order.customer_phone) {
    parts.push(`Phone: ${order.customer_phone}`);
  }

  // Product Information
  if (order.product_name) {
    parts.push(`Product: ${order.product_name}`);
  }
  if (order.product_id) {
    parts.push(`Product ID: ${order.product_id}`);
  }
  if (order.category) {
    parts.push(`Category: ${order.category}`);
  }

  // Delivery Information
  const etaDate = order.eta || order.estimated_delivery_date;
  if (etaDate) {
    try {
      const formattedDate = new Date(etaDate).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      parts.push(`Estimated delivery: ${formattedDate}`);
    } catch {
      parts.push(`Estimated delivery: ${etaDate}`);
    }
  }

  if (order.tracking_number) {
    const carrier = order.carrier || order.delivery_partner;
    if (carrier) {
      parts.push(`Tracking: ${order.tracking_number} via ${carrier}`);
    } else {
      parts.push(`Tracking number: ${order.tracking_number}`);
    }
  } else if (order.carrier || order.delivery_partner) {
    parts.push(`Carrier: ${order.carrier || order.delivery_partner}`);
  }

  if (order.delivery_address) {
    parts.push(`Delivery address: ${order.delivery_address}`);
  }

  // Payment Information
  if (order.payment_method) {
    parts.push(`Payment method: ${order.payment_method}`);
  }

  // Order Date
  if (order.order_date) {
    try {
      const orderDate = new Date(order.order_date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
      parts.push(`Order date: ${orderDate}`);
    } catch {
      // Keep as-is if date parsing fails
    }
  }

  // Issues and Returns
  const issueInfo = order.issue_flag || order.issue_type;
  if (issueInfo) {
    parts.push(`Issue: ${issueInfo}`);
  }

  if (order.return_eligible !== null && order.return_eligible !== undefined) {
    parts.push(`Return eligible: ${order.return_eligible ? 'Yes' : 'No'}`);
  }

  if (order.refund_amount !== null && order.refund_amount !== undefined) {
    parts.push(`Refund amount: $${order.refund_amount.toFixed(2)}`);
  }

  // Additional Notes
  if (order.notes) {
    parts.push(`Notes: ${order.notes}`);
  }

  // Last Update
  try {
    const lastUpdate = new Date(order.last_update).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
    parts.push(`Last updated: ${lastUpdate}`);
  } catch {
    // Keep as-is if date parsing fails
  }

  return parts.join(". ") + ".";
}

