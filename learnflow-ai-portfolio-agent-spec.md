# LEARN — Product Portfolio Website Specification

## 1. Document Purpose

This document describes the requirements for an AI agent responsible for designing and implementing a product portfolio website for **LEARN**.

The website must serve two purposes:

1. Present the product as a polished, customer-facing SaaS product.
2. Explain the internal architecture and engineering decisions clearly enough for developers, technical reviewers, and recruiters.

The result should not be only a marketing landing page and should not be only a technical documentation site. It must combine both experiences in a coherent portfolio.

---

## 2. Product Identity

### Product Name

**LEARN**

### Product Type

AI-powered learning platform / AI SaaS.

### Product Tagline

> Turn your documents into interactive learning.

### Vietnamese Positioning

Nền tảng biến tài liệu học tập thành khóa học và bài học tương tác bằng AI.

### Product Concept

Users can upload learning materials such as PDFs, lecture slides, and personal documents into a course. The AI analyzes the materials and generates structured lessons, exercises, questions, answers, and feedback. Users can then study through an interactive learning experience inspired by language-learning applications such as Duolingo.

---

## 3. Problem Statement

Learners often have access to a large amount of learning material, such as PDFs, lecture slides, and personal documents, but lack an effective way to transform these resources into structured, engaging, and personalized learning experiences.

Traditional learning platforms primarily provide static content, leaving learners responsible for organizing lessons, identifying key concepts, and creating practice activities themselves. This process is time-consuming and can make it difficult to maintain consistent learning progress.

LEARN addresses this problem by transforming user-provided learning materials into structured, interactive lessons with AI-generated exercises and learning progress tracking. The goal is to help learners move from passive content consumption to active learning.

### Vietnamese Version

Người học thường có nhiều tài liệu như PDF, slide bài giảng và tài liệu cá nhân, nhưng thiếu một cách hiệu quả để chuyển những tài liệu này thành trải nghiệm học tập có cấu trúc và tương tác.

Các nền tảng học tập truyền thống thường cung cấp nội dung tĩnh, khiến người học phải tự tổ chức bài học, xác định kiến thức trọng tâm và tạo bài tập luyện tập. Quá trình này tốn thời gian và gây khó khăn trong việc duy trì tiến trình học tập.

LEARN giải quyết vấn đề bằng cách sử dụng AI để chuyển tài liệu người dùng cung cấp thành các bài học tương tác, bài tập luyện tập, feedback và tiến trình học tập.

---

## 4. Target Users

### 4.1 Learner — Primary User

Examples:

- University students.
- Self-learners.
- Language learners.
- People studying from personal documents.
- Users preparing for exams or technical certifications.

Main needs:

- Upload documents.
- Organize documents into courses.
- Generate lessons automatically.
- Practice through interactive exercises.
- Receive feedback.
- Track learning progress.

### 4.2 Content Creator — Secondary User

Examples:

- Teachers.
- Tutors.
- Course creators.
- Subject-matter experts.

Main needs:

- Create courses.
- Upload source materials.
- Review and edit AI-generated lessons.
- Organize course content.
- Share learning materials in future versions.

This role may be outside the initial MVP if the implementation scope is limited.

### 4.3 Administrator — System Operator

Main needs:

- Manage users.
- Manage courses and content.
- Monitor AI usage.
- Manage subscription plans.
- Review system activity.
- Handle reports and operational issues.

---

## 5. Product Value

The website must communicate the following product values:

### 5.1 Reduce Learning Preparation Time

Users do not need to manually convert every document into lessons and exercises.

### 5.2 Enable Active Learning

Static documents are transformed into questions, exercises, and interactive learning activities.

### 5.3 Provide Structured Learning

Documents are organized into courses, lessons, and learning units.

### 5.4 Track Learning Progress

The system records completed lessons, exercise results, and learning history.

### 5.5 Enable AI-Assisted Learning

AI assists with content transformation and exercise generation. Do not claim fully personalized or adaptive learning unless that functionality is actually implemented.

### 5.6 Support a SaaS Business Model

The product can provide different subscription plans with different usage limits and features.

---

## 6. MVP Scope

The MVP must focus on one complete core workflow:

