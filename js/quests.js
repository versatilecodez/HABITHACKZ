/* HealthQuest — Quest System */
HQ.QUEST_TEMPLATES = {
  daily: [
    { id: 'walk-3k', icon: '🚶', title: 'Walk 3,000 steps', xp: 30, coins: 5, defaultFor: ['walking', 'lose-weight'] },
    { id: 'walk-5k', icon: '🚶‍♂️', title: 'Walk 5,000 steps', xp: 50, coins: 8, defaultFor: ['walking'] },
    { id: 'water-2l', icon: '💧', title: 'Drink 2L of water', xp: 25, coins: 5, defaultFor: ['manage-diabetes', 'eat-better'] },
    { id: 'water-3l', icon: '💧', title: 'Drink 3L of water', xp: 35, coins: 7, defaultFor: ['manage-diabetes'] },
    { id: 'healthy-meal', icon: '🥗', title: 'Eat a healthy meal', xp: 30, coins: 5, defaultFor: ['eat-better', 'lose-weight', 'manage-diabetes'] },
    { id: 'no-sugar', icon: '🚫', title: 'Skip sugary drinks', xp: 25, coins: 5, defaultFor: ['manage-diabetes', 'lower-bp'] },
    { id: 'meditation-10', icon: '🧘', title: 'Meditate for 10 minutes', xp: 25, coins: 4, defaultFor: ['reduce-stress', 'sleep-better'] },
    { id: 'sleep-7', icon: '😴', title: 'Sleep 7+ hours', xp: 30, coins: 5, defaultFor: ['sleep-better', 'reduce-stress'] },
    { id: 'no-smoke', icon: '🚭', title: 'Stay smoke-free', xp: 35, coins: 6, defaultFor: ['quit-smoking'] },
    { id: 'log-activity', icon: '📝', title: 'Log an activity', xp: 20, coins: 4, defaultFor: ['build-muscle'] },
    { id: 'medication-taken', icon: '💊', title: 'Take your medication', xp: 20, coins: 4, defaultFor: ['manage-diabetes', 'lower-bp'] }
  ],
  weekly: [
    { id: 'walk-50k', icon: '🎯', title: 'Walk 50,000 steps this week', xp: 200, coins: 30, defaultFor: ['walking', 'lose-weight'] },
    { id: 'workouts-3', icon: '💪', title: 'Complete 3 workouts this week', xp: 150, coins: 25, defaultFor: ['build-muscle', 'gym'] },
    { id: 'log-5-activities', icon: '📊', title: 'Log 5 activities this week', xp: 120, coins: 20, defaultFor: [] },
    { id: 'community-post', icon: '📣', title: 'Share a post in the feed', xp: 50, coins: 10, defaultFor: [] },
    { id: 'join-event', icon: '📅', title: 'Join a community event', xp: 80, coins: 15, defaultFor: [] },
    { id: 'medication-full-week', icon: '💊', title: 'Take medication 7 days in a row', xp: 120, coins: 20, defaultFor: ['manage-diabetes', 'lower-bp'] }
  ]
};

HQ.getQuestsForUser = function(userId) {
  const all = JSON.parse(localStorage.getItem(HQ.KEYS.QUESTS) || '{}');
  const uid = String(userId);
  return (all[uid] || []);
};

HQ.saveQuestsForUser = function(userId, quests) {
  const all = JSON.parse(localStorage.getItem(HQ.KEYS.QUESTS) || '{}');
  all[String(userId)] = quests;
  localStorage.setItem(HQ.KEYS.QUESTS, JSON.stringify(all));
};

HQ.refreshQuestsForUser = function(userId) {
  const user = HQ.findUserById(userId);
  if (!user) return;
  let quests = HQ.getQuestsForUser(userId);
  const todayKey = HQ.todayKey();
  const goals = user.goals || [];
  const interests = user.interests || [];
  const matchSet = new Set([...goals, ...interests]);

  const existingIds = new Set(quests.map(q => q.id + '-' + q.type));

  // Daily quests: pick 3 templates that match user
  const dailyTemplates = HQ.QUEST_TEMPLATES.daily.filter(t => t.defaultFor.some(g => matchSet.has(g)));
  const fallbackDaily = HQ.QUEST_TEMPLATES.daily.filter(t => t.defaultFor.length === 0);
  const selectedDaily = [...dailyTemplates.slice(0, 3), ...fallbackDaily.slice(0, Math.max(0, 3 - dailyTemplates.length))].slice(0, 3);

  selectedDaily.forEach((t, i) => {
    const id = t.id + '-' + todayKey;
    if (!existingIds.has(id)) {
      quests.push({
        id: id,
        baseId: t.id,
        type: 'daily',
        icon: t.icon,
        title: t.title,
        xp: t.xp,
        coins: t.coins,
        createdDate: todayKey,
        completedDates: []
      });
    }
  });

  // Weekly quests: refresh weekly (every Monday)
  const weekKey = HQ.weekKey();
  const weeklyTemplates = HQ.QUEST_TEMPLATES.weekly.filter(t => t.defaultFor.some(g => matchSet.has(g)));
  const fallbackWeekly = HQ.QUEST_TEMPLATES.weekly.filter(t => t.defaultFor.length === 0);
  const selectedWeekly = [...weeklyTemplates.slice(0, 2), ...fallbackWeekly.slice(0, Math.max(0, 2 - weeklyTemplates.length))].slice(0, 2);

  selectedWeekly.forEach(t => {
    const id = t.id + '-' + weekKey;
    if (!existingIds.has(id)) {
      quests.push({
        id: id,
        baseId: t.id,
        type: 'weekly',
        icon: t.icon,
        title: t.title,
        xp: t.xp,
        coins: t.coins,
        createdDate: weekKey,
        completedDates: []
      });
    }
  });

  // Cleanup old quests older than 14 days
  const cutoff = Date.now() - 14 * 86400000;
  quests = quests.filter(q => {
    if (!q.createdDate) return true;
    const ts = Date.parse(q.createdDate);
    return isNaN(ts) || ts >= cutoff;
  });

  HQ.saveQuestsForUser(userId, quests);
};

HQ.completeQuestForUser = function(userId, questId) {
  const user = HQ.findUserById(userId);
  if (!user) return;
  const quests = HQ.getQuestsForUser(userId);
  const quest = quests.find(q => q.id === questId);
  if (!quest) return;
  const tk = HQ.todayKey();
  if (quest.type === 'daily') {
    if (quest.completedDates.includes(tk)) return;
    quest.completedDates.push(tk);
    HQ.saveQuestsForUser(userId, quests);
    HQ.addXP(user, quest.xp);
    HQ.addCoins(user, quest.coins);
    HQ.updateStreak(user.id);
    HQ.checkBadgeUnlocks(user);
    HQ.toast(`+${quest.xp} XP, +${quest.coins} coins! 🎉`);
  } else if (quest.type === 'weekly') {
    if (quest.completedDates.includes(tk)) return;
    quest.completedDates.push(tk);
    HQ.saveQuestsForUser(userId, quests);
    HQ.addXP(user, quest.xp);
    HQ.addCoins(user, quest.coins);
    HQ.checkBadgeUnlocks(user);
    HQ.toast(`Weekly quest complete! +${quest.xp} XP 🎉`);
  }
};
