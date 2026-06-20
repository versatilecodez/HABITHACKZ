/* HealthQuest — Data storage layer (localStorage) */
const HQ = {
  KEYS: {
    USERS: 'hq_users',
    SESSION: 'hq_session',
    QUESTS: 'hq_quests',
    ACTIVITIES: 'hq_activities',
    MEDICATIONS: 'hq_medications',
    MED_LOGS: 'hq_medication_logs',
    POSTS: 'hq_posts',
    EVENTS: 'hq_events',
    SAVED_EVENTS: 'hq_saved_events',
    JOINED_EVENTS: 'hq_joined_events',
    STREAK: 'hq_streak',
    COMMUNITY_POINTS: 'hq_community_points',
    TOWNSHIPS: 'hq_townships',
    CHALLENGES: 'hq_challenges'
  },

  // Storage helpers
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : (fallback ?? null);
    } catch { return fallback ?? null; }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },

  // User CRUD
  getUsers() { return this.get(this.KEYS.USERS, []); },
  saveUser(user) {
    const users = this.getUsers();
    users.push(user);
    this.set(this.KEYS.USERS, users);
  },
  findUserByEmail(email) {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase());
  },
  findUserByUsername(username) {
    return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
  },
  updateUser(userId, updates) {
    const users = this.getUsers();
    const idx = users.findIndex(u => u.id === userId);
    if (idx >= 0) { users[idx] = { ...users[idx], ...updates }; this.set(this.KEYS.USERS, users); }
    return users[idx];
  },

  // Session
  getSession() { return this.get(this.KEYS.SESSION); },
  setSession(userId) { this.set(this.KEYS.SESSION, { userId, createdAt: Date.now() }); },
  clearSession() { localStorage.removeItem(this.KEYS.SESSION); },
  getCurrentUser() {
    const s = this.getSession();
    if (!s) return null;
    return this.getUsers().find(u => u.id === s.userId) || null;
  },
  requireAuth() {
    if (!this.getCurrentUser()) { window.location.href = 'index.html'; return null; }
    return this.getCurrentUser();
  },

  // Toast
  toast(msg, ms = 2200) {
    let t = document.getElementById('hq-toast');
    if (!t) { t = document.createElement('div'); t.id = 'hq-toast'; t.className = 'toast'; document.body.appendChild(t); }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastT);
    this._toastT = setTimeout(() => t.classList.remove('show'), ms);
  },

  // Format helpers
  fmtDate(ts) {
    const d = new Date(ts);
    return d.toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' });
  },
  fmtRelative(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7) return `${d}d ago`;
    return this.fmtDate(ts);
  },

  // Rank progression
  RANKS: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'],
  rankFromXP(xp) {
    if (xp >= 10000) return 'Diamond';
    if (xp >= 5000) return 'Platinum';
    if (xp >= 2000) return 'Gold';
    if (xp >= 500) return 'Silver';
    return 'Bronze';
  },
  rankClass(rank) { return 'rank-' + rank.toLowerCase(); },
  nextRank(xp) {
    const cur = this.rankFromXP(xp);
    const idx = this.RANKS.indexOf(cur);
    if (idx === this.RANKS.length - 1) return null;
    return this.RANKS[idx + 1];
  },
  xpForRank(rank) {
    return { Bronze: 0, Silver: 500, Gold: 2000, Platinum: 5000, Diamond: 10000 }[rank] || 0;
  },
  xpProgressToNext(xp) {
    const cur = this.rankFromXP(xp);
    const next = this.nextRank(xp);
    if (!next) return 100;
    const curMin = this.xpForRank(cur);
    const nextMin = this.xpForRank(next);
    return Math.min(100, Math.round(((xp - curMin) / (nextMin - curMin)) * 100));
  },

  // Streak
  getStreak(userId) {
    return this.get(this.KEYS.STREAK + '_' + userId, { count: 0, lastDate: null });
  },
  updateStreak(userId) {
    const today = new Date().toISOString().split('T')[0];
    const s = this.getStreak(userId);
    if (s.lastDate === today) return s; // already counted
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    if (s.lastDate === yesterday) { s.count += 1; }
    else { s.count = 1; }
    s.lastDate = today;
    this.set(this.KEYS.STREAK + '_' + userId, s);
    return s;
  },

  // XP / Coins
  addReward(userId, xp, coins) {
    const u = this.getUsers().find(x => x.id === userId);
    if (!u) return;
    u.xp = (u.xp || 0) + xp;
    u.coins = (u.coins || 0) + coins;
    const newRank = this.rankFromXP(u.xp);
    const promoted = newRank !== u.rank;
    u.rank = newRank;
    this.updateUser(userId, { xp: u.xp, coins: u.coins, rank: u.rank });
    if (promoted) this.toast(`Promoted to ${newRank}!`);
  },

  // ID generator
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
};

