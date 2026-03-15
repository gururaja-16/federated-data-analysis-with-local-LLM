import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import multer from "multer";
import * as XLSX from "xlsx";
import mammoth from "mammoth";
import fs from "fs";
import { createRequire } from "module";
import os from "os";
import bcrypt from "bcryptjs";
import twilio from "twilio";
import axios from "axios";
import { Ollama } from "ollama";

const require = createRequire(import.meta.url);
const pdf = require("pdf-parse");

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Multer configuration for ESM
const upload = multer({ dest: os.tmpdir() });

// Twilio Client
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN 
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null;

let db: any;
try {
  db = new Database("privacy_data.db");
  console.log("Database initialized successfully");
} catch (err) {
  console.error("Failed to initialize database:", err);
  // Fallback to in-memory if file fails
  db = new Database(":memory:");
  console.log("Falling back to in-memory database");
}

// Initialize Database
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      phone_number TEXT,
      otp_code TEXT,
      github_id TEXT UNIQUE,
      role TEXT DEFAULT 'client'
    );
  `);
  
  // Migration: Add phone_number, otp_code, and github_id if they don't exist
  const tableInfo = db.prepare("PRAGMA table_info(users)").all();
  const hasPhone = tableInfo.some((col: any) => col.name === 'phone_number');
  const hasOtp = tableInfo.some((col: any) => col.name === 'otp_code');
  const hasGithub = tableInfo.some((col: any) => col.name === 'github_id');
  
  if (!hasPhone) db.exec("ALTER TABLE users ADD COLUMN phone_number TEXT");
  if (!hasOtp) db.exec("ALTER TABLE users ADD COLUMN otp_code TEXT");
  if (!hasGithub) db.exec("ALTER TABLE users ADD COLUMN github_id TEXT");

  db.exec(`
    CREATE TABLE IF NOT EXISTS raw_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      content TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS insights (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER,
      risk_score REAL,
      confidence REAL,
      summary TEXT,
      features TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(client_id) REFERENCES users(id)
    );
  `);
} catch (err) {
  console.error("Failed to run schema:", err);
}

// Seed Admin if not exists
const adminExists = db.prepare("SELECT * FROM users WHERE username = ?").get("admin");
if (!adminExists) {
  const hashedPassword = bcrypt.hashSync("admin123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", hashedPassword, "admin");
}

// Seed a Test Client if not exists
const clientExists = db.prepare("SELECT * FROM users WHERE username = ?").get("client1");
if (!clientExists) {
  const hashedPassword = bcrypt.hashSync("client123", 10);
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("client1", hashedPassword, "client");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  // Logger Middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username) as any;
    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({ id: user.id, username: user.username, role: user.role, phone_number: user.phone_number });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { username, password, phone_number } = req.body;
    if (!username || !password) return res.status(400).json({ error: "Username and password required" });
    
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, phone_number, role) VALUES (?, ?, ?, ?)").run(username, hashedPassword, phone_number || null, "client");
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.post("/api/forgot-password", async (req, res) => {
    const { phone_number } = req.body;
    if (!phone_number) return res.status(400).json({ error: "Phone number required" });

    const user = db.prepare("SELECT * FROM users WHERE phone_number = ?").get(phone_number) as any;
    if (!user) return res.status(404).json({ error: "User not found with this phone number" });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.prepare("UPDATE users SET otp_code = ? WHERE id = ?").run(otp, user.id);

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        await twilioClient.messages.create({
          body: `Your Privacy Portal password reset code is: ${otp}`,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: phone_number
        });
        res.json({ success: true, message: "OTP sent via SMS" });
      } catch (error: any) {
        console.error("Twilio error:", error);
        res.status(500).json({ error: "Failed to send SMS", details: error.message });
      }
    } else {
      console.log(`[DEV MODE] OTP for ${phone_number}: ${otp}`);
      res.json({ success: true, message: "OTP generated (check server logs in dev mode)", devOtp: otp });
    }
  });

  app.post("/api/reset-password", (req, res) => {
    const { phone_number, otp, newPassword } = req.body;
    if (!phone_number || !otp || !newPassword) return res.status(400).json({ error: "Missing fields" });

    const user = db.prepare("SELECT * FROM users WHERE phone_number = ? AND otp_code = ?").get(phone_number, otp) as any;
    if (!user) return res.status(400).json({ error: "Invalid OTP or phone number" });

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.prepare("UPDATE users SET password = ?, otp_code = NULL WHERE id = ?").run(hashedPassword, user.id);
    res.json({ success: true });
  });

  // GitHub OAuth API
  app.get("/api/auth/github/url", (req, res) => {
    const clientId = process.env.GITHUB_CLIENT_ID;
    if (!clientId) return res.status(500).json({ error: "GitHub Client ID not configured" });

    const redirectUri = `${process.env.APP_URL || `http://localhost:3000`}/api/auth/github/callback`;
    const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=user:email`;
    res.json({ url });
  });

  app.get("/api/auth/github/callback", async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("Code missing");

    try {
      // Exchange code for token
      const tokenRes = await axios.post("https://github.com/login/oauth/access_token", {
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        code,
      }, {
        headers: { Accept: "application/json" }
      });

      const accessToken = tokenRes.data.access_token;
      if (!accessToken) throw new Error("Failed to get access token");

      // Get user info
      const userRes = await axios.get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      const githubUser = userRes.data;
      const githubId = githubUser.id.toString();
      const username = githubUser.login;

      // Check if user exists
      let user = db.prepare("SELECT * FROM users WHERE github_id = ?").get(githubId) as any;
      
      if (!user) {
        // Create new user if doesn't exist
        // Handle username collision
        let finalUsername = username;
        const existing = db.prepare("SELECT id FROM users WHERE username = ?").get(finalUsername);
        if (existing) {
          finalUsername = `${username}_gh_${githubId.substring(0, 4)}`;
        }

        db.prepare("INSERT INTO users (username, github_id, role) VALUES (?, ?, ?)").run(finalUsername, githubId, "client");
        user = db.prepare("SELECT * FROM users WHERE github_id = ?").get(githubId);
      }

      // Send success message to parent window and close popup
      res.send(`
        <html>
          <body>
            <script>
              if (window.opener) {
                window.opener.postMessage({ 
                  type: 'OAUTH_AUTH_SUCCESS', 
                  user: ${JSON.stringify({ id: user.id, username: user.username, role: user.role })} 
                }, '*');
                window.close();
              } else {
                window.location.href = '/';
              }
            </script>
            <p>Authentication successful. This window should close automatically.</p>
          </body>
        </html>
      `);
    } catch (error: any) {
      console.error("GitHub OAuth error:", error.response?.data || error.message);
      res.status(500).send("Authentication failed");
    }
  });

  // Health Check
  app.get("/api/health", async (req, res) => {
    try {
      db.prepare("SELECT 1").get();
      res.json({ 
        status: "ok", 
        db: "connected", 
        timestamp: new Date().toISOString() 
      });
    } catch (err: any) {
      res.status(500).json({ status: "error", db: "disconnected", error: err.message });
    }
  });

  // Ollama API: Proxy for local LLM
  app.post("/api/ollama/chat", async (req, res) => {
    const { host, model, messages } = req.body;
    try {
      const ollama = new Ollama({ host: host || "http://localhost:11434" });
      const response = await ollama.chat({
        model: model || "mistral",
        messages: messages,
        stream: false,
      });
      res.json(response);
    } catch (error: any) {
      console.error("Ollama error:", error);
      res.status(500).json({ error: "Failed to connect to local Ollama instance", details: error.message });
    }
  });

  app.post("/api/ollama/generate", async (req, res) => {
    const { host, model, prompt, system } = req.body;
    try {
      const ollama = new Ollama({ host: host || "http://localhost:11434" });
      const response = await ollama.generate({
        model: model || "mistral",
        prompt: prompt,
        system: system,
        stream: false,
        format: 'json'
      });
      res.json(response);
    } catch (error: any) {
      console.error("Ollama error:", error);
      res.status(500).json({ error: "Failed to connect to local Ollama instance", details: error.message });
    }
  });

  // Ollama functions removed

  // Chat API: Kani Chatbot (Now handled on frontend)
  app.post("/api/chat", async (req, res) => {
    res.status(410).json({ error: "Chat endpoint moved to frontend" });
  });

  // Client API: Upload and Extract Text
  app.post("/api/upload", upload.single("file"), async (req: any, res) => {
    console.log("POST /api/upload received");
    const { clientId } = req.body;
    const file = req.file;
    let content = req.body.content || "";

    try {
      if (file) {
        console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
        const filePath = file.path;
        const extension = path.extname(file.originalname).toLowerCase();

        if (extension === ".pdf") {
          const dataBuffer = fs.readFileSync(filePath);
          const data = await pdf(dataBuffer);
          content = data.text;
        } else if (extension === ".xlsx" || extension === ".xls" || extension === ".csv") {
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          content = XLSX.utils.sheet_to_csv(worksheet);
        } else if (extension === ".docx") {
          const result = await mammoth.extractRawText({ path: filePath });
          content = result.value;
        } else if (extension === ".txt" || extension === ".json") {
          content = fs.readFileSync(filePath, "utf-8");
        }

        // Clean up uploaded file
        fs.unlinkSync(filePath);
      }

      if (!content || content.trim() === "") {
        return res.status(400).json({ error: "No content found in file" });
      }

      // 1. Save Raw Data locally (Privacy: This stays in the local node's DB)
      db.prepare("INSERT INTO raw_data (client_id, content) VALUES (?, ?)").run(clientId, content);
      
      // Return content for frontend analysis
      res.json({ 
        success: true, 
        content: content.substring(0, 10000) // Limit content size for response
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process data" });
    }
  });

  // Client API: Save Insight (Analysis result from frontend)
  app.post("/api/save-insight", (req, res) => {
    const { clientId, riskScore, confidence, summary, features } = req.body;
    try {
      db.prepare("INSERT INTO insights (client_id, risk_score, confidence, summary, features) VALUES (?, ?, ?, ?, ?)")
        .run(clientId, riskScore, confidence, summary, features);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to save insight" });
    }
  });

  // Client API: Get Federated Comparison
  app.get("/api/client/federated-stats/:clientId", (req, res) => {
    const { clientId } = req.params;
    
    // Get client's latest insight
    const clientStats = db.prepare("SELECT risk_score, confidence FROM insights WHERE client_id = ? ORDER BY created_at DESC LIMIT 1").get(clientId) as any;
    
    // Get global averages (The "Federated" part)
    const globalStats = db.prepare("SELECT AVG(risk_score) as avgRisk, AVG(confidence) as avgConfidence FROM insights").get() as any;

    res.json({
      client: clientStats || { risk_score: 0, confidence: 0 },
      global: globalStats || { avgRisk: 0, avgConfidence: 0 }
    });
  });

  // Client API: Get Local History
  app.get("/api/client/history/:clientId", (req, res) => {
    const { clientId } = req.params;
    const history = db.prepare("SELECT * FROM insights WHERE client_id = ? ORDER BY created_at DESC").all(clientId);
    res.json(history);
  });

  // Admin API: Get All Activity
  app.get("/api/admin/activity", (req, res) => {
    try {
      const activity = db.prepare(`
        SELECT i.*, u.username 
        FROM insights i 
        JOIN users u ON i.client_id = u.id 
        ORDER BY i.created_at DESC
      `).all();
      res.json(activity);
    } catch (error) {
      console.error("Error fetching admin activity:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin API: Aggregated Metrics
  app.get("/api/admin/metrics", (req, res) => {
    try {
      const metrics = db.prepare(`
        SELECT 
          AVG(risk_score) as avgRisk, 
          AVG(confidence) as avgConfidence,
          COUNT(*) as totalAnalyses
        FROM insights
      `).get();
      res.json(metrics || { avgRisk: 0, avgConfidence: 0, totalAnalyses: 0 });
    } catch (error) {
      console.error("Error fetching admin metrics:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // Admin API: CRUD Users
  app.get("/api/admin/users", (req, res) => {
    try {
      const users = db.prepare("SELECT id, username, role, phone_number FROM users").all();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users", (req, res) => {
    const { username, password, role, phone_number } = req.body;
    try {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare("INSERT INTO users (username, password, role, phone_number) VALUES (?, ?, ?, ?)").run(username, hashedPassword, role, phone_number || null);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.put("/api/admin/users/:id", (req, res) => {
    const { username, password, role, phone_number } = req.body;
    const { id } = req.params;
    try {
      if (password) {
        const hashedPassword = bcrypt.hashSync(password, 10);
        db.prepare("UPDATE users SET username = ?, password = ?, role = ?, phone_number = ? WHERE id = ?").run(username, hashedPassword, role, phone_number || null, id);
      } else {
        db.prepare("UPDATE users SET username = ?, role = ?, phone_number = ? WHERE id = ?").run(username, role, phone_number || null, id);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Error updating user" });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Catch-all for API routes to prevent falling through to Vite SPA fallback
  app.all("/api/*", (req, res) => {
    const msg = `API Route not found: ${req.method} ${req.url}`;
    console.warn(msg);
    res.status(404).json({ error: msg });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = 3000;
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