> Register/Login → Create Course → Upload Document → Generate Lessons with AI → Study Lesson → Complete Exercises → Track Progress

### 6.1 Authentication

Required:

- User registration.
- User login.
- Logout.
- Basic profile management.
- Protected routes.

### 6.2 Course Management

Required:

- Create a course.
- View course list.
- View course details.
- Rename or delete a course.
- Associate documents with a course.

### 6.3 Document Management

Required:

- Upload supported documents.
- Display uploaded documents.
- Store document metadata.
- Display processing status.
- Handle failed processing states.

### 6.4 AI Lesson Generation

Required:

- Create an AI generation job.
- Process document content.
- Generate structured lessons.
- Generate exercises or quiz questions.
- Validate AI output before saving.
- Display generation status.

### 6.5 Interactive Learning

Required:

- Open a lesson.
- Display lesson content.
- Answer exercises.
- Submit answers.
- Display score or correctness.
- Display basic feedback.
- Mark lesson completion.

### 6.6 Learning Progress

Required:

- Store completed lessons.
- Store exercise results.
- Display course progress.
- Display basic learning history.

### 6.7 Subscription and Billing

Required for the product concept:

- Display available plans.
- Display plan prices.
- Display plan features.
- Associate a user with a subscription.
- Enforce basic usage limits.

Payment integration may be implemented as a real provider integration or a controlled demo, depending on the project scope. Never trust price or payment status supplied only by the frontend.

### 6.8 Administration

Minimum MVP administration:

- View users.
- View courses.
- View AI jobs.
- View subscription status.

---

## 7. Out of Scope for MVP

The following features should be treated as future extensions unless explicitly requested:

- Advanced adaptive learning.
- Fully personalized learning paths.
- AI tutor with long-running conversation memory.
- Social learning.
- Public course marketplace.
- Native mobile applications.
- Enterprise multi-tenancy.
- Complex gamification.
- Advanced spaced repetition algorithms.
- Real-time collaborative course editing.
- Training a proprietary foundation model.
- Complex analytics and recommendation systems.

---

## 8. Website Goals

The portfolio website must answer these questions clearly:

### For Customers

- What is the product?
- What problem does it solve?
- Who is it for?
- What value does it provide?
- How does it work?
- What does the product look like?
- What are the available plans?
- How can the user try it?

### For Developers and Technical Reviewers

- What is the system architecture?
- What are the main modules?
- How does the AI pipeline work?
- How are documents stored and processed?
- How does the backend communicate with the frontend?
- What is the database structure?
- How are asynchronous jobs handled?
- How are authentication, authorization, billing, and security handled?
- What is included in the MVP?
- What engineering decisions were made?

---

## 9. Recommended Website Sitemap

### Main Navigation

- Home
- Product
- How It Works
- Technical
- Demo
- GitHub

### Main Sections

1. Hero / Product Introduction.
2. Problem Statement.
3. Target Users.
4. Product Value.
5. Core Features.
6. Product Screenshots.
7. How It Works.
8. MVP Scope.
9. Technical Architecture.
10. AI Pipeline.
11. Database and API Overview.
12. Engineering Decisions.
13. Demo / Call to Action.
14. GitHub and Project Information.

---

## 10. Section Requirements

### 10.1 Hero Section

Must include:

- Product name.
- Short tagline.
- One-sentence value proposition.
- Primary CTA: `Try the Demo`.
- Secondary CTA: `Explore Technical Architecture`.
- Product UI preview or dashboard mockup.

Suggested copy:

> Turn your documents into interactive learning.

Supporting copy:

> LEARN transforms PDFs, slides, and personal study materials into structured courses, interactive lessons, and AI-generated practice activities.

### 10.2 Problem Section

Must clearly explain:

- Learning materials are fragmented.
- Static documents are difficult to study actively.
- Creating lessons and exercises manually takes time.
- Learners struggle to maintain consistent progress.

Do not use vague marketing language without explaining the actual problem.

### 10.3 Target User Section

Present the main user groups:

- Learners.
- Content creators.
- Administrators.

Clearly identify Learner as the primary MVP user.

### 10.4 Value Section

Present measurable or understandable benefits where evidence exists.

Avoid unsupported claims such as:

