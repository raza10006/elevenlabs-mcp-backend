# ElevenLabs MCP Backend

Production-grade backend service that connects ElevenLabs Agents to Supabase using MCP (Model Context Protocol). Enables voice agents to look up real-time order details via the `lookup_order` tool.

## Features

- ✅ **MCP Server (Streamable HTTP)** - Full JSON-RPC 2.0 implementation
- ✅ **Supabase Integration** - Real-time order data queries
- ✅ **Bearer Token Authentication** - Secure API access
- ✅ **Health Check Endpoint** - Service monitoring
- ✅ **REST Backup Endpoint** - Alternative to MCP for testing
- ✅ **Structured Logging** - Request tracking and error handling
- ✅ **Production Ready** - Works on Replit, Railway, Render, Fly, Vercel

## Architecture

```
ElevenLabs Agent → MCP Server (/mcp) → Supabase → Orders Table
```

The MCP server implements the following JSON-RPC 2.0 methods:
- `initialize` - Protocol handshake
- `ping` - Health check
- `tools/list` - List available tools
- `tools/call` - Execute tools (lookup_order)

## Quick Start

### Prerequisites

- Node.js 18+ 
- Supabase account and project
- ElevenLabs account with Agents feature

### 1. Clone and Install

```bash
git clone <your-repo>
cd elevenlabs-mcp-backend
npm install
```

### 2. Set Up Supabase

1. Go to your Supabase project dashboard
2. Open the SQL Editor
3. Run the SQL from `sql/schema.sql` to create the `orders` table and seed data

### 3. Configure Environment Variables

Copy `env.example` to `.env`:

```bash
cp env.example .env
```

Edit `.env` with your values:

```env
PORT=3000
MCP_SECRET=your-secure-random-string-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

**Generate a secure MCP_SECRET:**
```bash
openssl rand -hex 32
```

**Get Supabase credentials:**
- `SUPABASE_URL`: Found in Project Settings → API → Project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Found in Project Settings → API → service_role key (⚠️ Keep secret!)

### 4. Build and Run

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm run build
npm start
```

The server will start on `http://localhost:3000` (or your `PORT` env var).

## Testing

### Health Check

```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "ok": true,
  "service": "elevenlabs-mcp-backend",
  "timestamp": "2025-12-23T12:00:00.000Z"
}
```

### MCP: tools/list

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-string-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": "1",
    "method": "tools/list",
    "params": {}
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "result": {
    "tools": [
      {
        "name": "lookup_order",
        "description": "Looks up order details by order ID...",
        "inputSchema": {
          "type": "object",
          "properties": {
            "order_id": {
              "type": "string",
              "description": "The order ID to look up (e.g., 'TR-10001')"
            }
          },
          "required": ["order_id"]
        }
      }
    ]
  }
}
```

### MCP: tools/call (Existing Order)

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-string-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": "2",
    "method": "tools/call",
    "params": {
      "name": "lookup_order",
      "arguments": {
        "order_id": "TR-10001"
      }
    }
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": "2",
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Order TR-10001 is SHIPPED. ETA: December 28, 2025. Tracking: 123456789 (Yurtiçi Kargo). Last updated: December 23, 2025, 10:30 AM."
      }
    ],
    "structured": {
      "order_id": "TR-10001",
      "status": "SHIPPED",
      "eta": "2025-12-28",
      "carrier": "Yurtiçi Kargo",
      "tracking_number": "123456789",
      "last_update": "2025-12-23T10:30:00Z"
    }
  }
}
```

### MCP: tools/call (Missing Order)

```bash
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-string-here" \
  -d '{
    "jsonrpc": "2.0",
    "id": "3",
    "method": "tools/call",
    "params": {
      "name": "lookup_order",
      "arguments": {
        "order_id": "TR-99999"
      }
    }
  }'
```

Expected response:
```json
{
  "jsonrpc": "2.0",
  "id": "3",
  "error": {
    "code": -32004,
    "message": "Order not found: TR-99999"
  }
}
```

### REST Backup Endpoint

```bash
curl -X POST http://localhost:3000/lookup-order \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-secure-random-string-here" \
  -d '{
    "order_id": "TR-10001"
  }'
```

Expected response:
```json
{
  "order_id": "TR-10001",
  "status": "SHIPPED",
  "eta": "2025-12-28",
  "carrier": "Yurtiçi Kargo",
  "tracking_number": "123456789",
  "last_update": "2025-12-23T10:30:00Z",
  "issue_flag": null,
  "notes": "Out for delivery",
  "formatted_text": "Order TR-10001 is SHIPPED. ETA: December 28, 2025. Tracking: 123456789 (Yurtiçi Kargo). Last updated: December 23, 2025, 10:30 AM."
}
```

## ElevenLabs Configuration

### Setting Up MCP Server in ElevenLabs

1. **Deploy your backend** to a public URL (e.g., `https://your-app.railway.app` or `https://your-app.vercel.app`)

2. **In ElevenLabs Dashboard:**
   - Go to **Agents** → Select your agent → **Tools** → **MCP Servers**
   - Click **Add MCP Server**

3. **Configure the MCP Server:**
   - **MCP Server URL**: `https://your-domain.com/mcp`
   - **Header**: `Authorization: Bearer <your-MCP_SECRET>`
   - **Tool Approval Mode**: 
     - **Always Ask** (recommended for production)
     - **No Approval** (for testing/demo)

4. **Test Connection:**
   - Click **Test Connection** in ElevenLabs
   - Should see: ✅ Connection successful
   - The `lookup_order` tool should appear in available tools

### Important Security Notes

⚠️ **Only agents with this MCP server attached can use the tool.**

- Not "all agents can read the DB"
- Only agents that have this MCP server connected and permission
- Each agent must have the MCP server configured individually