// Seed sample data on first load
(function seed() {
  if (!localStorage.getItem('hq_seeded_v1')) {
    HQ.set(HQ.KEYS.TOWNSHIPS, [
      { name: 'Mamelodi', points: 1240, members: 24 },
      { name: 'Soshanguve', points: 980, members: 18 },
      { name: 'Tembisa', points: 1450, members: 31 },
      { name: 'Atteridgeville', points: 760, members: 12 },
      { name: 'Hammanskraal', points: 540, members: 9 }
    ]);
    HQ.set(HQ.KEYS.CHALLENGES, [
      { id: HQ.uid(), title: '30-Day Walking Challenge', description: 'Walk 10,000 steps daily for 30 days', township: 'All', xp: 500, coins: 200, endDate: Date.now() + 30*86400000 },
      { id: HQ.uid(), title: 'Hydration Hero', description: 'Drink 2L of water for 14 days straight', township: 'All', xp: 300, coins: 100, endDate: Date.now() + 14*86400000 },
      { id: HQ.uid(), title: 'Soccer Saturday', description: 'Play soccer 4 times this month', township: 'Mamelodi', xp: 250, coins: 80, endDate: Date.now() + 30*86400000 }
    ]);
    HQ.set(HQ.KEYS.EVENTS, [
      { id: HQ.uid(), title: 'Mamelodi Community Fun Run', date: Date.now() + 7*86400000, location: 'Mamelodi Stadium', type: 'Fun Run', description: '5km community fun run. All ages welcome.' },
      { id: HQ.uid(), title: 'Tembisa Soccer Tournament', date: Date.now() + 14*86400000, location: 'Tembisa Sports Ground', type: 'Soccer', description: 'Inter-township soccer tournament. Sign up your team.' },
      { id: HQ.uid(), title: 'Soshanguve Health Walk', date: Date.now() + 3*86400000, location: 'Soshanguve Block X', type: 'Community Walk', description: '3km walk promoting healthy living.' },
      { id: HQ.uid(), title: 'Atteridgeville Yoga in the Park', date: Date.now() + 10*86400000, location: 'AP Park', type: 'Wellness', description: 'Free community yoga session.' }
    ]);
    HQ.set(HQ.KEYS.POSTS, [
      { id: HQ.uid(), author: 'Thabo M.', township: 'Mamelodi', content: 'Completed a 5km walk today! 🔥', likes: 12, comments: [{ user: 'Lerato', text: 'Amazing! Keep it up!' }, { user: 'Sipho', text: 'Proud of you!' }], createdAt: Date.now() - 3600000 },
      { id: HQ.uid(), author: 'Nomsa K.', township: 'Tembisa', content: 'Hit my 30-day streak! 💪', likes: 28, comments: [{ user: 'Karabo', text: 'Goals!' }], createdAt: Date.now() - 7200000 },
      { id: HQ.uid(), author: 'Bongani P.', township: 'Soshanguve', content: 'Drank 2L of water every day this week 💧', likes: 9, comments: [], createdAt: Date.now() - 86400000 }
    ]);
    localStorage.setItem('hq_seeded_v1', '1');
  }
})();

