#!/bin/bash
# Quick test script for MCP endpoint

echo "Testing health endpoint..."
curl http://localhost:3000/health
echo -e "\n\n"

echo "Testing MCP tools/list..."
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TRENDYOL_MCP_SECRET_9f83kls" \
  -d '{"jsonrpc":"2.0","id":"1","method":"tools/list","params":{}}'
echo -e "\n\n"

echo "Testing MCP lookup_order for 10000002..."
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TRENDYOL_MCP_SECRET_9f83kls" \
  -d '{"jsonrpc":"2.0","id":"2","method":"tools/call","params":{"name":"lookup_order","arguments":{"order_id":"10000002"}}}'
echo -e "\n"

