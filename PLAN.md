# Quiz Management System

## Assumptions

1. **Authentication** - Using [better-auth](https://www.better-auth.com/) for quick admin panel protection. Email/password login, session-based.
2. **Question Types** - MCQ (single correct), True/False, and Text. Covers most common quiz scenarios.
3. **Auto-scoring** - MCQ and True/False scored automatically. Text answers are displayed in results but require manual review.
4. **Single Page Quiz** - All questions shown at once, no pagination. Simpler UX, works for short quizzes.
5. **Public Access** - Any quiz can be taken via shareable link (`/quiz/{id}`). No user tracking.

---

## Scope

**In Scope:**
- Admin: CRUD operations for quizzes and questions
- Admin: Support for 3 question types (MCQ, True/False, Text)
- Public: Quiz-taking interface with form validation
- Public: Results page showing score and correct answers
- Responsive design for mobile/desktop

---

## Approach

### Architecture
Monolithic Next.js app with API routes - simple, fast to build, easy to deploy.

```
Next.js App (Frontend + API)
        ↓
    Prisma ORM
        ↓
  Neon DB (Postgres)
```

### Tech Choices
| Choice | Reason |
|--------|--------|
| Next.js 14 | App Router, built-in API routes, fast setup |
| Prisma | Type-safe queries, easy migrations |
| Neon DB | Serverless Postgres, free tier available |
| Tailwind + shadcn/ui | Rapid UI development, consistent design |
| Zod | Runtime validation for API inputs |

### Key Routes
**Admin:**
- `/admin` - Quiz dashboard
- `/admin/quizzes/new` - Create quiz
- `/admin/quizzes/[id]` - Edit quiz

**Public:**
- `/quiz/[id]` - Take quiz
- `/quiz/[id]/result/[attemptId]` - Shareable results page

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/quizzes` | List all quizzes |
| POST | `/api/quizzes` | Create quiz with questions |
| GET | `/api/quizzes/[id]` | Get quiz details |
| PUT | `/api/quizzes/[id]` | Update quiz |
| DELETE | `/api/quizzes/[id]` | Delete quiz |
| POST | `/api/quizzes/[id]/submit` | Submit answers (with participant name), return score + attemptId |
| GET | `/api/quizzes/[id]/result/[attemptId]` | Get shareable result |

---

## Scope Changes

### Change #1: Participant Name + Shareable Results
**Added**: Ask for participant name before quiz, return unique shareable result link.
- `Attempt` model now includes `participantName`
- Submit returns `attemptId` for `/quiz/[id]/result/[attemptId]` URL
- Results page shows participant name, score, and answers

---

## Future Roadmap

### 1. Functional Enhancements (Priority)
- **Rich Text & Code Questions**: Markdown editor with syntax highlighting for technical interviews.
- **Analytics Dashboard**: Visual charts for pass rates, average scores, and question difficulty heatmaps.
- **Time Limits**: Strict countdown timers with auto-submission.
- **Access Codes & Privacy**: Password-protected quizzes and "Invite Only" mode.
- **Question Bank**: Reusable questions library to mix-and-match into new quizzes.
- **Gamification**: Public leaderboards and "Certificate of Completion" generation.
- **Data Export**: Download attempts and results as CSV/PDF.
- **Role-Based Access**: Separate Admin, Editor, and Viewer roles.
- **Shuffle Questions**: Shuffle questions and options for each participant.
- **Shuffle Options**: Shuffle options for each participant.

### 2. DevOps & Quality (Reliability)
- **E2E Testing**: Playwright suite for critical user flows.
- **Unit Testing**: Vitest for utility logic and components.
- **CI/CD**: GitHub Actions for automated testing and linting.
- **Error Monitoring**: Sentry integration.

### 3. Polish & Performance
- **OG Images**: Dynamic social sharing cards.
- **Skeleton Loading**: Improved loading states.
- **Optimistic UI**: Instant feedback on actions.

---

## Reflection
*(To be written after completion)*