HQ.RANKS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
HQ.RANK_THRESHOLDS = [0, 100, 300, 700, 1500, 3000];
HQ.BADGES = [
  { id: 'first-quest', icon: '🎯', name: 'First Quest', check: (u) => (u.completedQuests || 0) >= 1 },
  { id: 'streak-7', icon: '🔥', name: '7-Day Streak', check: (u) => HQ.getStreak(u.id).count >= 7 },
  { id: 'streak-30', icon: '💎', name: '30-Day Streak', check: (u) => HQ.getStreak(u.id).count >= 30 },
  { id: 'xp-500', icon: '⭐', name: '500 XP Earned', check: (u) => (u.xp || 0) >= 500 },
  { id: 'xp-1500', icon: '🌟', name: '1500 XP Earned', check: (u) => (u.xp || 0) >= 1500 },
  { id: 'first-activity', icon: '🏃', name: 'First Activity', check: (u) => (u.activitiesLogged || 0) >= 1 },
  { id: 'activities-10', icon: '💪', name: '10 Activities', check: (u) => (u.activitiesLogged || 0) >= 10 },
  { id: 'first-med', icon: '💊', name: 'Med Tracked', check: (u) => (u.medsTracked || 0) >= 1 },
  { id: 'first-post', icon: '📣', name: 'First Post', check: (u) => (u.postsMade || 0) >= 1 },
  { id: 'community-join', icon: '🤝', name: 'Joined Event', check: (u) => (u.eventsJoined || 0) >= 1 }
];

HQ.rankIcon = function(rank) {
  return { Bronze: '🥉', Silver: '🥈', Gold: '🥇', Platinum: '💠', Diamond: '💎' }[rank] || '🥉';
};

HQ.addXP = function(user, amount) {
  user.xp = (user.xp || 0) + amount;
  user.completedQuests = (user.completedQuests || 0) + 1;
  for (let i = HQ.RANK_THRESHOLDS.length - 1; i >= 0; i--) {
    if ((user.xp || 0) >= HQ.RANK_THRESHOLDS[i]) {
      const newRank = HQ.RANKS[i] || 'Bronze';
      if (newRank !== user.rank) user.rank = newRank;
      break;
    }
  }
  HQ.updateUser(user);
};

HQ.addCoins = function(user, amount) {
  user.coins = (user.coins || 0) + amount;
  HQ.updateUser(user);
};

HQ.addCommunityPoints = function(user, amount) {
  const map = HQ.get(HQ.KEYS.COMMUNITY_POINTS, {});
  map[user.township] = (map[user.township] || 0) + amount;
  HQ.set(HQ.KEYS.COMMUNITY_POINTS, map);
};

HQ.addToTownship = function(township, amount) {
  const townships = this.get(this.KEYS.TOWNSHIPS, []);
  const t = townships.find(x => x.name === township);
  if (t) {
    t.points = (t.points || 0) + amount;
    this.set(this.KEYS.TOWNSHIPS, townships);
  }
};

HQ.updateStreak = function(userId) {
  const user = HQ.findUserById(userId);
  if (!user) return;
  const today = HQ.todayKey();
  const streak = HQ.getStreak(userId);
  if (streak.lastDate === today) return;
  if (streak.lastDate) {
    const last = new Date(streak.lastDate);
    const now = new Date(today);
    const diff = Math.round((now - last) / 86400000);
    if (diff === 1) streak.count = (streak.count || 0) + 1;
    else streak.count = 1;
  } else {
    streak.count = 1;
  }
  streak.lastDate = today;
  HQ.setStreak(userId, streak);
};

HQ.checkBadgeUnlocks = function(user) {
  user.badges = user.badges || [];
  HQ.BADGES.forEach(b => {
    if (!user.badges.includes(b.id) && b.check(user)) {
      user.badges.push(b.id);
      HQ.toast(`🏅 Badge unlocked: ${b.name}`);
    }
  });
  HQ.updateUser(user);
};

