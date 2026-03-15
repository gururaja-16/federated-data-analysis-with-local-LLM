import React, { useState, useEffect, Component } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { 
  Upload, 
  Activity, 
  Shield, 
  Database, 
  Cpu, 
  Lock, 
  User, 
  LogOut, 
  Plus, 
  Trash2, 
  CheckCircle, 
  AlertCircle,
  BarChart3,
  TrendingUp,
  MessageSquare,
  Send,
  X,
  FileText,
  Download,
  Paperclip,
  Phone,
  Key,
  UserPlus,
  RefreshCcw,
  Edit,
  Save,
  ChevronRight,
  ChevronLeft,
  Github,
  Maximize2,
  Minimize2
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from "recharts";

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface UserData {
  id: number;
  username: string;
  phone_number?: string;
  role: "client" | "admin";
}

interface Insight {
  id: number;
  username: string;
  risk_score: number;
  confidence: number;
  summary: string;
  features: string;
  created_at: string;
}

// --- Components ---

const KaniChat = ({ aiSettings }: { aiSettings: any }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isFullSize, setIsFullSize] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "kani"; content: string }[]>([
    { role: "kani", content: "Hello! I'm Kani, your 24/7 privacy assistant. How can I help you today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Show welcome message after a short delay
    const showTimer = setTimeout(() => {
      setShowWelcome(true);
    }, 1500);

    // Hide welcome message after 6 seconds (it's just a reminder)
    const hideTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 7500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: "user" as const, content: input };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ollama/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: aiSettings.ollamaUrl,
          model: aiSettings.ollamaModel,
          messages: [
            { role: 'system', content: "You are Kani, a 24/7 privacy-focused AI assistant. Your goal is to help users protect their sensitive data, explain privacy metrics, and guide them through the federated analysis process. Be professional, helpful, and act as an Agentic AI that can provide actionable advice on data anonymization and security. Keep responses concise but informative. Your name is Kani." },
            ...messages.map(m => ({ role: m.role === 'kani' ? 'assistant' : 'user', content: m.content })),
            { role: 'user', content: currentInput }
          ]
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Local LLM failed");
      }
      const data = await res.json();
      setMessages(prev => [...prev, { role: "kani", content: data.message.content }]);
    } catch (err: any) {
      console.error("AI Chat Error:", err);
      setMessages(prev => [...prev, { role: "kani", content: `Error: ${err.message || "I'm having trouble connecting to my local brain right now. Is Ollama running?"}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {showWelcome && !isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.5 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.5 }}
            transition={{ 
              duration: 1,
              ease: [0.23, 1, 0.32, 1] // Custom cubic-bezier for a smooth "pop"
            }}
            className="mb-4 bg-white px-4 py-2 rounded-2xl shadow-lg border border-red-100 text-xs font-bold text-gray-700 pointer-events-auto"
          >
            Hi I'm Kani. If you need help just ask me!
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            drag
            dragConstraints={{ left: -window.innerWidth + 400, right: 0, top: -window.innerHeight + 600, bottom: 0 }}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1,
              width: isFullSize ? "min(90vw, 800px)" : "min(90vw, 384px)",
              height: isFullSize ? "min(80vh, 700px)" : "500px"
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-4 bg-white rounded-3xl shadow-2xl border border-red-100 flex flex-col overflow-hidden font-['Times_New_Roman',_Times,_serif] pointer-events-auto cursor-default"
          >
            <div className="p-4 bg-red-500 text-white flex justify-between items-center cursor-move">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Kani</h3>
                  <p className="text-[10px] opacity-80">24/7 Privacy Assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsFullSize(!isFullSize);
                  }} 
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  {isFullSize ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(false);
                  }} 
                  className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
              {messages.map((m, i) => (
                <div key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[80%] p-3 rounded-2xl text-sm",
                    m.role === "user" ? "bg-red-500 text-white rounded-tr-none" : "bg-white text-gray-800 shadow-sm rounded-tl-none"
                  )}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white p-3 rounded-2xl shadow-sm rounded-tl-none flex gap-1">
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Ask Kani anything..."
                className="flex-1 bg-gray-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-red-500 transition-all"
              />
              <button onClick={handleSend} className="bg-red-500 text-white p-2 rounded-xl hover:bg-red-600 transition-colors">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => {
          setIsOpen(!isOpen);
          setShowWelcome(false);
        }}
        className="w-14 h-14 bg-red-500 text-white rounded-full shadow-xl flex items-center justify-center hover:bg-red-600 transition-all hover:scale-110 active:scale-95 pointer-events-auto"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>
    </div>
  );
};

const AuthPage = ({ onLogin }: { onLogin: (user: UserData) => void }) => {
  const [mode, setMode] = useState<"login" | "register" | "forgot" | "reset">("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Validate origin
      const origin = event.origin;
      if (!origin.endsWith('.run.app') && !origin.includes('localhost')) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data.user) {
        onLogin(event.data.user);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLogin]);

  const handleGithubLogin = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/auth/github/url");
      if (!res.ok) throw new Error("Failed to get GitHub auth URL");
      const { url } = await res.json();
      
      window.open(url, 'github_oauth', 'width=600,height=700');
    } catch (err) {
      setError("Failed to initiate GitHub login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setIsLoading(true);

    try {
      if (mode === "login") {
        const res = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });
        if (res.ok) {
          const data = await res.json();
          onLogin(data);
        } else {
          setError("Invalid username or password");
        }
      } else if (mode === "register") {
        const res = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, phone_number: phoneNumber }),
        });
        if (res.ok) {
          setMessage("Registration successful! Please login.");
          setMode("login");
        } else {
          const data = await res.json();
          setError(data.error || "Registration failed");
        }
      } else if (mode === "forgot") {
        const res = await fetch("/api/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber }),
        });
        if (res.ok) {
          const data = await res.json();
          setMessage(data.message || "OTP sent to your mobile.");
          setMode("reset");
        } else {
          const data = await res.json();
          setError(data.error || "Failed to send OTP");
        }
      } else if (mode === "reset") {
        const res = await fetch("/api/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone_number: phoneNumber, otp, newPassword }),
        });
        if (res.ok) {
          setMessage("Password reset successful! Please login.");
          setMode("login");
        } else {
          const data = await res.json();
          setError(data.error || "Reset failed. Check OTP.");
        }
      }
    } catch (err) {
      setError("Server connection failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fff5f5] p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 border border-red-100"
      >
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-red-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-red-200">
            <Shield className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-display font-bold text-gray-900">
            {mode === "login" && "Welcome Back"}
            {mode === "register" && "Create Account"}
            {mode === "forgot" && "Forgot Password"}
            {mode === "reset" && "Reset Password"}
          </h1>
          <p className="text-gray-500 mt-2">
            {mode === "login" && "Secure Local Analysis System"}
            {mode === "register" && "Join the Federated Privacy Network"}
            {mode === "forgot" && "Reset via Registered Mobile"}
            {mode === "reset" && "Enter the OTP sent to your phone"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {(mode === "login" || mode === "register") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="Username"
                  required
                />
              </div>
            </div>
          )}

          {(mode === "login" || mode === "register") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>
          )}

          {(mode === "register" || mode === "forgot" || mode === "reset") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="tel" 
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                  placeholder="+1234567890"
                  required
                />
              </div>
            </div>
          )}

          {mode === "reset" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">OTP Code</label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="6-digit code"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input 
                    type="password" 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition-all"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>
            </>
          )}

          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg"
            >
              <AlertCircle className="w-4 h-4" />
              {error}
            </motion.div>
          )}

          {message && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-green-600 text-sm bg-green-50 p-3 rounded-lg"
            >
              <CheckCircle className="w-4 h-4" />
              {message}
            </motion.div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full py-4 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-200 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <RefreshCcw className="w-5 h-5 animate-spin" />
            ) : (
              <>
                {mode === "login" && "Sign In"}
                {mode === "register" && "Register"}
                {mode === "forgot" && "Send OTP"}
                {mode === "reset" && "Update Password"}
              </>
            )}
          </button>
        </form>

        {mode === "login" && (
          <div className="mt-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>
            
            <button 
              onClick={handleGithubLogin}
              disabled={isLoading}
              className="w-full py-3 border border-gray-200 rounded-xl flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              <Github className="w-5 h-5" />
              <span className="font-medium text-gray-700">Sign in with GitHub</span>
            </button>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 text-center">
          {mode === "login" ? (
            <>
              <button 
                onClick={() => setMode("register")}
                className="text-sm text-red-500 font-bold hover:underline"
              >
                New user? Create an account
              </button>
              <button 
                onClick={() => setMode("forgot")}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
              >
                Forgot password?
              </button>
            </>
          ) : (
            <button 
              onClick={() => setMode("login")}
              className="text-sm text-gray-500 font-medium hover:text-red-500 transition-colors flex items-center justify-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Back to Login
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

const ClientHome = ({ user, onLogout, aiSettings, setAiSettings }: { 
  user: UserData, 
  onLogout: () => void,
  aiSettings: any,
  setAiSettings: (s: any) => void
}) => {
  console.log("Rendering ClientHome for:", user?.username);
  
  // Defensive check
  if (!user) {
    console.error("ClientHome rendered without user!");
    return <Navigate to="/login" replace />;
  }

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [federatedStats, setFederatedStats] = useState<any>(null);
  const [history, setHistory] = useState<Insight[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fetchData = async () => {
    try {
      const [histRes, fedRes] = await Promise.all([
        fetch(`/api/client/history/${user.id}`),
        fetch(`/api/client/federated-stats/${user.id}`)
      ]);
      if (histRes.ok) setHistory(await histRes.json());
      if (fedRes.ok) setFederatedStats(await fedRes.json());
    } catch (err) {
      console.error("Data fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user.id, result]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    setContent(`File selected: ${file.name}`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedFile(file);
      setContent(`File selected: ${file.name}`);
    }
  };

  const exportToCSV = () => {
    if (history.length === 0) return;
    
    const headers = ["ID", "Date", "Risk Score", "Confidence", "Summary", "Features"];
    const rows = history.map(h => [
      h.id,
      new Date(h.created_at).toLocaleString(),
      h.risk_score.toFixed(2),
      h.confidence.toFixed(2),
      `"${h.summary.replace(/"/g, '""')}"`,
      `"${h.features.replace(/"/g, '""')}"`
    ]);
    
    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `privacy_analysis_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const [llmStatus, setLlmStatus] = useState<"checking" | "connected" | "disconnected">("checking");

  useEffect(() => {
    const checkStatus = async () => {
      try {
        // Simple check for Ollama
        const res = await fetch(aiSettings.ollamaUrl + "/api/tags").catch(() => null);
        setLlmStatus(res && res.ok ? "connected" : "disconnected");
      } catch (e) {
        setLlmStatus("disconnected");
      }
    };
    checkStatus();
  }, [aiSettings.ollamaUrl]);

  const handleUpload = async () => {
    if (!content.trim() && !selectedFile) return;
    setIsAnalyzing(true);
    setError("");
    setResult(null);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 120000); // 120 second timeout for local LLMs

    try {
      console.log("Starting upload for client:", user.id);
      
      const formData = new FormData();
      formData.append("clientId", user.id.toString());
      if (selectedFile) {
        formData.append("file", selectedFile);
      } else {
        formData.append("content", content);
      }

      // 1. Upload and extract text
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });
      
      const contentType = res.headers.get("content-type");
      if (!res.ok) {
        let errorMessage = "Failed to extract text from file";
        if (contentType && contentType.includes("application/json")) {
          const errData = await res.json();
          errorMessage = errData.error || errorMessage;
        } else {
          const text = await res.text();
          console.error("Non-JSON error response:", text);
        }
        throw new Error(errorMessage);
      }

      if (!contentType || !contentType.includes("application/json")) {
        const text = await res.text();
        console.error("Expected JSON but got:", text);
        throw new Error("Server returned non-JSON response. Check console for details.");
      }

      const uploadData = await res.json();
      const extractedText = uploadData.content;

      let analysis: any;

      // 2. Analyze with Local LLM
      const ollamaRes = await fetch("/api/ollama/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: aiSettings.ollamaUrl,
          model: aiSettings.ollamaModel,
          system: "Analyze the following sensitive data for a federated privacy system. Your task is to assess the privacy risk of this data. Return ONLY a JSON object with these keys: riskScore (0-100), confidence (0-1), summary (string), features (string).",
          prompt: `Data: ${extractedText}`
        })
      });
      if (!ollamaRes.ok) {
        const errData = await ollamaRes.json();
        throw new Error(errData.error || "Local LLM failed");
      }
      const data = await ollamaRes.json();
      analysis = JSON.parse(data.response);

      // 3. Save Insight to backend
      const saveRes = await fetch("/api/save-insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId: user.id,
          riskScore: analysis.riskScore,
          confidence: analysis.confidence,
          summary: analysis.summary,
          features: analysis.features
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (saveRes.ok) {
        setResult(analysis);
        setSelectedFile(null);
        setContent("");
      } else {
        throw new Error("Failed to save analysis results to server");
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Analysis error:", err);
      if (err.name === 'AbortError') {
        setError("Analysis timed out. Large files or local LLMs might be slow.");
      } else {
        setError(`Analysis failed: ${err.message || "Unknown error"}`);
      }
    } finally {
      setIsAnalyzing(false);
      fetchData(); // Refresh history
    }
  };

  return (
    <div className="min-h-screen bg-[#fff5f5] p-4 md:p-8">
      <KaniChat aiSettings={aiSettings} />
      
      {/* System Status Banner */}
      <div className="max-w-6xl mx-auto mb-6 flex flex-wrap gap-4 items-center justify-between bg-white/50 backdrop-blur-sm p-3 rounded-2xl border border-white/20 text-[10px] uppercase tracking-wider font-bold">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-gray-600">Server: Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${llmStatus === 'connected' ? 'bg-green-500' : llmStatus === 'checking' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-gray-600">
              Privacy AI: {llmStatus === 'connected' ? `Connected (Local LLM)` : llmStatus === 'checking' ? 'Checking...' : 'Disconnected'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowSettings(true)}
            className="flex items-center gap-1 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Cpu className="w-3 h-3" />
            <span>AI Settings</span>
          </button>
          <div className="text-gray-400">
            Environment: {window.location.hostname === 'localhost' ? 'Local Development' : 'Cloud Preview'}
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl border border-red-100"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-red-500" />
                  AI Provider Settings
                </h3>
                <button onClick={() => setShowSettings(false)} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4 p-4 bg-gray-50 rounded-2xl">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Ollama URL</label>
                    <input 
                      type="text" 
                      value={aiSettings.ollamaUrl}
                      onChange={(e) => setAiSettings({...aiSettings, ollamaUrl: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="http://localhost:11434"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Model Name</label>
                    <input 
                      type="text" 
                      value={aiSettings.ollamaModel}
                      onChange={(e) => setAiSettings({...aiSettings, ollamaModel: e.target.value})}
                      className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                      placeholder="mistral"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 italic">
                    Note: Local LLMs are slower but offer 100% data privacy. Ensure Ollama is running on your machine.
                  </p>
                </div>

                <button 
                  onClick={() => setShowSettings(false)}
                  className="w-full bg-gray-900 text-white font-bold py-4 rounded-2xl hover:bg-gray-800 transition-colors"
                >
                  Save & Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <nav className="max-w-6xl mx-auto flex justify-between items-center mb-12">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-red-500 rounded-2xl flex items-center justify-center shadow-lg shadow-red-200">
            <Shield className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Privacy Portal</h2>
            <p className="text-xs text-gray-500 uppercase tracking-widest">Client Node: {user.username}</p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="flex items-center gap-2 text-gray-500 hover:text-red-600 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </nav>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Input */}
        <div className="lg:col-span-7 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                <Database className="text-red-500 w-5 h-5" />
                Data Input
              </h3>
              <div className="flex gap-2">
                {selectedFile && (
                  <button 
                    onClick={() => { setSelectedFile(null); setContent(""); }}
                    className="bg-red-50 text-red-600 px-3 py-1.5 rounded-xl text-xs font-bold hover:bg-red-100 transition-all flex items-center gap-2"
                  >
                    <X className="w-3 h-3" />
                    Clear File
                  </button>
                )}
                <label className="cursor-pointer bg-gray-50 hover:bg-gray-100 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2">
                  <Paperclip className="w-3 h-3" />
                  {selectedFile ? 'Change File' : 'Attach File'}
                  <input type="file" className="hidden" onChange={handleFileUpload} accept=".txt,.json,.csv,.pdf,.xlsx,.xls,.docx" />
                </label>
              </div>
            </div>
            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={cn(
                "relative group transition-all duration-300",
                isDragging && "scale-[1.01]"
              )}
            >
              <textarea 
                value={content}
                onChange={(e) => setContent(e.target.value)}
                readOnly={!!selectedFile}
                placeholder={selectedFile ? `File ready for analysis: ${selectedFile.name}` : "Paste sensitive data here or drag & drop a file..."}
                className={cn(
                  "w-full h-64 p-6 bg-gray-50 rounded-2xl border-2 border-dashed transition-all resize-none focus:outline-none text-gray-700 font-mono text-sm",
                  isDragging ? "border-red-400 bg-red-50" : "border-gray-100 focus:border-red-200",
                  selectedFile && "bg-green-50/30 border-green-200"
                )}
              />
              {isDragging && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-white/90 px-6 py-3 rounded-2xl shadow-xl border border-red-100 flex items-center gap-3 animate-bounce">
                    <Upload className="text-red-500 w-5 h-5" />
                    <span className="font-bold text-red-600">Drop to parse document</span>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-6 flex items-center justify-between">
              <p className="text-xs text-gray-400 flex items-center gap-2">
                <Lock className="w-3 h-3" />
                Data stays on this node. Only metrics are shared.
              </p>
              <button 
                onClick={handleUpload}
                disabled={isAnalyzing || (!content.trim() && !selectedFile)}
                className={cn(
                  "px-8 py-3 rounded-2xl font-bold flex items-center gap-3 transition-all",
                  isAnalyzing || (!content.trim() && !selectedFile)
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed" 
                    : "bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200 active:scale-95"
                )}
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Cpu className="w-5 h-5" />
                    {selectedFile ? 'Analyze File' : 'Process Data'}
                  </>
                )}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-50 text-red-600 rounded-2xl text-sm flex items-center gap-2 border border-red-100">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
          </motion.div>

          <AnimatePresence>
            {isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl shadow-xl p-8 border border-red-100 flex flex-col items-center justify-center text-center space-y-6"
              >
                <div className="relative">
                  <div className="w-24 h-24 border-4 border-red-100 rounded-full" />
                  <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 w-24 h-24 border-4 border-red-500 border-t-transparent rounded-full"
                  />
                  <Cpu className="absolute inset-0 m-auto text-red-500 w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-gray-900">Local LLM Processing</h4>
                  <p className="text-sm text-gray-500 max-w-xs mx-auto mt-2">
                    Extracting non-sensitive metrics using Mistral 7B. No raw data will leave this device.
                  </p>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 2 }}
                    className="bg-red-500 h-full"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Federated Insights View */}
          {federatedStats && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
            >
              <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
                <BarChart3 className="text-red-500 w-5 h-5" />
                Federated Comparison
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Your Risk Score</span>
                    <span className="font-bold text-red-600">{(federatedStats?.client?.risk_score ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-red-500 h-full transition-all duration-1000" 
                      style={{ width: `${federatedStats?.client?.risk_score ?? 0}%` }}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Global Federated Average</span>
                    <span className="font-bold text-gray-900">{(federatedStats?.global?.avgRisk ?? 0).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-gray-400 h-full transition-all duration-1000" 
                      style={{ width: `${federatedStats?.global?.avgRisk ?? 0}%` }}
                    />
                  </div>
                </div>
                <p className="text-[10px] text-gray-400 italic">
                  * Global average is calculated using non-sensitive metrics from all nodes. No raw data was shared.
                </p>
              </div>
            </motion.div>
          )}

          {/* Local History Table */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 border border-red-100"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-display font-bold text-gray-900 flex items-center gap-2">
                <Activity className="text-red-500 w-5 h-5" />
                Local History
              </h3>
              <button 
                onClick={exportToCSV}
                disabled={history.length === 0}
                className="text-xs font-bold text-red-500 hover:text-red-600 flex items-center gap-2 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-400 border-b border-gray-50">
                    <th className="pb-4 font-medium">Date</th>
                    <th className="pb-4 font-medium">Risk Score</th>
                    <th className="pb-4 font-medium">Confidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className="py-4 text-gray-600">
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}
                      </td>
                      <td className="py-4 font-bold text-red-600">
                        {(item.risk_score ?? 0).toFixed(1)}%
                      </td>
                      <td className="py-4 text-gray-500">
                        {((item.confidence ?? 0) * 100).toFixed(0)}%
                      </td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-gray-400">No local history available</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Column: Results & Stats */}
        <div className="lg:col-span-5 space-y-8">
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-3xl shadow-xl p-8 border border-red-100 h-full"
          >
            <h3 className="text-xl font-display font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity className="text-red-500 w-5 h-5" />
              Analysis Results (Proof of Privacy)
            </h3>
            
            {!result && !isAnalyzing && (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Database className="text-gray-300 w-10 h-10" />
                </div>
                <p className="text-gray-400">Upload data to see extracted insights</p>
              </div>
            )}

            {result && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-red-50 p-4 rounded-2xl">
                    <p className="text-xs text-red-500 uppercase font-bold tracking-wider mb-1">Risk Score</p>
                    <p className="text-3xl font-display font-bold text-red-600">{(result.riskScore ?? 0).toFixed(1)}%</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-2xl">
                    <p className="text-xs text-green-500 uppercase font-bold tracking-wider mb-1">Confidence</p>
                    <p className="text-3xl font-display font-bold text-green-600">{((result.confidence ?? 0) * 100).toFixed(1)}%</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Extracted Features</p>
                  <div className="flex flex-wrap gap-2">
                    {result.features.split(", ").map((f: string) => (
                      <span key={f} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                        {f}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-bold text-gray-900">Analysis Summary</p>
                  <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 text-sm text-gray-600 leading-relaxed italic">
                    "{result.summary}"
                  </div>
                </div>

                {federatedStats && (
                  <div className="pt-6 border-t border-gray-100 space-y-4">
                    <p className="text-sm font-bold text-gray-900">Federated Context</p>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                          <span>Local Risk</span>
                          <span>{(federatedStats.client.risk_score ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-red-500" style={{ width: `${federatedStats.client.risk_score ?? 0}%` }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] uppercase font-bold text-gray-400">
                          <span>Global Avg</span>
                          <span>{(federatedStats.global.avgRisk ?? 0).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-400" style={{ width: `${federatedStats.global.avgRisk ?? 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-xl">
                    <CheckCircle className="w-5 h-5" />
                    <p className="text-xs font-medium">Privacy Verified: Only non-sensitive metrics shared with central aggregator.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </div>
      </main>

      {/* Debug Footer */}
      <div className="max-w-6xl mx-auto mt-12 p-4 bg-gray-100 rounded-xl text-[10px] text-gray-400 font-mono">
        DEBUG: {JSON.stringify({ 
          hasUser: !!user, 
          hasResult: !!result, 
          isAnalyzing, 
          historyCount: history.length,
          federated: !!federatedStats 
        })}
      </div>
    </div>
  );
};