### Agent System Prompt Fix

If your agent prompt currently says:
> "You have access only to uploaded TXT order records"

**Replace it with:**
> "You have access to real-time order records using the lookup_order tool. When a user asks about an order, always call the lookup_order tool with the order_id. Never guess order details - always use the tool to retrieve accurate information."

**Keep these guardrails:**
- Never guess order details
- Always call the `lookup_order` tool when asked about orders
- If the tool returns "Order not found", inform the user clearly

## Deployment

### Railway

1. Connect your GitHub repo to Railway
2. Railway auto-detects Node.js
3. Add environment variables in Railway dashboard:
   - `PORT` (auto-set by Railway, but can override)
   - `MCP_SECRET`
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Deploy!

### Render

1. Create new **Web Service**
2. Connect your repo
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add environment variables
6. Deploy!

### Vercel

1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in project directory
3. Add environment variables in Vercel dashboard
4. **Note**: Vercel serverless may have cold starts. Consider Railway/Render for better MCP performance.

### Fly.io

1. Install Fly CLI
2. Run `fly launch`
3. Add secrets: `fly secrets set MCP_SECRET=... SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...`
4. Deploy: `fly deploy`

### Replit

1. Import your GitHub repo
2. Add environment variables in Secrets tab
3. Run `npm install && npm run build && npm start`
4. Replit auto-exposes the port

## API Reference

### Endpoints

#### `GET /health`
Health check (no auth required)

**Response:**
```json
{
  "ok": true,
  "service": "elevenlabs-mcp-backend",
  "timestamp": "2025-12-23T12:00:00.000Z"
}
```

#### `POST /mcp`
MCP JSON-RPC 2.0 endpoint (requires Bearer token)

**Headers:**
- `Authorization: Bearer <MCP_SECRET>`
- `Content-Type: application/json`

**Request Body:** JSON-RPC 2.0 format
```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "tools/call",
  "params": { ... }
}
```

**Response:** JSON-RPC 2.0 format

#### `POST /lookup-order`
REST backup endpoint (requires Bearer token)

**Headers:**
- `Authorization: Bearer <MCP_SECRET>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "order_id": "TR-10001"
}
```

**Response:**
```json
{
  "order_id": "TR-10001",
  "status": "SHIPPED",
  "eta": "2025-12-28",
  "carrier": "Yurtiçi Kargo",
  "tracking_number": "123456789",
  "last_update": "2025-12-23T10:30:00Z",
  "issue_flag": null,
  "notes": "Out for delivery",
  "formatted_text": "..."
}
```

### Error Codes

JSON-RPC 2.0 error codes:
- `-32700`: Parse error
- `-32600`: Invalid request
- `-32601`: Method not found
- `-32602`: Invalid params
- `-32603`: Internal error
- `-32004`: Order not found (custom)

## Database Schema

The `orders` table has the following structure:

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY,
  order_id TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL, -- PROCESSING, SHIPPED, DELIVERED, CANCELED, RETURNED, ON_HOLD
  eta DATE,
  carrier TEXT,
  tracking_number TEXT,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  issue_flag TEXT, -- e.g., "address_problem", "payment_review"
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

See `sql/schema.sql` for full schema and seed data.

## Development

### Project Structure

```
.
├── src/
│   ├── server.ts      # Fastify server and routes
│   ├── mcp.ts         # MCP JSON-RPC handler
│   ├── supabase.ts    # Supabase client and queries
│   ├── auth.ts        # Bearer token middleware
│   ├── logger.ts      # Structured logging
│   └── types.ts       # TypeScript types
├── sql/
│   └── schema.sql     # Database schema and seeds
├── dist/              # Compiled JavaScript (generated)
├── package.json
├── tsconfig.json
├── env.example
└── README.md
```

### Scripts

- `npm run dev` - Development with hot reload (tsx watch)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run type-check` - Type check without building

### Logging

Logs include:
- Request IDs for tracing
- Method names (MCP methods)
- Tool names
- Order IDs
- Errors (safely, no secrets exposed)

Example log:
```
[2025-12-23T12:00:00.000Z] [INFO] Processing MCP request {"requestId":"123-abc","method":"tools/call","id":"2"}
[2025-12-23T12:00:00.100Z] [INFO] Order found {"requestId":"123-abc","orderId":"TR-10001","status":"SHIPPED"}
```

## Troubleshooting

### "Order not found" for valid orders

- Check Supabase connection: Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Check table exists: Run `sql/schema.sql` in Supabase SQL Editor
- Check order_id format: Must match exactly (case-sensitive)

### MCP "Test Connection" fails in ElevenLabs

- Verify server is deployed and accessible
- Check `Authorization` header format: `Bearer <token>` (with space)
- Verify `MCP_SECRET` matches in both places
- Check server logs for authentication errors

### CORS errors

- Server allows all origins by default (`origin: true`)
- For production, restrict in `src/server.ts` CORS config

### Supabase connection errors

- Service role key must have full access (bypasses RLS)
- Verify URL format: `https://xxxxx.supabase.co` (no trailing slash)
- Check network/firewall allows outbound HTTPS

## Final Checklist

After deployment, verify:

- ✅ Server running
- ✅ `/health` works
- ✅ `/mcp` `tools/list` works
- ✅ `/mcp` `tools/call` works
- ✅ Supabase returns rows
- ✅ ElevenLabs "Test Connection" passes
- ✅ Voice agent can answer "Where is my order TR-10001?"

## License

MIT

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify environment variables are set correctly
3. Test with curl commands above
4. Check Supabase dashboard for data

---

**Built with:** Fastify, TypeScript, Supabase, MCP (Model Context Protocol)