HQ.getTownshipRankings = function() {
  const townships = HQ.get(HQ.KEYS.TOWNSHIPS, []);
  const points = HQ.get(HQ.KEYS.COMMUNITY_POINTS, {});
  return townships
    .map(t => ({ ...t, xp: points[t.name] || t.points || 0 }))
    .sort((a, b) => b.xp - a.xp);
};

HQ.getCurrentMonthlyChallenge = function() {
  const all = HQ.get(HQ.KEYS.CHALLENGES, []);
  return all[0] || null;
};

HQ.MONTHLY_CHALLENGE_TEMPLATES = [
  { id: 'walk-30', title: 'Walk 100km this month', icon: '🚶', target: 100, unit: 'km', metric: 'distance', activityTypes: ['walk','run'], xp: 500, coins: 200 },
  { id: 'water-30', title: 'Drink 2L daily for 30 days', icon: '💧', target: 30, unit: 'days', metric: 'water', xp: 300, coins: 100 },
  { id: 'soccer-4', title: 'Play soccer 4 times this month', icon: '⚽', target: 4, unit: 'games', metric: 'count', activityTypes: ['soccer'], xp: 250, coins: 80 },
  { id: 'gym-8', title: 'Hit the gym 8 times this month', icon: '🏋️', target: 8, unit: 'sessions', metric: 'count', activityTypes: ['gym'], xp: 300, coins: 120 }
];

HQ.logActivity = function(userId, activity) {
  const acts = this.get(this.KEYS.ACTIVITIES + '_' + userId, []);
  acts.push({ id: this.uid(), date: Date.now(), ...activity });
  this.set(this.KEYS.ACTIVITIES + '_' + userId, acts);
  const types = { walk: '🚶 Walk', run: '🏃 Run', soccer: '⚽ Soccer', gym: '🏋️ Gym' };
  const t = types[activity.type] || activity.type;
  const xp = this.activityXP(activity, activity.duration, activity.distance);
  this.addXP(userId, xp);
  this.addCoins(userId, Math.floor(xp / 6));
  this.addCommunityPoints(userId, Math.floor(xp / 10));
  this.updateStreak(userId);
  this.checkBadgeUnlocks(this.getUser(userId));

  // Quest auto-completion: check active daily quests against this activity
  const user = this.getUser(userId);
  if (user && typeof this.getQuestsForUser === 'function') {
    const today = this.todayKey();
    const quests = this.getQuestsForUser(userId) || [];
    quests.forEach(quest => {
      if (!quest) return;
      if (quest.type !== 'daily') return;
      if (quest.completedDates && quest.completedDates.includes(today)) return;
      if (!this._questMatchesActivity(quest, activity)) return;
      this.completeQuest(userId, quest.id);
    });
  }

  // Township auto-contribution: +5 points per activity logged
  if (user && user.township) {
    this.addToTownship(user.township, 5);
  }
};

