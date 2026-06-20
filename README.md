# 🌿 HealthQuest — A Gamified Township Health & Fitness App

A mobile-first web app that turns healthy living into a quest. Built for the **MCOA021 — Systems Analysis and Design** project.

> ✨ *"Your town. Your health. Your quest."*

---

## 🚀 Quick Start

1. **Open `index.html`** in any modern browser (Chrome, Edge, Firefox, Safari).
2. Click **"Create Account"** to register.
3. Set your **goals** and you're ready to start your first quest!

No build step. No server. No install. Everything runs in the browser, data persists in `localStorage`.

To test with multiple users, open in an Incognito window for a second account.

---

## 🎮 The 11 Core Features

| # | Feature | Pages |
|---|---------|-------|
| 1 | **User Accounts** — Register, login, edit profile, upload photo | `index.html`, `register.html`, `profile.html` |
| 2 | **Goal Setup** — Health goals (lose weight, manage diabetes…) + interests (walking, soccer…) | `goals.html` |
| 3 | **Quest System** — Daily & weekly quests, mark complete | `quests.html` |
| 4 | **Reward System** — XP, Coins, Badges, Ranks (Bronze → Diamond) | `dashboard.html`, `profile.html` |
| 5 | **Streak System** — Always-visible 🔥 streak counter, daily reset | All pages (topbar) |
| 6 | **Dashboard** — Streak, Rank, XP, today's quests, township ranking | `dashboard.html` |
| 7 | **Activity Logging** — Log walk, run, soccer, gym (type / duration / distance) | `activity.html` |
| 8 | **Medication Tracking** — Add meds, set reminders, upload proof | `medication.html` |
| 9 | **Community Challenges** — Township leaderboards, monthly challenges | `community.html` |
| 10 | **Activity & Event Discovery** — Browse events, save, join | `events.html` |
| 11 | **Community Feed** — Posts, likes, comments | `community.html` (Feed tab) |

---

## 🏗️ Architecture (SAD-grounded)

| Layer | File | Purpose |
|-------|------|---------|
| **Presentation** | `*.html` | One page per major feature; mobile-first responsive |
| **Style** | `css/styles.css` | Single design system, theme tokens, components |
| **Domain / Storage** | `js/storage.js` | All data persistence in `localStorage` (HQ object) |
| **Quest logic** | `js/quests.js` | Quest templates, completion, XP/coin rewards, streak |
| **Shared UI** | `js/ui.js` | Topbar with streak badge, bottom nav, auth gate |

---

## 📁 Project Structure

```
HABITHACKZ/
├── index.html              # Login page
├── register.html           # Register new account
├── goals.html              # Set health goals + interests
├── dashboard.html          # App home (streak, rank, today's quests)
├── quests.html             # Daily + weekly quests
├── activity.html           # Log physical activity
├── medication.html         # Medication tracking + photo proof
├── community.html          # Townships / Challenges / Feed (tabbed)
├── events.html             # Browse + save + join events
├── profile.html            # Edit profile, view stats & badges
├── css/styles.css          # All styling
└── js/
    ├── storage.js          # HQ data layer (users, sessions, quests, posts…)
    ├── quests.js           # Quest generation, completion, rewards
    └── ui.js               # Shared UI (topbar, bottom nav, auth gate)
```

---

## 🧠 SAD Concepts Applied

This app was built following the **6 core SDLC processes** from the SAD textbook:

1. **Identify the problem & obtain approval** — see `HealthQuest_App_SAD_Plan.md`
2. **Plan and monitor the project** — 5-iteration roadmap in the plan
3. **Discover and understand the details** — Use cases documented per feature
4. **Design the system components** — UML class diagram in storage.js (HQ.BADGES, HQ.RANKS)
5. **Build, test, integrate** — Each page is an independently testable module
6. **Complete system tests & deploy** — Manual smoke test checklist below

### Iteration Map

| Iteration | Focus | Features Delivered |
|-----------|-------|---------------------|
| **1** | Foundation | User Accounts (UC1–UC3) + Dashboard skeleton |
| **2** | Quest Core | Goals (UC4) + Quests (UC5) + Rewards |
| **3** | Consistency | Streaks + Activity Logging |
| **4** | Health | Medication Tracking |
| **5** | Community | Townships + Challenges + Events + Feed + Profile |

---

## ✅ Manual Smoke Test Checklist

- [ ] Register a new user — gets redirected to Goals page
- [ ] Login with the same user — goes to Dashboard
- [ ] Set goals — daily quests update to match (walk for "lose weight" shows walk quests)
- [ ] Mark a quest complete — XP / coins / streak increase
- [ ] Log an activity — extra XP awarded, monthly challenge progress updates
- [ ] Add a medication with photo proof — appears in list, can mark as taken
- [ ] Contribute township points — leaderboard reorders
- [ ] Save + join an event — appears under "Saved" / "Joined"
- [ ] Create a post — appears in feed
- [ ] Edit profile photo — appears in topbar and profile
- [ ] Logout — returns to login page

---

## 🎓 Team (Iteration 1)

- 5 members, 2 technical
- Roles and responsibilities documented in `HealthQuest_App_SAD_Plan.md`

---

## 📜 License

See `LICENSE`.
