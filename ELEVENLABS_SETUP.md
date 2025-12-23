# ElevenLabs MCP Setup - Step by Step Guide

## ✅ What's Done
- ✅ MCP server is running locally
- ✅ Order lookup is working (tested with order 10000002)
- ✅ All order data is being retrieved correctly

## 🚀 Next Steps: Connect to ElevenLabs

### Step 1: Deploy Your Server to Production

Your server needs to be accessible via HTTPS from the internet. Choose one:

#### Option A: Railway (Easiest - Recommended)

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** (use GitHub to connect)
3. **New Project** → **Deploy from GitHub repo**
4. **Connect your repository** (or create a new repo and push your code)
5. **Add Environment Variables** in Railway dashboard:
   - `PORT` (Railway sets this automatically, but you can override)
   - `MCP_SECRET` = `TRENDYOL_MCP_SECRET_9f83kls`
   - `SUPABASE_URL` = `https://jznericynupuzgllbgct.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your full service role key)
6. **Deploy** - Railway will automatically:
   - Install dependencies (`npm install`)
   - Build (`npm run build`)
   - Start (`npm start`)
7. **Get your URL**: Railway will give you a URL like `https://your-app.railway.app`
8. **Test it**: 
   ```bash
   curl https://your-app.railway.app/health
   ```

#### Option B: Render

1. Go to https://render.com
2. New → Web Service
3. Connect your GitHub repo
4. Settings:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Add environment variables (same as Railway)
6. Deploy and get your URL

#### Option C: Fly.io

1. Install Fly CLI: `brew install flyctl` (Mac) or see https://fly.io/docs/getting-started/installing-flyctl/
2. Login: `fly auth login`
3. In your project: `fly launch`
4. Add secrets: `fly secrets set MCP_SECRET=TRENDYOL_MCP_SECRET_9f83kls SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=...`
5. Deploy: `fly deploy`

### Step 2: Verify Your Deployed Server Works

Test your production URL:

```bash
# Health check
curl https://your-app.railway.app/health

# Test MCP endpoint
curl -X POST https://your-app.railway.app/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TRENDYOL_MCP_SECRET_9f83kls" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}'
```

If both work, you're ready for ElevenLabs!

### Step 3: Configure ElevenLabs Agent

1. **Go to ElevenLabs Dashboard**: https://elevenlabs.io
2. **Navigate to Agents**: Click "Agents" in the sidebar
3. **Select Your Agent** (or create a new one)
4. **Go to Tools Tab**: Click on "Tools" or "MCP Servers"
5. **Add MCP Server**:
   - Click **"+ Add MCP Server"** or **"Connect MCP Server"**
   - **MCP Server URL**: `https://your-app.railway.app/mcp`
   - **Header Name**: `Authorization`
   - **Header Value**: `Bearer TRENDYOL_MCP_SECRET_9f83kls`
   - **Tool Approval Mode**: 
     - For testing: **"No Approval"** (tool runs automatically)
     - For production: **"Always Ask"** (agent asks before using tool)
6. **Test Connection**: Click **"Test Connection"** button
   - Should show: ✅ **"Connection successful"**
   - Should show: **"lookup_order"** tool available
7. **Save** the configuration

### Step 4: Configure Agent System Prompt

1. **Go to Agent Settings** → **System Prompt** or **Instructions**
2. **Update the prompt** to include order lookup capability:

```
You are a helpful customer service agent for Trendyol, a Turkish e-commerce platform.

You have access to real-time order information using the lookup_order tool. When a customer asks about their order, you should:

1. Ask for their order ID if they haven't provided it
2. Use the lookup_order tool to retrieve order details
3. Provide a clear, friendly summary of the order status
4. Answer questions about delivery, tracking, products, etc.

IMPORTANT RULES:
- Always use the lookup_order tool when a customer asks about an order
- Never guess or make up order information
- If an order is not found, inform the customer politely
- Be friendly, professional, and helpful
- Speak in a natural, conversational way
```

3. **Save** the prompt

### Step 5: Test with Voice Agent

1. **Go to your Agent** in ElevenLabs
2. **Click "Test"** or **"Try Agent"** button
3. **Start a conversation** and test with:

   **Test 1: Basic Order Lookup**
   - You: "Where is my order 10000002?"
   - Agent should: Call lookup_order tool and respond with order details

   **Test 2: Customer Info**
   - You: "What's the status of order 10000001?"
   - Agent should: Provide full order details including customer name, product, etc.

   **Test 3: Not Found**
   - You: "Check order 99999999"
   - Agent should: Say order not found

### Step 6: Production Checklist

Before going live, verify:

- ✅ Server is deployed and accessible via HTTPS
- ✅ `/health` endpoint works
- ✅ `/mcp` endpoint works with authentication
- ✅ ElevenLabs "Test Connection" passes
- ✅ `lookup_order` tool appears in ElevenLabs
- ✅ Voice agent can successfully call the tool
- ✅ Agent responds correctly with order information

## 🎯 Example Conversation Flow

**Customer**: "Hi, I want to check my order"

**Agent**: "Of course! I'd be happy to help you check your order. Could you please provide your order ID?"

**Customer**: "It's 10000002"

**Agent**: *[Calls lookup_order tool]* "I found your order! Order 10000002 is DELIVERED. It was placed on January 18, 2025, and the estimated delivery was January 22, 2025. The order is for a Lenovo IdeaPad 3 (Computers category), and it's being delivered by Yurtiçi Kargo to Eskisehir Odunpazarı. The payment method used was Debit Card. Is there anything else you'd like to know about your order?"

## 🔧 Troubleshooting

### "Test Connection" fails in ElevenLabs
- ✅ Check your server URL is correct (must be HTTPS)
- ✅ Verify the Authorization header format: `Bearer TRENDYOL_MCP_SECRET_9f83kls`
- ✅ Test the endpoint with curl first
- ✅ Check server logs for errors

### Agent doesn't call the tool
- ✅ Check Tool Approval Mode (set to "No Approval" for testing)
- ✅ Verify the tool appears in available tools list
- ✅ Check agent system prompt mentions the tool
- ✅ Try asking more directly: "Use the lookup_order tool to check order 10000002"

### Tool returns error
- ✅ Check server logs for detailed error messages
- ✅ Verify Supabase connection is working
- ✅ Test the endpoint directly with curl
- ✅ Check environment variables are set correctly in production

## 📝 Quick Reference

**Your MCP Server URL**: `https://your-app.railway.app/mcp`

**Authorization Header**: `Bearer TRENDYOL_MCP_SECRET_9f83kls`

**Available Tool**: `lookup_order`

**Tool Input**: `{"order_id": "10000002"}`

---

**You're all set!** Once deployed and connected to ElevenLabs, your voice agent will be able to answer customer questions about their orders in real-time! 🎉