HQ._questMatchesActivity = function(quest, activity) {
  if (!quest || !activity) return false;
  const title = (quest.title || '').toLowerCase();
  const type = (activity.type || '').toLowerCase();
  const actName = (activity.name || '').toLowerCase();

  const keywordMap = {
    walk: ['walk', 'step'],
    run: ['run', 'jog', 'jogging'],
    soccer: ['soccer', 'football'],
    gym: ['gym', 'workout', 'lift', 'strength'],
    water: ['water', 'hydrate', 'drink'],
    meditation: ['meditat', 'mindful', 'breath'],
    sleep: ['sleep'],
    meal: ['meal', 'eat', 'food'],
    smoke: ['smoke', 'smok', 'cigarette', 'vape'],
    medication: ['med', 'medication', 'pill']
  };
  const keywords = keywordMap[type] || (type ? [type] : []);
  const haystack = title + ' ' + actName;
  const keywordMatch = keywords.some(k => haystack.includes(k));
  if (!keywordMatch) return false;

  // Threshold check: parse "3km", "5,000 steps", "2L", "10 minutes" from title
  const m = title.match(/(\d[\d,.]*)\s*(km|k\b|m\b|l\b|min|minute|step|hour)/);
  if (m) {
    const threshold = parseFloat(m[1].replace(/,/g, ''));
    const unit = m[2];
    if (unit.startsWith('km') || unit === 'k') {
      const dist = parseFloat(activity.distance) || 0;
      if (dist < threshold) return false;
    } else if (unit === 'm' && !unit.startsWith('km')) {
      const dist = (parseFloat(activity.distance) || 0) * 1000;
      if (dist < threshold) return false;
    } else if (unit === 'l') {
      const vol = parseFloat(activity.amount) || parseFloat(activity.volume) || 0;
      if (vol < threshold) return false;
    } else if (unit === 'step') {
      const steps = parseInt(activity.steps, 10) || 0;
      if (steps < threshold) return false;
    } else if (unit.startsWith('min')) {
      const dur = parseFloat(activity.duration) || 0;
      if (dur < threshold) return false;
    } else if (unit === 'hour') {
      const dur = parseFloat(activity.duration) || 0;
      if (dur < threshold * 60) return false;
    }
  }

  return true;
};

HQ.getActivities = function(userId) {
  return this.get(this.KEYS.ACTIVITIES + '_' + userId, []);
};

HQ.activityXP = function(activity, duration, distance) {
  const dur = duration || 0;
  const dist = distance || 0;
  if (activity === 'run') return Math.max(10, Math.round(dur * 1.5 + dist * 8));
  if (activity === 'soccer') return Math.max(15, Math.round(dur * 1.2));
  if (activity === 'gym') return Math.max(10, Math.round(dur * 1.0));
  return Math.max(8, Math.round(dur * 0.8 + dist * 6));
};

HQ.addMedication = function(userId, med) {
  const meds = this.getMedications(userId);
  meds.push({ id: this.uid(), addedAt: Date.now(), ...med });
  this.set(this.KEYS.MEDICATIONS + '_' + userId, meds);
  this.setReminder(userId, med);
};

HQ.getMedications = function(userId) {
  return this.get(this.KEYS.MEDICATIONS + '_' + userId, []);
};

HQ.removeMedication = function(userId, medId) {
  const meds = this.getMedications(userId).filter(m => m.id !== medId);
  this.set(this.KEYS.MEDICATIONS + '_' + userId, meds);
};

HQ.logMedication = function(userId, medId, photoProof) {
  const logs = this.get(this.KEYS.MED_LOGS + '_' + userId, []);
  const meds = this.getMedications(userId);
  const med = meds.find(m => m.id === medId);
  logs.push({ id: this.uid(), medicationId: medId, name: med?.name, dose: med?.dose, takenAt: Date.now(), photoProof: photoProof || null });
  this.set(this.KEYS.MED_LOGS + '_' + userId, logs);
  this.addXP(userId, 15);
  this.addCoins(userId, 3);
  this.updateStreak(userId);
  this.checkBadgeUnlocks(this.getUser(userId));
};

HQ.getMedicationLogs = function(userId) {
  return this.get(this.KEYS.MED_LOGS + '_' + userId, []);
};

HQ.setReminder = function(userId, med) {
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    const [h, m] = (med.time || '08:00').split(':').map(Number);
    const now = new Date();
    const next = new Date();
    next.setHours(h, m, 0, 0);
    if (next <= now) next.setDate(next.getDate() + 1);
    const delay = next - now;
    setTimeout(() => {
      new Notification('💊 HealthQuest Reminder', { body: `Time to take ${med.name} ${med.dose || ''}` });
    }, delay);
  }
};

HQ.requestNotificationPermission = function() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
};

HQ.getCurrentMonthlyChallenges = function() {
  const all = this.get(this.KEYS.CHALLENGES, []);
  return all.filter(c => !c.endDate || c.endDate > Date.now());
};