- Guaranteed better grades.
- Perfect personalization.
- 100% accurate AI-generated lessons.
- Complete replacement of teachers.

### 10.5 Features Section

Recommended feature cards:

- Document-to-Course AI.
- Interactive Lessons.
- AI-Generated Exercises.
- Learning Progress.
- Course Organization.
- Subscription Plans.

### 10.6 How It Works Section

Show this flow:

```text
Upload Document
      ↓
Document Processing
      ↓
Text Extraction / OCR
      ↓
Content Structuring
      ↓
AI Lesson Generation
      ↓
Validation
      ↓
Course and Lesson Storage
      ↓
Interactive Learning
      ↓
Progress Tracking
```

### 10.7 MVP Scope Section

Use two groups:

#### In Scope

- Authentication.
- Course creation.
- Document upload.
- AI lesson generation.
- Interactive exercises.
- Progress tracking.
- Subscription plan display.
- Basic billing or payment demo.

#### Out of Scope

- Advanced adaptive learning.
- Social learning.
- Native mobile app.
- Enterprise features.
- Complex AI tutor.
- Advanced analytics.

### 10.8 Technical Architecture Section

The website must show a readable architecture diagram containing:

- Frontend Web App.
- Backend API.
- Authentication Module.
- Course Module.
- Document Module.
- AI Orchestrator.
- Background Worker.
- Queue / Redis.
- PostgreSQL.
- Object Storage.
- LLM Provider.
- Payment Provider.

Recommended logical architecture:

```text
Web Frontend
    |
    v
Backend API
    |
    +--> Authentication Module
    +--> Course Module
    +--> Document Module
    +--> Lesson Module
    +--> Subscription Module
    |
    v
Job Queue
    |
    v
AI Worker
    |
    +--> Document Processing
    +--> Text Extraction
    +--> Chunking
    +--> LLM Generation
    +--> Output Validation
    |
    +--> PostgreSQL
    +--> Object Storage
```

### 10.9 Engineering Details Section

Show technical information through expandable cards, tabs, or separate pages:

- API endpoint examples.
- Database entity overview.
- AI generation pipeline.
- Authentication flow.
- Subscription and payment flow.
- Error handling.
- Background job processing.
- Testing strategy.
- Deployment approach.

The technical section must remain understandable. Avoid displaying large amounts of raw code without explanation.

---

## 11. Suggested Technical Stack

This is a recommended stack, not a mandatory implementation requirement.

### Frontend

- Next.js or React.
- TypeScript.
- Tailwind CSS.
- TanStack Query or equivalent.
- SSE or WebSocket for progress updates when needed.

### Backend

Choose one:

- NestJS with TypeScript.
- FastAPI with Python.

### Database

- PostgreSQL.
- Prisma for TypeScript or SQLAlchemy for Python.

### Storage

- S3-compatible object storage.
- Store file metadata in PostgreSQL.
- Store actual documents in object storage.

### Background Processing

Choose one:

- Redis + BullMQ.
- Redis + Celery.
- Another reliable job queue.

### AI

- LLM API.
- Structured output validation.
- Optional embeddings and vector database for future RAG functionality.

### Billing

- Stripe.
- Paddle.
- A suitable local payment provider.

### Deployment

- Docker.
- CI/CD.
- Managed database.
- Object storage.
- Monitoring and logging.

---

## 12. Core Domain Entities

Recommended entities:

```text
User
Course
CourseMember
Document
DocumentChunk
Lesson
Exercise
Question
Answer
LearningProgress
Submission
AIJob
GenerationRun
Plan
Subscription
Payment
PaymentEvent
```

The exact schema may be simplified for MVP.

### Important Relationships

```text
User 1 ──── N Course
Course 1 ──── N Document
Course 1 ──── N Lesson
Lesson 1 ──── N Exercise
User 1 ──── N LearningProgress
User 1 ──── N Subscription
Subscription N ──── 1 Plan
Document 1 ──── N AIJob
```

---

## 13. Functional Requirements for the AI Agent

The AI agent implementing this website must:

