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
| POST | `/api/quizzes/[id]/submit` | Submit answers, return score |
