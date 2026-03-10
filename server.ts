import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
      role TEXT DEFAULT 'client'
    );
    -- ... other tables ...
  `);
  // Re-run the full schema just in case
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
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("admin", "admin123", "admin");
}

// Seed a Test Client if not exists
const clientExists = db.prepare("SELECT * FROM users WHERE username = ?").get("client1");
if (!clientExists) {
  db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run("client1", "client123", "client");
}

async function startServer() {
  const app = express();
  app.use(express.json());
  // Logger Middleware
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    next();
  });

  // Auth API
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password) as any;
    if (user) {
      res.json({ id: user.id, username: user.username, role: user.role });
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  // Health Check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Helper: Call Local Ollama LLM
  async function callLocalLLM(prompt: string, format?: string) {
    try {
      if (typeof fetch === "undefined") {
        throw new Error("Native fetch not available");
      }

      const body: any = {
        model: "mistral",
        prompt: prompt,
        stream: false,
      };
      if (format) body.format = format;

      const response = await fetch("http://localhost:11434/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const data = await response.json();
        return data.response;
      }
    } catch (e) {
      console.log("Ollama not reachable.");
    }
    return null;
  }

  async function analyzeWithLocalLLM(content: string) {
    const prompt = `Analyze the following sensitive data and extract metrics for a federated privacy system. 
    Return ONLY a JSON object with these keys: risk_score (0-100), confidence (0-1), summary (short string), features (comma separated list).
    Data: ${content}`;
    
    const response = await callLocalLLM(prompt, "json");
    if (response) {
      try {
        return JSON.parse(response);
      } catch (e) {
        console.error("Failed to parse LLM response as JSON");
      }
    }

    // Fallback Simulation
    return {
      risk_score: Math.random() * 100,
      confidence: 0.7 + Math.random() * 0.3,
      features: ["BP", "Age", "History"].filter(() => Math.random() > 0.5).join(", "),
      summary: "Simulated analysis: Patient shows stable metrics with minor variations in historical data."
    };
  }

  // Chat API: Kani Chatbot
  app.post("/api/chat", async (req, res) => {
    const { message, history } = req.body;
    const systemPrompt = `You are Kani, a 24/7 privacy-focused AI assistant. 
    Your goal is to help users protect their sensitive data, explain privacy metrics, and guide them through the federated analysis process.
    Be professional, helpful, and act as an Agentic AI that can provide actionable advice on data anonymization and security.
    Keep responses concise but informative.`;

    const fullPrompt = `${systemPrompt}\n\nChat History:\n${history.map((h: any) => `${h.role}: ${h.content}`).join("\n")}\nUser: ${message}\nKani:`;
    
    const response = await callLocalLLM(fullPrompt);
    if (response) {
      res.json({ response });
    } else {
      res.json({ response: "I'm currently in offline mode (Ollama not detected). I can help you with general privacy advice: Always anonymize PII (Personally Identifiable Information) before sharing data!" });
    }
  });

  // Client API: Upload & Analyze
  app.post("/api/upload", async (req, res) => {
    const { clientId, content } = req.body;
    try {
      // 1. Save Raw Data locally (Privacy: This stays in the local node's DB)
      const result = db.prepare("INSERT INTO raw_data (client_id, content) VALUES (?, ?)").run(clientId, content);
      
      // 2. Perform Local Analysis (Mistral 7B)
      const analysis = await analyzeWithLocalLLM(content);

      // 3. Save Insights (This is what gets "shared" or aggregated)
      db.prepare("INSERT INTO insights (client_id, risk_score, confidence, summary, features) VALUES (?, ?, ?, ?, ?)")
        .run(clientId, analysis.risk_score, analysis.confidence, analysis.summary, analysis.features);

      res.json({ 
        success: true, 
        insight: { 
          riskScore: analysis.risk_score, 
          confidence: analysis.confidence, 
          summary: analysis.summary, 
          features: analysis.features 
        } 
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to process data" });
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
      const users = db.prepare("SELECT id, username, role FROM users").all();
      res.json(users);
    } catch (error) {
      console.error("Error fetching admin users:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/api/admin/users", (req, res) => {
    const { username, password, role } = req.body;
    try {
      db.prepare("INSERT INTO users (username, password, role) VALUES (?, ?, ?)").run(username, password, role);
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: "Username already exists" });
    }
  });

  app.delete("/api/admin/users/:id", (req, res) => {
    db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
    res.json({ success: true });
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