1. Build a polished and responsive portfolio website.
2. Prioritize clarity of product positioning.
3. Present the problem, users, value, and MVP scope explicitly.
4. Separate customer-facing content from developer-facing content.
5. Use consistent terminology across all sections.
6. Avoid inventing implemented features.
7. Clearly label future features as roadmap or out of scope.
8. Include technical architecture in a visually understandable format.
9. Ensure the website works on desktop and mobile.
10. Provide accessible navigation and readable typography.
11. Use realistic product UI mockups or actual screenshots where available.
12. Include clear CTA buttons.
13. Keep the design professional and suitable for a software engineering portfolio.
14. Avoid excessive decoration that hides the product information.
15. Make technical claims only when supported by the actual implementation.

---

## 14. Design Direction

### Overall Style

- Modern AI SaaS.
- Premium but restrained.
- Clean layout.
- Strong visual hierarchy.
- Professional developer portfolio.
- Responsive design.
- Clear separation between marketing and technical content.

### Suggested Visual Language

- Monochrome only: tones from white to black with neutral grays in between (no hue). The Circle mascot (`CircleMascot/`) is black and white only. Do not introduce any hue, including purple. *(Changed 2026-09-28 by product-owner decision; previously dark navy + neutral gray + sky `#5EC8F5`. See `docs/adr/015-don-sac-trang-den.md`.)*
- Rounded cards.
- Subtle gradients.
- Product dashboard mockups.
- Architecture diagrams with clear connectors.
- Monospace typography for code and technical metadata.
- The Circle mascot (`CircleMascot/`) for hero, empty states, AI job progress, and error states. Keep it out of the technical sections.

### Avoid

- Generic AI buzzwords.
- Overloaded hero sections.
- Unreadable architecture diagrams.
- Excessive animations.
- Fake statistics.
- Fake customer logos.
- Unsupported performance claims.
- Presenting roadmap features as completed features.

---

## 15. Content and Copy Rules

The AI agent must follow these rules:

### Be Specific

Prefer:

> Upload a PDF and generate structured lessons and practice questions.

Avoid:

> Revolutionize your learning with next-generation intelligence.

### Distinguish Actual and Planned Features

Use labels such as:

- Available in MVP.
- In development.
- Planned.
- Future extension.

### Use Consistent Terms

Use:

- Course for a collection of learning materials.
- Lesson for a learning unit.
- Exercise for a practice activity.
- Document for uploaded source material.
- AI Job for asynchronous processing.
- Subscription for the user's plan status.

### Avoid Overclaiming

Do not claim that the system:

- Understands every document perfectly.
- Generates error-free educational content.
- Provides guaranteed personalized learning.
- Replaces teachers.
- Has production-scale reliability unless it has been demonstrated.

---

## 16. Definition of Done

The portfolio website is complete when:

### Product Communication

- [ ] Product name is clearly visible.
- [ ] Problem statement is explicit.
- [ ] Target users are identified.
- [ ] Product value is understandable.
- [ ] MVP scope is clearly defined.
- [ ] Main features are presented.
- [ ] A demo CTA exists.
- [ ] GitHub or project information is accessible.

### Technical Communication

- [ ] Architecture diagram is included.
- [ ] AI pipeline is explained.
- [ ] Main backend modules are identified.
- [ ] Database entities are documented.
- [ ] Authentication and billing are explained at a high level.
- [ ] Actual implementation is distinguished from future roadmap.

### UI and UX

- [ ] Responsive on desktop and mobile.
- [ ] Navigation works.
- [ ] CTA buttons work.
- [ ] Typography is readable.
- [ ] Contrast is sufficient.
- [ ] Animations do not interfere with usability.
- [ ] No horizontal overflow on small screens.

### Engineering Quality

- [ ] Code is organized.
- [ ] Components are reusable.
- [ ] Content is easy to update.
- [ ] No secrets are exposed.
- [ ] No unsupported product claims are included.
- [ ] Build and deployment instructions are documented.

---

## 17. Primary Success Criterion

The website succeeds if a visitor can understand the following within a short visit:

1. What LEARN is.
2. What problem it solves.
3. Who uses it.
4. Why it is valuable.
5. What the MVP includes.
6. How the AI pipeline works.
7. What technologies and architecture support the product.
8. How to view or try the product.

The website should communicate both:

> This is a useful product.

and:

> This is a thoughtfully engineered software system.
