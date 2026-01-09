# 📋 AI Documentation Update Prompt

**Copy and paste this entire prompt to AI when pausing development:**

---

## 🎯 Task: Comprehensive Documentation Update

You are tasked with **pausing active development** and performing a **comprehensive documentation audit and update** for the **WekangTradingJournal** project.

### Context
- **Project**: WekangTradingJournal - Trading Performance Tracking System
- **Current Date**: {{ INSERT_TODAY_DATE }}
- **Last Active Development Session**: {{ INSERT_SESSION_DATE }}
- **Repository**: GitHub.com/Thewekang/WekangTrading

---

## 📝 Required Actions

### 1. **Code Archaeology & Change Analysis**

First, analyze recent development activity:

```bash
# Get recent commits (last 20)
git log --oneline -20

# Get detailed diff of recent changes
git log --since="3 days ago" --stat

# Check current branch status
git status
```

**Deliverable**: Create a bullet-point summary of:
- What features were implemented
- What bugs were fixed
- What files were created/modified
- What technical decisions were made

---

### 2. **Update Progress Tracking Document**

**File**: `docs/06-PROGRESS-TRACKING.md`

**Required Updates**:

#### Section 1: Document Control (Lines 3-7)
- ✅ Update **Last Updated** timestamp to current date
- ✅ Update **Status** to reflect current phase
- ✅ Increment **Version** (patch version if minor updates, minor version if phase complete)

#### Section 2: Project Dashboard (Lines 11-30)
- ✅ Update **Overall Progress** percentage
- ✅ Update phase completion bars
- ✅ Change phase emoji (✅ for complete, 🚧 for in progress, ⏳ for upcoming)
- ✅ Update **Current Phase** field

#### Section 3: Current Sprint Status (Lines 34-60)
- ✅ Update current week number
- ✅ Update dates range
- ✅ List all completed features in **Completed** section
- ✅ Move remaining items to **In Progress** or **Next Sprint**
- ✅ Update progress percentage

#### Section 4: Phase Tracking Tables
For each phase that changed:
- ✅ Update task status (⏳ Pending → 🔨 In Progress → ✅ Complete)
- ✅ Update progress percentage (0% → 50% → 100%)
- ✅ Fill in **Completion Date** when tasks complete
- ✅ Add notes/commit hashes in **Notes** column

#### Section 5: Recent Changes Log (Bottom of doc)
- ✅ Add new entry with:
  - Date
  - Commit hash
  - Brief description
  - Files affected count
  - Phase impacted

**Example Entry**:
```markdown
### 2026-01-09: Phase 4 Priority 4 Complete + Bug Fixes
**Commits**: 8f2db26, a8ad2c9, bc6b419  
**Changes**: 
- ✅ Implemented CSV/PDF export system
- ✅ Fixed PDF export validation errors
- ✅ Added toast notifications with Sonner
- 📁 Files: 8 created, 5 modified
- 🎯 Phase 4 Progress: 100% → COMPLETE
```

---

### 3. **Update Milestones & Roadmap**

**File**: `docs/05-MILESTONES-ROADMAP.md`

**Required Updates**:

#### Section 1: Document Control (Lines 3-9)
- ✅ Update **Last Updated** date
- ✅ Update **Current Progress** status line

#### Section 2: Project Phases Overview (Lines 13-23)
- ✅ Update ASCII progress bars for each phase
- ✅ Update percentage completions
- ✅ Add completion dates for finished phases

#### Section 3: Phase Deliverables
For each phase:
- ✅ Check off completed deliverables `[x]`
- ✅ Update status badges (PENDING → IN PROGRESS → COMPLETE)
- ✅ Add **Completion Date** and **Notes** sections to finished phases

#### Section 4: Risk Register
- ✅ Close resolved risks (mark as ✅ RESOLVED)
- ✅ Add new risks if discovered during development
- ✅ Update mitigation status

---

### 4. **Update README.md**

**File**: `README.md`

**Required Updates**:

#### Header Section (Lines 6-11)
- ✅ Update **Status** emoji and phase description
- ✅ Update **Current Version** (follow semver: 0.X.0 for phase completion)
- ✅ Update **Timeline** if extended

#### Implementation Roadmap Section (Lines 48-60)
- ✅ Update each phase line with checkmark ✅ when complete
- ✅ Update "COMPLETE" status for finished phases
- ✅ Update current week/dates

#### Recent Updates Section (Near bottom)
- ✅ Add new bullet point for latest changes:
  ```markdown
  - **2026-01-09**: Phase 4 Complete - Export system, toast notifications, bug fixes
  ```

#### Tech Stack Section (If new dependencies added)
- ✅ Add new libraries to the list with purpose:
  ```markdown
  - **sonner**: Modern toast notifications
  ```

---

### 5. **Update API Specification** (If APIs changed)

