# Quill ✒️ — An MCP-Native Blogging Platform

> **"Your blog dashboard is your editor. Talk to your blog the way you talk to your code."**

Quill is an MCP-first blogging platform built specifically for developers and technical writers. It eliminates context-switching to traditional CMS dashboards by exposing full blog management capabilities—drafting, editing, publishing, auto-scheduling, content validation, SEO optimization, and analytics tracking—directly to AI coding agents via the **Model Context Protocol (MCP)**.

It also includes a lightweight, server-rendered web dashboard that maintains complete parity with the MCP tools, acting as a durable second front door.

---

## 🔥 Key Highlights

- 🤖 **MCP-Native Workflow:** Manage your entire blog using natural language requests inside your IDE (Claude Code, Cursor, Windsurf, etc.).
- 🔄 **Tool-Dashboard Parity:** Every feature available as an MCP tool is mirrored in the companion web dashboard. Both share the exact same backend logic.
- 🔐 **Dual Auth System:** Session-based authentication for the web dashboard alongside isolated, rotatable API keys for MCP connections.
- 🛡️ **Security & Safety First:** Includes rate-limiting on write tools, tool-call audit logging, and server-side content safety validation.
- 🌐 **Public Read-Only Site:** Fast, minimal blog interface for readers without auth overhead.
- 📊 **Built-in Analytics:** Tracks post views and referral sources out of the box.

---

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Views:** EJS (Embedded JavaScript)
- **Protocol:** `@modelcontextprotocol/sdk` (Streamable HTTP)
- **Database:** SQLite
- **Authentication:** Express Sessions & Key Hashing

---

# 🚀 How to Run Quill Locally

Follow these step-by-step instructions to set up and run the Quill platform on your local machine.

---

### 📋 Prerequisites

Ensure you have the following installed on your system:
- **Node.js** (v18.x or higher)
- **npm** or **pnpm**
- **Git**

---

### 1️⃣ Clone the Repository

```bash
git clone [https://github.com/Mahnoor-shuaib/quill.git](https://github.com/Mahnoor-shuaib/quill.git)

cd quill

---

## 2️⃣ Install Dependencies

Install all required packages using npm:

`npm install`

---

## 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

`touch .env`

Add the following environment variables into `.env`:

PORT=3000
DATABASE_URL=quill.db
SESSION_SECRET=your_super_secret_session_key_here
NODE_ENV=development

---

## 4️⃣ Start the Server

Run the main server process:

`node src/server.js`

Once started, the application will be live at `http://localhost:3000`.

---

## 5️⃣ Accessing the Application

- **Web Dashboard:** Open `http://localhost:3000/dashboard` in your browser to sign up for an account or log in.
- **MCP Endpoint:** Upon signing up, you will receive a unique API Key. Your personal MCP connection URL will be: `http://localhost:3000/mcp?key=YOUR_API_KEY`
- **Public Blog:** Accessible directly at `http://localhost:3000/`.

---

## 6️⃣ Connecting to Your IDE Agent

Add the MCP server URL to your IDE configuration file (`mcpServers` section in Cursor, Claude Code, etc.):

{
  "mcpServers": {
    "quill-blog": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-sse",
        "http://localhost:3000/mcp?key=YOUR_API_KEY"
      ]
    }
  }
}


**Empower your writing workflow with Quill—where code and content seamlessly converge.**