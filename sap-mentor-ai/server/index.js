import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Load environment variables
dotenv.config({ path: new URL('./.env', import.meta.url).pathname });

const app = express();
const PORT = process.env.PORT || 5001;

// Enable CORS and JSON parsing
app.use(cors());
app.use(express.json());

// Initialize Google Gemini API
const getApiKey = () => {
  return (process.env.GEMINI_API_KEY || "").trim();
};

// Check API key configuration helper
const getGeminiClient = (res) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    res.status(400).json({
      error: "Google Gemini API Key is missing.",
      message: "Please configure your GEMINI_API_KEY in the server's `.env` file to start generating SAP learning guides.",
      isConfigError: true
    });
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

// Helper to get active models in preference order
const getSupportedModelsList = async () => {
  const fallbackModels = [
    'gemini-1.5-flash',
    'gemini-flash-latest',
    'gemini-1.5-pro',
    'gemini-pro-latest',
    'gemini-2.5-flash',
    'gemini-2.0-flash',
    'gemini-2.0-flash-lite'
  ];

  try {
    const apiKey = getApiKey();
    if (!apiKey) return fallbackModels;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
    
    if (typeof fetch === 'function') {
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data.models && Array.isArray(data.models)) {
          const names = data.models.map(m => m.name.replace('models/', ''));
          console.log("🔍 API Reported Supported Models:", names);
          
          const flashModels = names
            .filter(n => /gemini-\d+(?:\.\d+)?-flash(?:-latest)?$/.test(n))
            .filter(n => !n.startsWith('gemini-3'))
            .sort((a, b) => {
              const getVer = (str) => {
                const match = str.match(/gemini-(\d+(?:\.\d+)?)-flash/);
                return match ? parseFloat(match[1]) : 0;
              };
              if (a.endsWith('-latest') && !b.endsWith('-latest')) return -1;
              if (b.endsWith('-latest') && !a.endsWith('-latest')) return 1;
              return getVer(b) - getVer(a);
            });

          if (flashModels.length > 0) {
            const combined = [...new Set([...flashModels, ...fallbackModels])];
            console.log("💡 Model preference list:", combined);
            return combined;
          }
        }
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not dynamically list models from Google API:", err.message);
  }

  return fallbackModels;
};

// Robust helper to parse JSON response, removing potential markdown wrapper
const parseJSONResponse = (text) => {
  if (!text || typeof text !== 'string') {
    throw new Error("Invalid or empty response text");
  }
  
  const startIdx = text.indexOf('{');
  const endIdx = text.lastIndexOf('}');
  
  if (startIdx !== -1 && endIdx !== -1 && endIdx > startIdx) {
    const jsonString = text.substring(startIdx, endIdx + 1);
    try {
      return JSON.parse(jsonString);
    } catch (parseError) {
      console.warn("⚠️ Targeted JSON block parsing failed, trying full cleanup fallback. Error:", parseError.message);
    }
  }
  
  const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
  return JSON.parse(cleanText);
};

// Helper to generate content with timeout
const generateContentWithTimeout = async (model, prompt, timeoutMs = 70000) => {
  const timeoutPromise = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Gemini API request timed out")), timeoutMs)
  );
  return Promise.race([
    model.generateContent(prompt),
    timeoutPromise
  ]);
};