**File**: `docs/04-API-SPECIFICATION.md`

**Required Updates** (Only if API endpoints were created/modified):
- ✅ Add new endpoint documentation
- ✅ Update request/response schemas
- ✅ Add error codes
- ✅ Update examples

---

### 6. **Create Session Summary Document**

**File**: `docs/SESSION-SUMMARY-{{ DATE }}.md`

Create a **new file** with template:

```markdown
# Development Session Summary
**Date**: {{ DATE }}  
**Phase**: {{ CURRENT_PHASE }}  
**Duration**: {{ HOURS }} hours  
**Developer**: {{ YOUR_NAME }}

---

## 🎯 Objectives Achieved

1. {{ OBJECTIVE_1 }}
2. {{ OBJECTIVE_2 }}
3. ...

---

## ✅ Completed Tasks

### Priority 1: {{ FEATURE_NAME }}
- ✅ Task description
- ✅ Task description
- **Commit**: {{ COMMIT_HASH }}
- **Files**: {{ COUNT }} files changed

### Priority 2: {{ FEATURE_NAME }}
...

---

## 🐛 Bugs Fixed

### Bug #1: {{ BUG_TITLE }}
- **Issue**: Description of problem
- **Root Cause**: What caused it
- **Solution**: How it was fixed
- **Commit**: {{ COMMIT_HASH }}

---

## 📊 Progress Metrics

- **Commits Today**: {{ COUNT }}
- **Lines Added**: {{ COUNT }}
- **Lines Removed**: {{ COUNT }}
- **Files Created**: {{ COUNT }}
- **Files Modified**: {{ COUNT }}
- **Tests Passed**: {{ COUNT }}/{{ TOTAL }}

---

## 🔄 Next Steps

1. {{ NEXT_TASK_1 }}
2. {{ NEXT_TASK_2 }}
3. ...

---

## 💡 Technical Decisions

1. **Decision**: Use Sonner for toast notifications
   - **Reason**: Modern, lightweight, non-blocking UX
   - **Alternative Considered**: React-Toastify
   - **Files Affected**: layout.tsx, ExportModal.tsx

2. ...

---

## 📝 Notes for Resume

**When resuming development**:
- Dev server should be on localhost:3000
- Last working feature: {{ FEATURE_NAME }}
- Known issues: {{ ISSUES }}
- Next priority: {{ NEXT_PRIORITY }}

**Environment Check**:
```bash
npm run dev      # Start server
npm run build    # Test build
git status       # Check clean state
```

---

## 🔗 Related Commits

- {{ COMMIT_HASH }}: {{ COMMIT_MESSAGE }}
- {{ COMMIT_HASH }}: {{ COMMIT_MESSAGE }}
```

---

### 7. **Create RESUME.md** (Development Continuation Guide)

**File**: `RESUME.md` (root directory)