HQ.getPosts = function() { return this.get(this.KEYS.POSTS, []); };
HQ.addPost = function(author, township, content) {
  const posts = this.getPosts();
  posts.push({ id: this.uid(), author, township, content, likes: 0, comments: [], createdAt: Date.now() });
  this.set(this.KEYS.POSTS, posts);
};
HQ.likePost = function(postId) {
  const posts = this.getPosts();
  const p = posts.find(x => x.id === postId);
  if (p) { p.likes++; this.set(this.KEYS.POSTS, posts); }
};
HQ.addComment = function(postId, user, text) {
  const posts = this.getPosts();
  const p = posts.find(x => x.id === postId);
  if (p) { p.comments.push({ user, text }); this.set(this.KEYS.POSTS, posts); }
};

HQ.getEvents = function() { return this.get(this.KEYS.EVENTS, []); };
HQ.saveEvent = function(userId, eventId) {
  const list = this.get(this.KEYS.SAVED_EVENTS + '_' + userId, []);
  if (!list.includes(eventId)) list.push(eventId);
  this.set(this.KEYS.SAVED_EVENTS + '_' + userId, list);
};
HQ.unsaveEvent = function(userId, eventId) {
  const list = this.get(this.KEYS.SAVED_EVENTS + '_' + userId, []).filter(id => id !== eventId);
  this.set(this.KEYS.SAVED_EVENTS + '_' + userId, list);
};
HQ.joinEvent = function(userId, eventId) {
  const list = this.get(this.KEYS.JOINED_EVENTS + '_' + userId, []);
  if (!list.includes(eventId)) {
    list.push(eventId);
    this.set(this.KEYS.JOINED_EVENTS + '_' + userId, list);
    this.addXP(userId, 50);
    this.addCoins(userId, 15);
    this.checkBadgeUnlocks(this.getUser(userId));
  }
};
HQ.getSavedEvents = function(userId) {
  const ids = this.get(this.KEYS.SAVED_EVENTS + '_' + userId, []);
  return this.getEvents().filter(e => ids.includes(e.id));
};
HQ.getJoinedEvents = function(userId) {
  const ids = this.get(this.KEYS.JOINED_EVENTS + '_' + userId, []);
  return this.getEvents().filter(e => ids.includes(e.id));
};
HQ.isEventSaved = function(userId, eventId) {
  return this.get(this.KEYS.SAVED_EVENTS + '_' + userId, []).includes(eventId);
};
HQ.isEventJoined = function(userId, eventId) {
  return this.get(this.KEYS.JOINED_EVENTS + '_' + userId, []).includes(eventId);
};

HQ.requireAuth = function() {
  const session = this.getSession();
  if (!session || !session.userId) return null;
  const u = this.getUser(session.userId);
  if (!u) { this.clearSession(); return null; }
  return u;
};

HQ.getUser = function(id) {
  return this.getUsers().find(u => u.id === id) || null;
};

HQ.getUserByUsername = function(username) {
  return this.getUsers().find(u => u.username.toLowerCase() === username.toLowerCase());
};

HQ.editProfile = function(userId, updates) {
  return this.updateUser(userId, updates);
};

HQ.completeQuest = function(userId, questId) {
  const user = this.getUser(userId);
  if (!user) return;
  user.completedQuests = (user.completedQuests || 0) + 1;
  this.updateUser(userId, { completedQuests: user.completedQuests });
};

HQ.getCommunityPoints = function(township) {
  const map = this.get(this.KEYS.COMMUNITY_POINTS, {});
  return map[township] || 0;
};

HQ.contribute = function(township, amount) {
  const map = this.get(this.KEYS.COMMUNITY_POINTS, {});
  map[township] = (map[township] || 0) + amount;
  this.set(this.KEYS.COMMUNITY_POINTS, map);
};

HQ.contributeCommunityPoints = function(userId, amount) {
  const u = this.getUser(userId);
  if (u && u.township) this.addToTownship(u.township, amount || 10);
  this.updateUser(userId, { lastCommunityContribute: Date.now() });
  return u;
};