// ============================================================================
// HIGH-FIDELITY LOCAL MOCK DATA FALLBACK ENGINE
// ============================================================================
const getMockDataForTopic = (topic) => {
  const t = topic.toLowerCase();
  
  if (t.includes("trial") || t.includes("btp cockpit") || t.includes("create account") || t.includes("start trial")) {
    return {
      "overview": "An SAP BTP Free Trial Account is a personal sandbox environment in the cloud, allowing developers to explore SAP's cloud services, runtime environments, and Integration Suite completely free. It provides a default trial global account and a pre-configured subaccount with Cloud Foundry capabilities.",
      "components": [
        { "name": "SAP Universal ID", "role": "Authentication", "description": "The unified identity service for logging into SAP properties, portal accounts, and BTP trial registration." },
        { "name": "BTP Global Account", "role": "Top-Level Account Container", "description": "The parent container for organizing subaccounts, regional settings, user authorizations, and service entitlements." },
        { "name": "Trial Subaccount", "role": "Resource Organizer", "description": "A logical division where developers deploy cloud runtimes, subscribe to integrations, and configure security parameters." },
        { "name": "Cloud Foundry Environment", "role": "Runtime Environment", "description": "The standard open runtime container enabling deployment of web services, security materials, and SAP CPI instances." }
      ],
      "steps": [
        { "step": 1, "title": "Navigate to BTP Trial Portal", "description": "Open your browser and navigate to the SAP BTP Free Trial registration homepage. Click on 'Start your free trial' to initiate account setup.", "proTip": "Bookmark cockpit.hanatrial.ondemand.com/trial/#/home/trial for direct portal access in the future." },
        { "step": 2, "title": "Sign Up with SAP Universal ID", "description": "Log in with your existing S-user/P-user, or register for a new SAP Universal ID. Fill in your business email, name, and activate via the verification link sent to your inbox.", "proTip": "Use a personal or business email that isn't already tied to an active corporate commercial subaccount." },
        { "step": 3, "title": "Provision Global Account & Select Region", "description": "Log in to BTP. Choose your regional host (US East AWS or Frankfurt AWS) and click 'Create Account' to start tenant provisioning.", "proTip": "Frankfurt (eu10) or US East (us10) are recommended as they support the widest assortment of trial service integrations." },
        { "step": 4, "title": "Enable Cloud Foundry Environment", "description": "Inside your subaccount overview panel, click 'Enable Cloud Foundry'. Define an Org Name and space name (e.g. 'dev') to establish your deployment workspace.", "proTip": "Cloud Foundry environment is mandatory for running Integration Suite and subscription endpoints." }
      ],
      "uiInstructions": [
        { "step": 1, "screen": "Web Browser -> SAP BTP trial", "action": "Navigate to BTP Trial page", "details": "Click 'Start Free Trial' or 'Get Started' to enter identity enrollment." },
        { "step": 2, "screen": "SAP Universal ID Login", "action": "Enter username/email and credentials", "details": "For new users, fill in first name, last name, and select country. Verify code from email." },
        { "step": 3, "screen": "BTP Setup Wizard", "action": "Select region 'US East (VA) - AWS' and click 'Create Account'", "details": "Do not refresh while BTP initializes your Global Account (1-2 minutes)." },
        { "step": 4, "screen": "BTP Cockpit -> Subaccount -> Environments", "action": "Click 'Enable Cloud Foundry'", "details": "Specify Space Name as 'dev' and click Create to establish runtime folder." }
      ],
      "commonMistakes": [
        { "mistake": "Unverified SAP ID Email Link", "impact": "Unable to log in to cockpit or provision services.", "fix": "Check email junk folder and click 'Verify Email Address' link before BTP cockpit sign-in." },
        { "mistake": "Skipping Cloud Foundry enablement", "impact": "Service Marketplace does not list Integration Suite subscriptions.", "fix": "Go to Subaccount Overview and click 'Enable Cloud Foundry' prior to searching marketplace." }
      ],
      "videoScript": "Welcome to BTP! Let's set up your trial subaccount. First, sign up using your SAP ID at the trial landing page. Choose US East AWS region, provision the global account, and enable Cloud Foundry in the subaccount overview to access Integration Suite.",
      "iflowPlan": [
        { "id": "node1", "name": "User Browser", "type": "sender", "description": "Initiates sign-up request" },
        { "id": "node2", "name": "SAP ID Auth", "type": "processor", "description": "Authenticates user credentials" },
        { "id": "node3", "name": "BTP Cockpit Wizard", "type": "processor", "description": "Provisions global account resources" },
        { "id": "node4", "name": "Cloud Foundry Runtime", "type": "adapter", "description": "Enables dev space environments" },
        { "id": "node5", "name": "BTP Trial Dashboard", "type": "receiver", "description": "Subaccount dashboard is ready" }
      ],
      "simulationLogs": [
        "🤖 [1/6] Booting BTP Trial setup engine...",
        "🔒 Authenticating SAP ID with identity provider...",
        "⚙️ [2/6] Provisioning Global Account ID: GA_TRIAL_USER...",
        "⚙️ [3/6] Creating default subaccount 'trial' in US East (us10)...",
        "⚙️ [4/6] Activating Cloud Foundry Runtime environment...",
        "✅ [5/6] Dev space 'dev' established with Space Developer permissions.",
        "🎉 BTP Cockpit ready! Subaccount activated successfully."
      ]
    };
  }

  // SFTP Adapter topic
  if (t.includes("sftp") || t.includes("secure file") || t.includes("file transfer")) {
    return {
      "overview": "The SAP CPI SFTP Adapter is used to securely connect to external SFTP servers to read (sender) or write (receiver) files using SSH file transfer protocols. It ensures secure transport encryption for invoices, orders, and payroll master files.",
      "components": [
        { "name": "SFTP Sender Adapter", "role": "Sender", "description": "Polls directory on a remote SFTP server at scheduled intervals, converting files into integration messages." },
        { "name": "SFTP Receiver Adapter", "role": "Receiver", "description": "Connects to remote SFTP folder and creates/overwrites files using payload message data." },
        { "name": "Security Material (Credential)", "role": "Processing", "description": "Stores user ID and password details securely in the keystore to authenticate adapter connections." }
      ],
      "steps": [
        { "step": 1, "title": "Create User Credential in Monitor", "description": "Navigate to Monitor -> Security Material. Click Create -> User Credential. Set Name as 'SFTP_CONN_CRED', and enter remote SFTP user credentials.", "proTip": "Always use SSH Keys (Key Pair) instead of plaintext passwords in production environments for superior protection." },
        { "step": 2, "title": "Configure SFTP Sender Adapter", "description": "Add SFTP Adapter to the sender block. Set host name (e.g. sftp.trial.sap.com), port 22, and Credential Name 'SFTP_CONN_CRED'. Choose polling interval and post-processing delete folder.", "proTip": "Ensure the polling user has write/delete permissions on the SFTP target folder to enable post-processing delete actions." },
        { "step": 3, "title": "Configure SFTP Receiver Adapter", "description": "Add SFTP adapter to receiver system. Set address, port, and Credential Name. Under processing tab, enter target directory path and file name pattern.", "proTip": "Use dynamic headers like ${header.SAP_SFTP_Filename} to write original file names to the target receiver system." }
      ],
      "uiInstructions": [
        { "step": 1, "screen": "Monitor -> Security Material", "action": "Click Create -> User Credential", "details": "Enter Name: SFTP_CONN_CRED, username: sftp_user, and password credentials." },
        { "step": 2, "screen": "Design -> iFlow -> Sender Adapter", "action": "Select Adapter Type: SFTP", "details": "Connection Tab: set Host and Port. Processing Tab: Set polling folder /inbox and file wildcard *.xml." },
        { "step": 3, "screen": "Design -> iFlow -> Receiver Adapter", "action": "Select Adapter Type: SFTP", "details": "Set target directory /outbox, write mode: Create, and select credential alias." }
      ],
      "commonMistakes": [
        { "mistake": "Wrong SFTP Credential Name", "impact": "Runtime authorization fails with 401 Authentication Error.", "fix": "Verify that the Credential Name field matches the exact alias created in Security Material." },
        { "mistake": "Missing Host Key Verification", "impact": "Connection closes immediately during handshake.", "fix": "Download the SFTP server public key and add it to the SAP Keystore or run a connectivity test to authorize the host." }
      ],
      "videoScript": "Today we configure the SFTP adapter. First, create a User Credential named 'SFTP_CONN_CRED' in the Security Material vault. In your iFlow, select SFTP type, connect it to the sender directory, set the credential alias, and deploy your flow to start polling.",
      "iflowPlan": [
        { "id": "node1", "name": "SFTP Source", "type": "sender", "description": "Holds target files" },
        { "id": "node2", "name": "SFTP Sender Channel", "type": "adapter", "description": "Polls remote directories" },
        { "id": "node3", "name": "Message Mapper", "type": "mapper", "description": "Transforms XML payloads" },
        { "id": "node4", "name": "SFTP Receiver Channel", "type": "adapter", "description": "Writes output files" },
        { "id": "node5", "name": "SFTP Target", "type": "receiver", "description": "Receives processed outputs" }
      ],
      "simulationLogs": [
        "🤖 [1/6] Booting SFTP Integration compiler...",
        "🔒 Resolving credential alias 'SFTP_CONN_CRED' from CPI keystore...",
        "⚙️ [2/6] Binding SFTP Sender adapter to host 'sftp.trial.sap.com:22'...",
        "⚙️ [3/6] Setting polling path to '/inbox' with wildcard filter '*.*'...",
        "⚙️ [4/6] Configuring SFTP Receiver write path to '/outbox'...",
        "🚀 [5/6] Deploying Integration Flow to active runtime node...",
        "✅ Integration Flow active. Poller running successfully."
      ]
    };
  }

  // Generic fallback topic
  return {
    "overview": `This guide covers the deployment and orchestration of ${topic} inside the SAP Integration Suite. It maps connections, credentials setup, and data routing paths according to SAP best practices.`,
    "components": [
      { "name": "Sender System", "role": "Sender", "description": "The client system or application generating requests." },
      { "name": "Integration Router", "role": "Processing", "description": "SAP CPI runtime node evaluating payload content and directing flows." },
      { "name": "Receiver Endpoint", "role": "Receiver", "description": "The target API or storage server receiving processed messages." }
    ],
    "steps": [
      { "step": 1, "title": "Configure Security and Authorizations", "description": `Provision connection authorization and client credentials for the topic: ${topic}.`, "proTip": "Always verify network firewalls and SSL certificates before creating connection objects." },
      { "step": 2, "title": "Deploy Integration Flow Routing", "description": "Place appropriate adapters on the canvas, establish route channels, and verify payload mappings.", "proTip": "Utilize mock payloads in the canvas debugger to check variables prior to deployment." },
      { "step": 3, "title": "Verify Runtime Message Log", "description": "Deploy flow, trigger outbound message tests, and inspect the Message Processing Logs.", "proTip": "If errors occur, verify payload encoding formats (UTF-8) and network ports." }
    ],
    "uiInstructions": [
      { "step": 1, "screen": "Monitor -> Security Material", "action": "Click Create -> User Credential", "details": "Configure auth credentials named DEV_CREDS." },
      { "step": 2, "screen": "Design -> Edit Canvas", "action": "Add routing channel and select adapters", "details": "Define path and payload mapping files." },
      { "step": 3, "screen": "Monitor -> MPL Ticker", "action": "Filter logs by iFlow name and inspect traces", "details": "Check for HTTP 200 or green processing markers." }
    ],
    "commonMistakes": [
      { "mistake": "Unresolved network route", "impact": "Connection Timeout / Socket Exception", "fix": "Configure IP range allowance in BTP cockpit or white-list recipient host IP." }
    ],
    "videoScript": `In this video, we deploy integration steps for ${topic}. First, set up authorization and security artifacts. Then, draw your adapters on the CPI Design canvas, configure routing directories, and deploy your flow. Monitor messages via MPL to verify successful execution.`,
    "iflowPlan": [
      { "id": "node1", "name": "Outbound Sender", "type": "sender", "description": "Triggers requests" },
      { "id": "node2", "name": "CPI Input Channel", "type": "adapter", "description": "Receives payload data" },
      { "id": "node3", "name": "Pipeline Processor", "type": "processor", "description": "Inspects and routes payloads" },
      { "id": "node4", "name": "CPI Output Channel", "type": "adapter", "description": "Delivers message requests" },
      { "id": "node5", "name": "Outbound Receiver", "type": "receiver", "description": "Target server database" }
    ],
    "simulationLogs": [
      "🤖 [1/5] Initializing pipeline compiler...",
      `⚙️ [2/5] Creating route schema for topic: ${topic}...`,
      "⚙️ [3/5] Binding connection channels and DEV_CREDS alias...",
      "🚀 [4/5] Deploying flow artifact to Integration Suite...",
      "✅ Execution completed. Active endpoint listening."
    ]
  };
};

