# SAP Mentor AI 🧠

An AI-powered SAP Integration Suite & SAP CPI training assistant that bridges the gap in complex integration development. Input any SAP topic and instantly receive beginner-friendly explanations, required components, step-by-step UI actions, troubleshooting protocols, and voiceover training teleprompters!

---

## 🌟 Primary Features

- **Topic Generator**: Converts any raw SAP topic (e.g. SFTP, SOAP, HTTP Adapters, Custom Mappings) into structured architectural content.
- **iFlow Blueprint Pipeline**: Displays an animated SVG flowchart depicting the sender ➔ processors ➔ mappers ➔ receivers pipeline dynamically.
- **SAP UI Instruction Board**: Maps out click-by-click cockpit steps to fast-track configuration within standard SAP BTP.
- **Interactive Teleprompter**: Read voiceover speaking scripts with real-time autoscroll playback and speed regulators.
- **Troubleshooting System**: Highlights common developer failures, connection error messages, and immediate resolutions.
- **High-Fidelity PDF Exports**: Instant "Download PDF" action that re-formats the entire layout into a clean corporate blueprint report ready to present or share.

---

## 🛠 Tech Stack

### Frontend
- **React** (v18.3)
- **Vite** (Next-generation build tool)
- **Tailwind CSS** (Premium utility classes)
- **Framer Motion** (Staggered animations & slide transits)
- **Axios** (Backend requests orchestration)
- **Lucide React** (Modern developer iconography)

### Backend
- **Node.js** & **Express**
- **Google Gemini API SDK** (`@google/generative-ai`)
- **Dotenv** & **CORS**
- **Concurrently** (Runs frontend & backend together)

---

## 📁 Project Structure

```
sap-mentor-ai/
├── package.json               # Root orchestrator with concurrent scripts
├── README.md                  # Developer manual
├── server/
│   ├── package.json           # Express server configs
│   ├── .env.example           # Server env template
│   ├── .env                   # Server env containing api keys
│   └── index.js               # Node server index with Gemini handlers
└── client/
    ├── package.json           # Client packages
    ├── vite.config.js         # Vite compile configuration
    ├── tailwind.config.js     # Tailwind template styles
    ├── postcss.config.js      # PostCSS declarations
    ├── index.html             # React core container
    └── src/
        ├── main.jsx           # Mount script
        ├── index.css          # Tailwind utilities & print setups
        ├── App.jsx            # Main app router & core state
        └── components/
            ├── Header.jsx           # Enterprise title & connectivity status
            ├── TopicInput.jsx       # Inputs console & quick-tags
            ├── Dashboard.jsx        # Visual tabs & PDF triggers
            ├── LoadingState.jsx     # Rotating orbits animation loader
            ├── ErrorState.jsx       # Alert panels & api key guides
            ├── IFlowVisualizer.jsx  # SVG routing flowchart map
            └── VideoScriptViewer.jsx# Storyboards & auto-scroll teleprompters
```

---

## ⚡️ Quick Installation & Setup

You can build and start the entire application in two easy steps:

### 1. Install all dependencies
Run this single command at the root of `sap-mentor-ai` folder:
```bash
npm install
```
> **Note**: A custom `postinstall` script runs automatically to install both `client` and `server` dependencies, saving you from cd'ing into separate folders.

### 2. Configure Environment variables
1. Open the file `server/.env` inside your editor.
2. Provide your private **Google Gemini API Key**:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
```
> 💡 *Don't have an API key? Get one instantly for free at [Google AI Studio](https://aistudio.google.com/).*

### 3. Launch Development Environments
Run this command from the root directory:
```bash
npm run dev
```
This boots up:
- **Express Backend** at [http://localhost:5000](http://localhost:5000)
- **Vite React Frontend** at [http://localhost:3000](http://localhost:3000)

Open [http://localhost:3000](http://localhost:3000) in your web browser and start learning!

---

## 📃 License

This project is licensed under the MIT License.