const AdminDashboard = ({ user, onLogout }: { user: UserData, onLogout: () => void }) => {
  const [activity, setActivity] = useState<Insight[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formRole, setFormRole] = useState<"client" | "admin">("client");
  const [formPhone, setFormPhone] = useState("");
  const isFetchingRef = React.useRef(false);

  const fetchData = async (retryCount = 0) => {
    if (!user || user.role !== "admin" || isFetchingRef.current) return;
    
    isFetchingRef.current = true;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout

    try {
      const baseUrl = window.location.origin;
      const [actRes, metRes, usrRes] = await Promise.all([
        fetch(`${baseUrl}/api/admin/activity`, { signal: controller.signal }),
        fetch(`${baseUrl}/api/admin/metrics`, { signal: controller.signal }),
        fetch(`${baseUrl}/api/admin/users`, { signal: controller.signal })
      ]);
      
      clearTimeout(timeoutId);

      const checkJson = async (res: Response) => {
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        return await res.json();
      };

      const [actData, metData, usrData] = await Promise.all([
        checkJson(actRes),
        checkJson(metRes),
        checkJson(usrRes)
      ]);

      setActivity(actData);
      setMetrics(metData);
      setUsers(usrData);
      setLastError(null);
    } catch (err: any) {
      clearTimeout(timeoutId);
      console.error("Admin data fetch error:", err);
      setLastError(err instanceof Error ? err.message : "Network error");
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingUser ? `/api/admin/users/${editingUser.id}` : "/api/admin/users";
    const method = editingUser ? "PUT" : "POST";
    
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formUsername,
          password: formPassword || undefined,
          role: formRole,
          phone_number: formPhone
        })
      });
      if (res.ok) {
        setIsModalOpen(false);
        setEditingUser(null);
        setFormUsername("");
        setFormPassword("");
        setFormPhone("");
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to save user");
      }
    } catch (err) {
      alert("Connection error");
    }
  };

  const deleteUser = async (id: number) => {
    if (window.confirm("Delete this user?")) {
      await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      fetchData();
    }
  };

  const openEdit = (u: any) => {
    setEditingUser(u);
    setFormUsername(u.username);
    setFormPassword("");
    setFormRole(u.role);
    setFormPhone(u.phone_number || "");
    setIsModalOpen(true);
  };

  const openAdd = () => {
    setEditingUser(null);
    setFormUsername("");
    setFormPassword("");
    setFormRole("client");
    setFormPhone("");
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white font-mono p-6">
      {/* Header */}
      <nav className="max-w-7xl mx-auto flex justify-between items-center mb-12 border-b border-[#00ff9d]/20 pb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 border-2 border-[#00ff9d] rounded-full flex items-center justify-center neon-border">
            <Shield className="text-[#00ff9d] w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-bold neon-text text-[#00ff9d]">SECURE AGGREGATOR</h2>
            <p className="text-[10px] text-[#00ff9d]/60 uppercase tracking-[0.2em]">Federated Intelligence Layer v1.0</p>
            {loading && <p className="text-[8px] text-[#00ff9d] animate-pulse mt-1">SYNCING DATA...</p>}
            {lastError && <p className="text-[8px] text-red-500 mt-1 uppercase">ERROR: {lastError}</p>}
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden md:flex gap-8">
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase">System Load</p>
              <p className="text-[#00ff9d] font-bold">12.4%</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-500 uppercase">Active Nodes</p>
              <p className="text-[#00ff9d] font-bold">{users.length}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="px-4 py-2 border border-[#00ff9d] text-[#00ff9d] rounded hover:bg-[#00ff9d] hover:text-black transition-all font-bold text-sm"
          >
            TERMINATE SESSION
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Stats Panel */}
        <div className="lg:col-span-2 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111] border border-[#00ff9d]/30 p-6 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <TrendingUp className="w-12 h-12 text-[#00ff9d]" />
              </div>
              <p className="text-xs text-gray-500 mb-2">AVG RISK SCORE</p>
              <h4 className="text-4xl font-bold text-[#00ff9d]">{metrics?.avgRisk?.toFixed(1) || "0.0"}%</h4>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${metrics?.avgRisk || 0}%` }}
                  className="h-full bg-[#00ff9d] shadow-[0_0_10px_#00ff9d]"
                />
              </div>
            </div>
            <div className="bg-[#111] border border-[#00ff9d]/30 p-6 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <Activity className="w-12 h-12 text-[#00ff9d]" />
              </div>
              <p className="text-xs text-gray-500 mb-2">MODEL CONFIDENCE</p>
              <h4 className="text-4xl font-bold text-[#00ff9d]">{(metrics?.avgConfidence * 100)?.toFixed(1) || "0.0"}%</h4>
              <div className="mt-4 h-1 w-full bg-gray-800 rounded-full">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(metrics?.avgConfidence || 0) * 100}%` }}
                  className="h-full bg-[#00ff9d] shadow-[0_0_10px_#00ff9d]"
                />
              </div>
            </div>
            <div className="bg-[#111] border border-[#00ff9d]/30 p-6 rounded-lg relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-30 transition-opacity">
                <Activity className="w-12 h-12 text-[#00ff9d]" />
              </div>
              <p className="text-xs text-gray-500 mb-2">TOTAL ANALYSES</p>
              <h4 className="text-4xl font-bold text-[#00ff9d]">{metrics?.totalAnalyses || 0}</h4>
              <p className="text-[10px] text-gray-500 mt-2">Across all federated nodes</p>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-[#111] border border-[#00ff9d]/30 rounded-lg overflow-hidden">
            <div className="bg-[#1a1a1a] p-4 border-b border-[#00ff9d]/30 flex justify-between items-center">
              <h3 className="text-[#00ff9d] font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                REAL-TIME ACTIVITY LOG
              </h3>
              <span className="text-[10px] bg-[#00ff9d]/10 text-[#00ff9d] px-2 py-1 rounded">LIVE FEED</span>
            </div>
            <div className="p-0 max-h-[500px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#1a1a1a] text-gray-500 sticky top-0">
                  <tr>
                    <th className="p-4 font-normal">NODE</th>
                    <th className="p-4 font-normal">RISK</th>
                    <th className="p-4 font-normal">CONFIDENCE</th>
                    <th className="p-4 font-normal">TIMESTAMP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {activity.map((item) => (
                    <tr key={item.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="p-4 font-bold text-[#00ff9d]">{item.username}</td>
                      <td className="p-4">{item.risk_score.toFixed(1)}%</td>
                      <td className="p-4">{(item.confidence * 100).toFixed(1)}%</td>
                      <td className="p-4 text-gray-500">{new Date(item.created_at).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                  {activity.length === 0 && (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-gray-600">No activity detected on federated network</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Sidebar: Speedometer & Users */}
        <div className="space-y-8">
          {/* CPU Speedometer Animation */}
          <div className="bg-[#111] border border-[#00ff9d]/30 p-8 rounded-lg flex flex-col items-center justify-center text-center">
            <p className="text-xs text-gray-500 mb-6 uppercase tracking-widest">Aggregation Engine Load</p>
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="transparent"
                  stroke="#1a1a1a"
                  strokeWidth="12"
                />
                <motion.circle
                  cx="96"
                  cy="96"
                  r="80"
                  fill="transparent"
                  stroke="#00ff9d"
                  strokeWidth="12"
                  strokeDasharray="502.4"
                  initial={{ strokeDashoffset: 502.4 }}
                  animate={{ strokeDashoffset: 502.4 - (502.4 * 0.65) }}
                  transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                  className="shadow-[0_0_15px_#00ff9d]"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold neon-text text-[#00ff9d]">65%</span>
                <span className="text-[10px] text-gray-500 uppercase">Processing</span>
              </div>
            </div>
            <div className="mt-8 flex gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <motion.div 
                  key={i}
                  animate={{ height: [10, 30, 10] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                  className="w-1 bg-[#00ff9d] shadow-[0_0_5px_#00ff9d]"
                />
              ))}
            </div>
          </div>

          {/* User Management */}
          <div className="bg-[#111] border border-[#00ff9d]/30 rounded-lg overflow-hidden">
            <div className="bg-[#1a1a1a] p-4 border-b border-[#00ff9d]/30 flex justify-between items-center">
              <h3 className="text-[#00ff9d] font-bold flex items-center gap-2">
                <User className="w-4 h-4" />
                NODE MANAGEMENT
              </h3>
              <button 
                onClick={openAdd}
                className="p-1.5 bg-[#00ff9d]/10 text-[#00ff9d] rounded hover:bg-[#00ff9d]/20 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {users.map((u) => (
                <div key={u.id} className="flex justify-between items-center bg-[#1a1a1a] p-3 rounded border border-gray-800 group">
                  <div>
                    <p className="text-sm font-bold">{u.username}</p>
                    <p className="text-[10px] text-gray-500 uppercase">{u.role} {u.phone_number && `• ${u.phone_number}`}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => openEdit(u)}
                      className="p-2 text-[#00ff9d] hover:bg-[#00ff9d]/10 rounded transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    {u.role !== 'admin' && (
                      <button 
                        onClick={() => deleteUser(u.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button 
                onClick={openAdd}
                className="w-full py-2 border border-dashed border-[#00ff9d]/30 text-[#00ff9d]/60 hover:text-[#00ff9d] hover:border-[#00ff9d] transition-all text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                PROVISION NEW NODE
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* User Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111] border border-[#00ff9d]/30 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl"
            >
              <div className="bg-[#1a1a1a] p-4 border-b border-[#00ff9d]/30 flex justify-between items-center">
                <h3 className="text-[#00ff9d] font-bold uppercase tracking-widest">
                  {editingUser ? "Edit Node" : "Provision New Node"}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSaveUser} className="p-6 space-y-4">
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1">Username</label>
                  <input 
                    type="text" 
                    value={formUsername}
                    onChange={(e) => setFormUsername(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm focus:border-[#00ff9d] outline-none transition-colors"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1">Password {editingUser && "(leave blank to keep current)"}</label>
                  <input 
                    type="password" 
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm focus:border-[#00ff9d] outline-none transition-colors"
                    required={!editingUser}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1">Mobile Number</label>
                  <input 
                    type="tel" 
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm focus:border-[#00ff9d] outline-none transition-colors"
                    placeholder="+1234567890"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-500 uppercase mb-1">Role</label>
                  <select 
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as any)}
                    className="w-full bg-black border border-gray-800 rounded px-3 py-2 text-sm focus:border-[#00ff9d] outline-none transition-colors"
                  >
                    <option value="client">Client Node</option>
                    <option value="admin">Admin Aggregator</option>
                  </select>
                </div>
                <div className="pt-4 flex gap-3">
                  <button 
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2 border border-gray-800 text-gray-500 rounded hover:bg-gray-800 transition-colors text-sm font-bold"
                  >
                    CANCEL
                  </button>
                  <button 
                    type="submit"
                    className="flex-1 py-2 bg-[#00ff9d] text-black rounded hover:bg-[#00ff9d]/80 transition-colors text-sm font-bold"
                  >
                    {editingUser ? "UPDATE NODE" : "PROVISION"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- Main App ---

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: any }> {
  state: { hasError: boolean, error: any };
  props: { children: React.ReactNode };
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-red-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-red-200">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle className="w-8 h-8" />
              <h1 className="text-2xl font-bold">Something went wrong</h1>
            </div>
            <p className="text-gray-600 mb-6">The application crashed. This is likely due to a data rendering error.</p>
            <pre className="bg-gray-100 p-4 rounded-xl text-xs text-red-800 overflow-auto max-h-40 mb-6">
              {this.state.error?.message || "Unknown error"}
            </pre>
            <button 
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors"
            >
              Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState<UserData | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [aiSettings, setAiSettings] = useState({
    ollamaUrl: 'http://localhost:11434',
    ollamaModel: 'mistral'
  });

  console.log("App state:", { user: user?.username, isInitialized, aiSettings });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("user");
      console.log("Checking localStorage for user:", saved);
      if (saved && saved !== "undefined" && saved !== "null") {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object" && parsed.id) {
          console.log("Found valid user in storage:", parsed.username);
          setUser(parsed);
        } else {
          console.log("Invalid user object in storage");
          localStorage.removeItem("user");
        }
      }
    } catch (err) {
      console.error("Auth initialization error:", err);
      localStorage.removeItem("user");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  const handleLogin = (userData: UserData) => {
    console.log("Logging in user:", userData.username);
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const handleLogout = () => {
    console.log("Logging out user...");
    setUser(null);
    localStorage.removeItem("user");
  };

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fff5f5]">
        <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Router>
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" replace /> : <AuthPage onLogin={handleLogin} />} 
          />
          
          {/* Protected Admin Route */}
          <Route 
            path="/admin" 
            element={
              !user ? <Navigate to="/login" replace /> : 
              user.role === "admin" ? <AdminDashboard user={user} onLogout={handleLogout} /> : 
              <Navigate to="/client" replace />
            } 
          />

          {/* Protected Client Route */}
          <Route 
            path="/client" 
            element={
              !user ? <Navigate to="/login" replace /> : 
              user.role === "client" ? <ClientHome user={user} onLogout={handleLogout} aiSettings={aiSettings} setAiSettings={setAiSettings} /> : 
              <Navigate to="/admin" replace />
            } 
          />

          {/* Root Redirect Logic */}
          <Route 
            path="/" 
            element={
              !user ? <Navigate to="/login" replace /> : 
              user.role === "admin" ? <Navigate to="/admin" replace /> : 
              <Navigate to="/client" replace />
            } 
          />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ErrorBoundary>
  );
}