const getMockVideoScriptForTopic = (topic) => {
  const mockData = getMockDataForTopic(topic);
  const t = topic.toLowerCase();
  
  let baseScript = {};
  if (t.includes("trial") || t.includes("btp cockpit") || t.includes("create account") || t.includes("start trial")) {
    baseScript = {
      "title": "SAP BTP Free Trial Account Provisioning Guide",
      "audience": "SAP Beginners & Cloud Integration Developers",
      "estimatedDuration": "2 mins 45 secs",
      "introduction": "Welcome everyone! Today we will learn how to set up your free trial account on SAP Business Technology Platform so you can start developing cloud integrations.",
      "scenes": [
        { "sceneNumber": 1, "sectionTitle": "Access Trial Portal", "narration": "Navigate to the SAP BTP Free Trial registration portal. Click on the Start Free Trial button to begin.", "visuals": "Show BTP signup page with pointer hovering over Start Trial button", "overlayText": "PORTAL: trial.btp.sap.com", "duration": "30s" },
        { "sceneNumber": 2, "sectionTitle": "Universal ID Registration", "narration": "Register a new SAP Universal ID. Provide your email, activate using the link sent to your inbox, and log in.", "visuals": "Show Universal ID Signup Form fields filling automatically", "overlayText": "ACTION: Verify Business Email", "duration": "45s" },
        { "sceneNumber": 3, "sectionTitle": "Region & Account Creation", "narration": "Select your trial host region, such as US East (AWS), and click Create Account. Wait for provisioning to finish.", "visuals": "Show wizard dropdown list selecting US East region and loading bar", "overlayText": "REGION: US East (VA) - AWS", "duration": "45s" },
        { "sceneNumber": 4, "sectionTitle": "Enable Cloud Foundry Environment", "narration": "Navigate to your subaccount dashboard, click Enable Cloud Foundry, and set your dev space. You are now ready to install services!", "visuals": "Show subaccount environments tab clicking Enable Cloud Foundry", "overlayText": "STATUS: Cloud Foundry Enabled", "duration": "45s" }
      ],
      "outro": "Your BTP trial sandbox is now active and ready. Start exploring Integration Suite services!"
    };
  } else {
    baseScript = {
      "title": `Mastering ${topic} in SAP Integration Suite`,
      "audience": "SAP Integration Developers & Middleware Architects",
      "estimatedDuration": "3 Minutes",
      "introduction": `Hello integration specialists! Today we cover how to configure and deploy ${topic} in SAP CPI.`,
      "scenes": [
        { "sceneNumber": 1, "sectionTitle": "Configure Authentication Vault", "narration": "Start by navigating to the Monitor dashboard. Go to Security Material and create your connection authorization credentials.", "visuals": "Show CPI Monitor dashboard clicking Create Security Material", "overlayText": "ALIAS: DEV_CREDS", "duration": "45s" },
        { "sceneNumber": 2, "sectionTitle": "Draw Pipeline Layout", "narration": "Open your Integration Flow draft, drag adapters onto the canvas, link sender and receiver nodes, and save the draft.", "visuals": "Show CPI Canvas mapping sender to receiver adapters", "overlayText": "iFLOW: Active Canvas Draft", "duration": "60s" },
        { "sceneNumber": 3, "sectionTitle": "Deploy and Monitor MPL Logs", "narration": "Click deploy, then open Message Processing Logs to check for successful HTTP 200 statuses and trace logs.", "visuals": "Show Message Monitor table with green Completed status", "overlayText": "STATUS: Deployed & Completed", "duration": "45s" }
      ],
      "outro": `That is how you orchestrate ${topic}. Check your configurations in the tenant and happy integrating!`
    };
  }

  return {
    ...baseScript,
    "iflowPlan": mockData.iflowPlan,
    "simulationLogs": mockData.simulationLogs,
    "components": mockData.components
  };
};