```markdown
# 🚀 Resume Development Guide

**Last Updated**: {{ DATE }}  
**Last Session**: {{ SESSION_DATE }}  
**Current Phase**: {{ PHASE }}  
**Next Task**: {{ NEXT_TASK }}

---

## ✅ Quick Start Checklist

Before coding, verify:

- [ ] Dev server starts: `npm run dev`
- [ ] Database connected (check Turso dashboard)
- [ ] Git status clean: `git status`
- [ ] Node version correct: `node --version` (v18+)
- [ ] Dependencies updated: `npm install`
- [ ] Environment variables set (`.env.local`)

---

## 📍 Current State

### What's Working ✅
- {{ FEATURE_1 }}
- {{ FEATURE_2 }}
- ...

### Known Issues ⚠️
- {{ ISSUE_1 }} - Status: {{ STATUS }}
- {{ ISSUE_2 }} - Status: {{ STATUS }}

### In Progress 🔨
- {{ TASK_1 }} - {{ PERCENTAGE }}% complete
- {{ TASK_2 }} - Blocked by {{ BLOCKER }}

---

## 🎯 Next Priorities

### Immediate (This Session)
1. **{{ PRIORITY_1_TITLE }}**
   - [ ] Subtask 1
   - [ ] Subtask 2
   - **Files to modify**: {{ FILES }}
   - **Estimated time**: {{ HOURS }} hours

2. **{{ PRIORITY_2_TITLE }}**
   - ...

### Short-term (This Week)
- {{ TASK_1 }}
- {{ TASK_2 }}

### Long-term (This Phase)
- {{ TASK_1 }}
- {{ TASK_2 }}

---

## 🗺️ Context for AI Assistants

### Project Structure Reminder
```
Key Files:
├── lib/services/         # Business logic (SSOT)
├── lib/validations.ts    # Zod schemas (SSOT)
├── lib/constants.ts      # Enums & constants (SSOT)
├── lib/types.ts          # TypeScript types (extended from Prisma)
├── app/api/              # API routes
└── components/           # React components
```

### Coding Principles
1. **SSOT**: Never duplicate types, validation, or constants
2. **Market Session**: Always auto-calculate server-side
3. **Daily Summary**: Auto-update on every trade change
4. **Validation**: Always client + server
5. **Mobile-first**: Real-time entry optimized for mobile
6. **Performance**: Use daily_summaries for dashboard

### Recent Changes to Remember
- {{ IMPORTANT_CHANGE_1 }}
- {{ IMPORTANT_CHANGE_2 }}

---

## 🔗 Quick Reference Links

- **GitHub Repo**: https://github.com/Thewekang/WekangTrading
- **Turso Dashboard**: https://turso.tech/
- **Design Docs**: `docs/` folder
- **Copilot Instructions**: `.github/copilot-instructions.md`
- **Progress Tracking**: `docs/06-PROGRESS-TRACKING.md`
- **API Spec**: `docs/04-API-SPECIFICATION.md`

---

## 🧪 Testing Checklist

Before marking phase complete:

**Phase 4 Checklist** (Example):
- [ ] CSV export works (downloads file)
- [ ] PDF export works (opens print dialog)
- [ ] Toast notifications show properly
- [ ] Filters apply correctly
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Build succeeds: `npm run build`

---

## 💾 Last Known Good State

**Commit**: {{ COMMIT_HASH }}  
**Branch**: main  
**Server Running**: Yes/No  
**Build Status**: ✅ Passing  
**Test Coverage**: {{ PERCENTAGE }}%

**If something breaks, rollback to**:
```bash
git checkout {{ SAFE_COMMIT_HASH }}
```

---

## 📞 When to Ask for Help

- Build fails after dependency update
- TypeScript errors in Prisma-generated types
- Authentication flow breaks
- Database migration fails
- Performance degrades significantly

---

## 🎓 Lessons Learned This Session

1. {{ LESSON_1 }}
2. {{ LESSON_2 }}
3. ...

---

**Remember**: Check `.github/copilot-instructions.md` for full context before coding!
```

---

## 8. **Verification Checklist**

After completing all updates, verify:

- [ ] All dates updated to current date
- [ ] All version numbers incremented appropriately
- [ ] All completion percentages accurate
- [ ] All checkboxes updated ([ ] → [x])
- [ ] All status badges current (PENDING/IN PROGRESS/COMPLETE)
- [ ] All commit hashes included in change logs
- [ ] All new files documented
- [ ] No placeholder text remaining ({{ }})
- [ ] Markdown formatting valid (lint with `npx markdownlint docs/`)
- [ ] All internal links working
- [ ] Git commit message descriptive

---

## 9. **Commit Documentation Changes**

Once all updates complete:

```bash
# Check what changed
git status
git diff docs/

# Stage documentation files
git add README.md docs/ RESUME.md

# Commit with descriptive message
git commit -m "docs: update progress tracking and roadmap

- Updated Phase 4 completion status (100%)
- Added session summary for {{ DATE }}
- Updated README.md with latest progress
- Created RESUME.md for development continuation
- Incremented version to {{ VERSION }}
- Documented {{ COUNT }} commits from recent session"

# Push to repository
git push origin main
```

---

## 10. **Generate Progress Report (Optional)**

Create a visual progress report:

```bash
# Generate git statistics
git log --since="1 week ago" --shortstat --oneline

# Count commits by author
git shortlog -sn --since="1 week ago"

# Generate file change summary
git diff --stat main@{1.week.ago}..main
```

**Save output to**: `docs/reports/WEEKLY-REPORT-{{ DATE }}.md`

---

## ✅ Final Output

After completing all tasks, provide:

1. **Summary Comment**: 
   - "✅ Documentation updated for {{ PHASE }} completion"
   - "📊 {{ COUNT }} commits documented"
   - "🎯 Project is {{ PERCENTAGE }}% complete"
   - "⏭️ Next: {{ NEXT_PHASE }}"

2. **File Change List**:
   ```
   Modified:
   - README.md (version updated, roadmap updated)
   - docs/06-PROGRESS-TRACKING.md (phase tracking updated)
   - docs/05-MILESTONES-ROADMAP.md (deliverables checked)
   
   Created:
   - docs/SESSION-SUMMARY-{{ DATE }}.md
   - RESUME.md
   ```

3. **Next Action**:
   - "📋 Ready to resume development"
   - "🔍 Review updated docs before next session"

---

## 📌 Notes

- **Frequency**: Run this update at end of each development session or when completing a phase/priority
- **Time Required**: 15-30 minutes for thorough update
- **Importance**: Critical for project continuity and team collaboration
- **AI Friendly**: This prompt is designed for GitHub Copilot or other AI assistants

---

**End of Prompt** - AI should now execute all 10 steps systematically.
