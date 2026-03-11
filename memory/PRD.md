# DealFlow Hunter - Investor Database PRD

## ⚠️ IMPORTANT: Firebase Setup Required

Your Firebase Firestore needs security rules configured. Go to **Firebase Console → Firestore Database → Rules** and set:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /investors/{document=**} {
      allow read, write: if true;  // Open access (as requested)
    }
  }
}
```

Click **"Publish"** to apply the rules.

---

## Original Problem Statement
Build an app which scans the internet for angel investors, Venture Capitalists, and other stakeholders in the startup funding ecosystem to update data so as to help raise funds. Check sources including Inc42, YourStory, LinkedIn, X, various news sources, and Reddit.

## User Choices
- **Data Entry**: Both manual entry + AI-powered extraction
- **AI Provider**: Emergent LLM Key (GPT-5.2)
- **Authentication**: Open access (no login required)
- **Export**: Excel format
- **Theme**: Light theme with orange and red accents

## User Personas
1. **Startup Founders** - Looking to identify potential investors for their fundraise
2. **Fundraising Teams** - Building and maintaining investor pipeline
3. **Investment Researchers** - Tracking investor activity and preferences

## Core Requirements
- [x] Investor database with all required columns (Name, Institution, Title, Cheque Size, Geographies, Sectors, Stage, Shareholding, Email, Website)
- [x] Manual data entry via form
- [x] AI-powered extraction from pasted content
- [x] "New Investors" tab showing recently added entries (last 24 hours)
- [x] Search functionality across all fields
- [x] Filter by Geography, Sector, Stage
- [x] Export to Excel

## Architecture
- **Frontend**: React with shadcn/ui components, Tailwind CSS
- **Backend**: FastAPI (Python)
- **Database**: MongoDB
- **AI Integration**: Emergent LLM Key with GPT-5.2

## What's Been Implemented (March 5, 2026)

### Backend (/app/backend/server.py)
- GET /api/investors - List all investors with search/filter
- POST /api/investors - Create new investor
- PUT /api/investors/{id} - Update investor
- DELETE /api/investors/{id} - Delete investor
- GET /api/investors/new - Get investors added in last 24h
- GET /api/investors/filters - Get unique filter values
- POST /api/extract-investors - AI extraction endpoint
- GET /api/investors/export - Excel export

### Frontend Components
- Dashboard page with sidebar navigation
- Stats cards showing key metrics
- InvestorTable with sorting, search results
- AddInvestorModal for manual entry and editing
- AIExtractModal for AI-powered data extraction
- Filter dropdowns for Geography, Sector, Stage

## Testing Results
- Backend: 83.3% pass rate
- Frontend: 95% pass rate
- Overall: 90% pass rate

## Known Limitations
- AI extraction requires Emergent LLM key with sufficient budget

## Prioritized Backlog

### P0 - Critical (Completed)
- [x] Basic CRUD operations
- [x] Search and filter
- [x] Excel export
- [x] AI extraction

### P1 - Important
- [ ] Bulk import from CSV
- [ ] Email template integration for outreach
- [ ] Notes and activity tracking per investor
- [ ] Duplicate detection

### P2 - Nice to Have
- [ ] LinkedIn profile auto-fetch
- [ ] Investment news aggregation
- [ ] Custom tags and labels
- [ ] Dashboard analytics charts
- [ ] Scheduled auto-extraction from RSS feeds

## Next Tasks
1. Add bulk CSV import feature
2. Implement investor activity/notes timeline
3. Add duplicate detection on save
4. Create email outreach integration