// ============================================================================
// API ROUTING ENDPOINTS
// ============================================================================

// POST /api/generate
app.post('/api/generate', async (req, res) => {
  const { topic } = req.body;

  if (!topic || topic.trim() === "") {
    return res.status(400).json({ error: "SAP Topic is required." });
  }

  // Check API key and client configuration
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ API Key missing. Returning high-fidelity static mock guide immediately.");
    return res.json(getMockDataForTopic(topic));
  }

  const aiClient = new GoogleGenerativeAI(apiKey);

  try {
    const modelsToTry = await getSupportedModelsList();
    let parsedData = null;
    let lastError = null;
    const prompt = `Generate SAP CPI deployment guides for topic: "${topic}"`;

    for (const modelName of modelsToTry) {
      try {
        console.log(`✨ Attempting generation with: ${modelName}`);
        const model = aiClient.getGenerativeModel({
          model: modelName,
          systemInstruction: `You are a Senior SAP CPI Consultant and SAP Integration Suite Trainer.
Your task is to analyze the provided SAP integration topic and generate comprehensive, high-quality learning and implementation materials.

All response fields, text, titles, descriptions, tips, logs, and narration scripts MUST be in English only. Do NOT use Hinglish, Hindi, or any other languages under any circumstances.

You must return valid JSON only. The JSON must exactly match the following structure:
{
  "overview": "Beginner-friendly high-level explanation with real-world analogy. Keep it structured and educational.",
  "components": [
    {
      "name": "Component Name (e.g. SFTP Sender Channel, Message Mapping, HTTPS Adapter)",
      "role": "Sender | Processing | Receiver",
      "description": "Specific role and purpose of this component in the integration topic."
    }
  ],
  "steps": [
    {
      "step": 1,
      "title": "Title of step (e.g. Provision BTP Key Store)",
      "description": "Detailed developer actions, instructions, and what to look out for.",
      "proTip": "Pro-tip for advanced developers or performance optimization."
    }
  ],
  "uiInstructions": [
    {
      "step": 1,
      "screen": "The specific SAP CPI/BTP cockpit navigation tab (e.g. Design -> Integration Package -> Artifacts)",
      "action": "What to click or select (e.g. Click 'Edit', click 'Add -> Integration Flow')",
      "details": "Helpful notes about input fields or selectors in that screen."
    }
  ],
  "commonMistakes": [
    {
      "mistake": "Common developer mistake or misconfiguration.",
      "impact": "What failure or error message this causes (e.g. 401 Unauthorized, Connection Timeout).",
      "fix": "Step-by-step resolution or configuration fix to avoid it."
    }
  ],
  "videoScript": "A clean 1-2 minute high-impact overview narration script suitable for introducing this topic. Use a friendly, technical-trainer tone.",
  "iflowPlan": [
    {
      "id": "node1",
      "name": "Name of block (e.g. SFTP Server, Decryptor, Mapping, Target API)",
      "type": "sender | adapter | processor | mapper | receiver",
      "description": "Short explanation of processing happening inside this block."
    }
  ],
  "simulationLogs": [
    "A sequence of 6-8 technical log strings simulating the step-by-step automated setup or build process for this topic. Include prefix indicators like '🤖 [1/6] Booting...', '🔒 Authentication...', '⚙️ Configuring...', '✅ Deploying...' to make it look like an active terminal running command scripts."
  ]
}

Create 3-5 detailed items for each array. Keep descriptions concise to ensure fast API execution times. Ensure it's technical, precise, and completely correct for SAP standard environments.`,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await generateContentWithTimeout(model, prompt, 15000); // 15s timeout for fast response
        const text = result.response.text();
        
        parsedData = parseJSONResponse(text);
        console.log(`✅ Generation succeeded with model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} failed. Error:`, err.message);
        lastError = err;
        if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
          console.warn("🛑 Quota exceeded (429). Aborting model loop to return mock data immediately.");
          break; // Stop trying other models!
        }
      }
    }

    if (!parsedData) {
      throw lastError || new Error("All generative models failed to produce content");
    }

    res.json(parsedData);

  } catch (error) {
    console.error("Gemini AI API Error. Falling back to local mock data engine. Error details:", error.message);
    // Silent recovery: serve beautiful mock data immediately if quota exceeded
    const mockData = getMockDataForTopic(topic);
    res.json(mockData);
  }
});

