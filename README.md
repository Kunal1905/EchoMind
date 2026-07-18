# 🧠 EchoMind

<div align="center">

### AI-Powered Multilingual Voice Companion for Emotional Wellness

*Talk. Reflect. Grow.*

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)
![Drizzle ORM](https://img.shields.io/badge/Drizzle-ORM-C5F74F)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT-412991)
![License](https://img.shields.io/badge/License-MIT-green)

</div>

---

# 📖 Overview

EchoMind is an AI-powered voice companion designed to provide meaningful, real-time conversations while helping users reflect on their emotions and mental well-being.

Unlike traditional chatbots, EchoMind focuses on **natural voice interactions**, **multilingual conversations**, **mood tracking**, and **AI-generated conversation summaries** to create a personalized and engaging experience.

The application combines modern web technologies with Large Language Models (LLMs), speech recognition, and cloud infrastructure to deliver a fast, secure, and scalable AI assistant.

> **Note:** EchoMind is intended to support self-reflection and everyday emotional wellness. It is **not** a replacement for professional mental health care.

---

# ✨ Features

### 🎙️ Real-Time Voice Conversations

- Natural voice-to-voice AI conversations
- Low-latency streaming responses
- Intelligent conversational memory
- Human-like interactions

---

### 🌍 Multilingual Support

Supports conversations in multiple languages including:

- English
- Hindi
- Marathi
- Tamil

---

### 😊 Mood Tracking

Track emotions over time with:

- Daily mood logging
- Mood history
- Emotional insights
- Personalized trends

---

### 📝 AI Conversation Summaries

Every completed session is automatically summarized using AI.

Users can:

- Review previous conversations
- Search past sessions
- Understand emotional patterns
- Keep personal conversation history

---

### 🔒 Secure Authentication

Powered by Clerk.

Features include:

- Google Authentication
- Email Authentication
- Protected Routes
- Secure Sessions

---

### 💳 Premium Plans

Integrated Razorpay payments for premium subscriptions.

---

### ⚡ Background Processing

Long-running AI tasks are processed asynchronously using Upstash QStash, ensuring a fast and responsive user experience.

---

### 📊 Analytics

Built-in analytics to understand user engagement and application performance.

---

### ☁️ Cloud Storage

Conversation history, mood entries, and user information are securely stored using PostgreSQL.

---

# 🛠 Tech Stack

## Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui

## Backend

- Node.js
- Express.js
- TypeScript

## Database

- PostgreSQL
- Neon Database
- Drizzle ORM

## Authentication

- Clerk

## AI Services

- OpenAI
- Vapi AI
- ElevenLabs

## Queue & Background Jobs

- Upstash Redis
- Upstash QStash

## Payments

- Razorpay

## Deployment

- Vercel
- Render

---

# 🏗️ Architecture

```
                        User
                          │
                          ▼
                Next.js Frontend
                          │
                          ▼
                Express.js Backend
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
      Clerk Auth  PostgreSQL  Redis/QStash
          │          │          │
          └──────────┼──────────┘
                     │
                     ▼
                 OpenAI API
                     │
                     ▼
                  Vapi AI
                     │
                     ▼
                ElevenLabs
```

---

# ⚙️ How It Works

1. User signs in securely using Clerk.
2. A voice session is established through Vapi.
3. User speaks naturally to the AI.
4. Audio is converted into text.
5. OpenAI generates intelligent responses.
6. ElevenLabs converts responses back into natural speech.
7. Conversations are securely stored.
8. AI generates summaries asynchronously.
9. Mood entries are saved for future insights.

---

# 📁 Project Structure

```
EchoMind
│
├── client
│   ├── app
│   ├── components
│   ├── hooks
│   ├── lib
│   └── public
│
├── server
│   ├── src
│   │   ├── routes
│   │   ├── services
│   │   ├── middleware
│   │   ├── db
│   │   ├── queue
│   │   └── utils
│
├── README.md
└── LICENSE
```

---

# 🚀 Getting Started

## Clone the Repository

```bash
git clone https://github.com/Kunal1905/EchoMind.git

cd EchoMind
```

---

## Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

# 🔑 Environment Variables

Create a `.env` file inside the **server** directory.

```env
DATABASE_URL=

CLERK_SECRET_KEY=

OPENAI_API_KEY=

VAPI_API_KEY=

VAPI_WEBHOOK_SECRET=

UPSTASH_REDIS_REST_URL=

UPSTASH_REDIS_REST_TOKEN=

QSTASH_TOKEN=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=
```

Create a `.env.local` inside the **client** directory.

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=

NEXT_PUBLIC_API_URL=

NEXT_PUBLIC_RAZORPAY_KEY_ID=
```

---

# ▶️ Running the Application

### Backend

```bash
cd server

npm run dev
```

### Frontend

```bash
cd client

npm run dev
```

Visit:

```
http://localhost:3000
```

---

# 🔒 Security

EchoMind follows several security best practices including:

- Clerk authentication
- Protected backend APIs
- Secure webhook verification
- Environment variable secrets
- Secure payment verification
- Parameterized database queries
- Background job authorization

---

# ☁️ Deployment

| Service | Platform |
|----------|----------|
| Frontend | Vercel |
| Backend | Render |
| Database | Neon PostgreSQL |
| Queue | Upstash QStash |
| Redis | Upstash Redis |
| Payments | Razorpay |
| AI | OpenAI |
| Voice | Vapi + ElevenLabs |

---

# 📸 Screenshots

Add screenshots here.

```
screenshots/

home.png

dashboard.png

voice-chat.png

history.png

mood-tracker.png
```

---

# 🚀 Future Improvements

- AI memory personalization
- Voice emotion detection
- Mobile application
- Offline mode
- AI wellness recommendations
- Calendar integration
- Wearable device support
- Better analytics dashboard

---

# 🤝 Contributing

Contributions are always welcome!

1. Fork the repository

2. Create your feature branch

```bash
git checkout -b feature/amazing-feature
```

3. Commit your changes

```bash
git commit -m "Add amazing feature"
```

4. Push to the branch

```bash
git push origin feature/amazing-feature
```

5. Open a Pull Request

---

# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Author

**Kunal Suthar**

Full Stack Developer

GitHub: https://github.com/Kunal1905

LinkedIn: *(Add your LinkedIn profile here)*

---

<div align="center">

### ⭐ If you found this project useful, consider giving it a star!

Made with ❤️ by **Kunal Suthar**

</div>
