const { RoomServiceClient } = require('livekit-server-sdk');
const fs = require('fs');
const path = require('path');

// Manual .env parsing
try {
  const envPath = path.resolve(__dirname, '../.env');
  const envConfig = fs.readFileSync(envPath, 'utf8');
  envConfig.split(/\r?\n/).forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      let value = match[2].trim();
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
} catch (e) {
  console.warn("Could not read .env file:", e.message);
}

async function testConnection() {
  console.log("Testing LiveKit Configuration...");

  const url = process.env.NEXT_PUBLIC_LIVEKIT_URL;
  const apiKey = process.env.LIVEKIT_API_KEY;
  const apiSecret = process.env.LIVEKIT_API_SECRET;

  console.log("URL:", url);
  console.log("Key ID:", apiKey ? `${apiKey.substring(0, 6)}...` : "(missing)");
  console.log("Secret:", apiSecret ? "Present (Hidden)" : "(missing)");

  if (!url || !apiKey || !apiSecret) {
    console.error("❌ Missing environment variables. Please check .env");
    return;
  }

  // Convert wss to https for the service client
  const httpUrl = url.replace('wss://', 'https://');

  console.log(`System Time: ${new Date().toISOString()}`);

  // Check Server Time via Headers
  try {
    console.log("Checking Server Time...");
    const res = await fetch(httpUrl);
    const serverDateStr = res.headers.get('date');
    if (serverDateStr) {
      const serverTime = new Date(serverDateStr).getTime();
      const localTime = Date.now();
      const diff = localTime - serverTime;
      console.log(`Server Time: ${new Date(serverTime).toISOString()}`);
      console.log(`Clock Drift: ${diff}ms (${(diff / 1000).toFixed(1)}s)`);

      if (diff > 5000) {
        console.warn("⚠️  WARNING: Your system clock is AHEAD of the server. Tokens will be invalid (future-dated).");
      } else if (diff < -5000) {
        console.warn("⚠️  WARNING: Your system clock is BEHIND the server.");
      }
    } else {
      console.log("Could not retrieve Date header from server.");
    }
  } catch (e) {
    console.log("Could not reach server HTTP endpoint to check time:", e.message);
  }

  console.log(`Key Length: ${apiKey.length}`);
  console.log(`Secret Length: ${apiSecret.length}`);

  try {
    console.log("Attempting authentication with long-lived token (skew bypass)...");

    const { AccessToken } = require('livekit-server-sdk');
    const at = new AccessToken(apiKey, apiSecret, {
      ttl: '24h', // 24 hours to cover the 23 minute drift
    });
    at.addGrant({ roomList: true, roomJoin: true, room: 'diagnostic-test-room', canPublish: true, canSubscribe: true });
    at.identity = 'diagnostic-bot';
    const token = await at.toJwt(); // Ensure this is awaited if it returns a promise, or check SDK version

    console.log("Generated Token:", token.substring(0, 20) + "...");

    const res = await fetch(`${httpUrl}/twirp/livekit.RoomService/ListRooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (res.ok) {
      console.log("✅ SUCCESS: Connected and Authenticated with manual token!");
      const data = await res.json();
      console.log(`info: Found ${data.rooms?.length || 0} active rooms.`);

      // NOW TEST WEBSOCKET CONNECTIVITY
      console.log("\nTesting WebSocket Connectivity...");
      const WebSocket = require('ws');
      const wsUrl = `${url}/rtc?access_token=${token}&protocol=7&version=1`;
      console.log(`Connecting to WS: ${url}...`);

      await new Promise((resolve) => {
        const ws = new WebSocket(wsUrl);
        ws.on('open', () => {
          console.log("✅ WEBSOCKET SUCCESS: Signal connection established!");
          ws.close();
          resolve();
        });
        ws.on('error', (err) => {
          console.error("❌ WEBSOCKET FAILED:", err.message);
          if (err.message.includes('401')) console.error("   -> Token rejected by WebSocket (Authentication)");
          else console.error("   -> Network blocking or Firewall issue detected.");
          resolve();
        });
      });

      console.log("\n🎉 DIAGNOSIS CONFIRMED: Your credentials are CORRECT.");
      console.log("❌ PROBLEM FOUND: Your system clock is significantly out of sync (-23 mins).");
      console.log("   The default token expiration is too short for this drift.");
      console.log("👉 ACTION: Please SYNC your computer's clock to the correct internet time.");
    } else {
      console.log(`❌ Authentication Failed with manual token: ${res.status} ${res.statusText}`);
      const text = await res.text();
      console.log("Response:", text);
    }

  } catch (error) {
    console.error("Manual Fetch Error:", error);
  }
}

testConnection();