// POST /api/generate-video-script (Bonus Feature)
app.post('/api/generate-video-script', async (req, res) => {
  const { topic } = req.body;

  if (!topic || topic.trim() === "") {
    return res.status(400).json({ error: "SAP Topic is required to generate script." });
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("⚠️ API Key missing. Returning high-fidelity static mock script immediately.");
    return res.json(getMockVideoScriptForTopic(topic));
  }

  const aiClient = new GoogleGenerativeAI(apiKey);

  try {
    const modelsToTry = await getSupportedModelsList();
    let parsedData = null;
    let lastError = null;
    const prompt = `Generate a high-fidelity education training video script for: "${topic}"`;

    for (const modelName of modelsToTry) {
      try {
        console.log(`✨ Attempting generation with: ${modelName}`);
        const model = aiClient.getGenerativeModel({
          model: modelName,
          systemInstruction: `You are an expert SAP Trainer and Content Creator.
Your task is to create a detailed, high-quality 2-3 minute educational SAP video script for the given topic.

All response fields, text, titles, descriptions, tips, logs, and narration scripts MUST be in English only. Do NOT use Hinglish, Hindi, or any other languages under any circumstances.

You must return valid JSON only. The JSON must exactly match the following structure:
{
  "title": "Title of the Video Training",
  "audience": "Intended audience (e.g. Integration Developers, SAP Architects)",
  "estimatedDuration": "2-3 Minutes (specify exact estimated time, e.g. 2 mins 45 secs)",
  "introduction": "Engaging introductory narration to hook the viewer, setting up the problem statement and the CPI/SAP solution.",
  "scenes": [
    {
      "sceneNumber": 1,
      "sectionTitle": "Section Title (e.g., Understanding the Sender Channel)",
      "narration": "Detailed, word-for-word voiceover script for the narrator. Keep it concise, using professional pacing.",
      "visuals": "Visual cues or diagrams shown on screen (e.g., Show CPI Web UI with pointer hovering over adapter configuration panel).",
      "overlayText": "Important text bullet-points or code snippets overlaying the screen.",
      "duration": "Estimated duration for this scene (e.g., 30 seconds)"
    }
  ],
  "outro": "Concluding remarks, key takeaways, and call-to-action to check configurations in tenant.",
  "iflowPlan": [
    {
      "id": "node1",
      "name": "Name of block (e.g. SFTP Server, Decryptor, Mapping, Target API)",
      "type": "sender | adapter | processor | mapper | receiver",
      "description": "Short explanation of processing happening inside this block."
    }
  ],
  "simulationLogs": [
    "A sequence of 6-8 technical log strings simulating the step-by-step automated setup or build process for this topic. Include prefix indicators like '🤖 [1/6] Booting...', '🔒 Authentication...', '⚙️ Configuring...', '✅ Deploying...' to make it look like an active terminal running command scripts."
  ],
  "components": [
    {
      "name": "Component Name (e.g. SFTP Sender Channel, Message Mapping, HTTPS Adapter)",
      "role": "Sender | Processing | Receiver",
      "description": "Specific role and purpose of this component in the integration topic."
    }
  ]
}

Generate 3-5 concise scenes covering the workflow. Make descriptions and narratives punchy to prevent timeout issues. Ensure it is completely correct for SAP standard environments.`,
          generationConfig: { responseMimeType: "application/json" }
        });

        const result = await generateContentWithTimeout(model, prompt, 15000); // 15s timeout for script
        const text = result.response.text();
        
        parsedData = parseJSONResponse(text);
        console.log(`✅ Generation succeeded with model: ${modelName}`);
        break;
      } catch (err) {
        console.warn(`⚠️ Model ${modelName} failed. Error:`, err.message);
        lastError = err;
        if (err.message.includes("429") || err.message.toLowerCase().includes("quota")) {
          console.warn("🛑 Quota exceeded (429). Aborting model loop to return mock script immediately.");
          break; // Stop trying other models!
        }
      }
    }

    if (!parsedData) {
      throw lastError || new Error("All generative models failed to produce content");
    }

    res.json(parsedData);

  } catch (error) {
    console.error("Gemini AI API Error. Falling back to local mock script engine. Error details:", error.message);
    const mockScript = getMockVideoScriptForTopic(topic);
    res.json(mockScript);
  }
});

// Root check endpoint
app.get('/health', (req, res) => {
  res.json({ status: "healthy", service: "SAP Mentor AI Backend" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 SAP Mentor AI Backend running on http://localhost:${PORT}`);
});

export default app;
