# DocuChain NG 🇳🇬⚖️

> **AI-Powered Tenancy Ingestion, Statutory Auditing, & Compliance Management Engine**
> Built specifically for Nigerian real estate law and commercial property frameworks, with strict statutory enforcement based on the **Lagos State Tenancy Law 2011**.

---

## Overview

**DocuChain NG** streamlines tenancy agreement auditing and compliance analysis. It automatically parses legal contracts, extracts key operational covenants, highlights non-compliant clauses against Nigerian statutory provisions, generates enforceable counter-clauses, and exports audit certificates.

### Key Capabilities

- **Statutory Audit Engine**: Real-time contract evaluation against the **Lagos Tenancy Law 2011**:
  - **Section 4**: Detects and redlines illegal advance rent demands exceeding statutory limits (e.g., >1 year advance rent for yearly tenants).
  - **Section 13**: Identifies deficient notice-to-quit periods and generates statutory counter-proposals.
- **Contract Vault & Ingestion**: Dual-mode ingestion supporting direct text analysis and file upload dropzones (`.pdf`, `.docx`, `.txt`).
- **Interactive Clause Explorer** (`/contracts/[id]`): Split-pane interface pairing rendered legal text alongside dynamic statutory redline cards, copyable counter-clauses, metadata extraction, and an inline legal assistant.
- **Compliance PDF Export**: Instant generation of branded, court-ready statutory compliance certificates and audit reports.
- **Enterprise Persistence**: Backed by PostgreSQL and Supabase for persistent contract and obligation tracking.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | Next.js (App Router), TypeScript, Tailwind CSS, Lucide Icons, jsPDF |
| **Backend** | Node.js, Express.js, TypeScript |
| **AI / LLM Engine** | Groq (`llama-3.3-70b-versatile`) QoreBit |
| **Database & Auth** | Supabase (PostgreSQL) |

---

## Project Structure

```text
docuchain-ng-engine/
├── backend/                # Express API & Statutory Audit Engine
│   ├── src/
│   │   ├── routes/         # /api/review, /api/contracts, /api/clauses
│   │   └── index.ts        # Server entry point
│   ├── .env.example
│   └── package.json
│
├── frontend/                # Next.js Web Application
│   ├── app/
│   │   ├── vault/           # Ingestion dropzone & contract repository table
│   │   ├── contracts/[id]/  # Split-pane clause explorer & redline editor
│   │   └── obligations/     # Statutory timeline & obligations tracker
│   ├── components/          # Reusable UI & detail panels
│   ├── lib/                 # PDF export utility, API clients, mock data
│   ├── .env.example
│   └── package.json
│
├── .gitignore               # Unified root gitignore
└── README.md
```

---

## Getting Started

### 1. Prerequisites

- Node.js (v18.x or higher)
- npm or pnpm
- Supabase account
- Groq Cloud API key

### 2. Environment Setup

**Backend configuration** — create `backend/.env`:

```env
PORT=3000
GROQ_API_KEY=your_groq_api_key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ANON_KEY=your_anon_key
```

**Frontend configuration** — create `frontend/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 3. Installation & Local Development

**Start the backend API:**

```bash
cd backend
npm install
npm run dev
```

**Start the frontend UI:**

```bash
cd frontend
npm install
npm run dev
```

---

## Regulatory Framework Reference

- **Lagos State Tenancy Law 2011 (Section 4)**: Unlawful to demand or receive rent in excess of 1 year for yearly tenants, or 6 months for monthly tenants.
- **Lagos State Tenancy Law 2011 (Section 13)**: Statutory length of notice for periodic tenancies — 6 months for yearly tenancies, 1 month for monthly tenancies.

---

## License

MIT License.
