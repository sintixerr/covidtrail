// ============================================================
// THE COVID TRAIL - An Oregon Trail Parody
// "The Errand Run" — Definitive Edition
// ============================================================

const Game = {
  state: null,
  narrative: document.getElementById('narrative'),
  choices: document.getElementById('choices'),
  statusBar: document.getElementById('status-bar'),

  init() {
    this.state = {
      phase: 'title',
      occupation: null,
      occupationName: '',
      scoreMultiplier: 1,
      transport: null,
      party: [],
      resources: {
        masks: 5,
        sanitizer: 8,
        toiletPaper: 4,
        phoneBattery: 100,
        patience: 100,
        willpower: 100,
        cash: 40
      },
      pace: 'normal',
      distancing: 'moderate',
      time: { hour: 8, minute: 0 },
      errands: ['grocery', 'pharmacy', 'postoffice', 'bank', 'hardware'],
      completedErrands: [],
      closedErrands: [],
      currentErrand: null,
      errandOrder: [],
      errandIndex: 0,
      day: 'Saturday',
      month: 'October',
      year: 2020,
      exposureLevel: 0,
      weather: 'clear',
      supplyHuntsToday: 0
    };
    this.showTitle();
  },

  // ─── DISPLAY HELPERS ──────────────────────────────────

  clear() {
    this.narrative.innerHTML = '';
    this.choices.innerHTML = '';
  },

  print(text) {
    this.narrative.innerHTML += text + '\n';
  },

  separator() {
    return '='.repeat(window.innerWidth < 600 ? 26 : 40);
  },

  printLines(lines) {
    this.narrative.innerHTML += lines.join('\n') + '\n';
  },

  addChoice(key, text, callback) {
    const btn = document.createElement('button');
    btn.innerHTML = `<span class="key">[${key}]</span> ${text}`;
    btn.onclick = () => callback();
    this.choices.appendChild(btn);
  },

  updateStatus() {
    if (!this.state || this.state.phase === 'title') {
      this.statusBar.innerHTML = '';
      return;
    }
    const r = this.state.resources;
    const timeStr = this.formatTime();
    const alive = this.getAliveParty();
    const errandsDone = this.state.completedErrands.length;

    let partyStr = alive.map(p => {
      const h = p.health;
      const heart = h > 66 ? '<span class="success">&#9829;</span>' :
                    h > 33 ? '<span class="warning">&#9829;</span>' :
                    '<span class="danger">&#9829;</span>';
      const tag = p.status === 'symptomatic' ? ' <span class="danger">[sick]</span>' :
                  p.status === 'exposed' ? ' <span class="warning">[exp]</span>' : '';
      return `${p.name}${heart}${tag}`;
    }).join(' | ');

    const dead = this.state.party.filter(p => p.status === 'dead');
    if (dead.length > 0) {
      partyStr += ' | <span class="danger">RIP: ' + dead.map(p => p.name).join(', ') + '</span>';
    }

    const weatherTag = this.state.weather !== 'clear'
      ? ' | <span class="warning">' + this.weatherLabel() + '</span>' : '';

    this.statusBar.innerHTML =
      `<span class="stat-row">${this.state.day}, ${this.state.month} ${this.state.year} | Time: <span class="${this.state.time.hour >= 17 ? 'warning' : ''}">${timeStr}</span>${weatherTag}</span> ` +
      `<span class="stat-row">Masks: ${r.masks} | Sanitizer: ${r.sanitizer} | TP: ${r.toiletPaper}</span> ` +
      `<span class="stat-row">Phone: ${r.phoneBattery}% | Patience: ${r.patience}% | $${r.cash} | Errands: ${errandsDone}/5</span> ` +
      `<span class="stat-row">Party: ${partyStr}</span>`;
  },

  weatherLabel() {
    return { clear: '', rainy: 'Rain', hot: 'Hot', windy: 'Windy' }[this.state.weather] || '';
  },

  formatTime() {
    const h = this.state.time.hour;
    const m = this.state.time.minute.toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h > 12 ? h - 12 : h;
    return `${displayH}:${m} ${ampm}`;
  },

  // ─── RESOURCE HELPERS ─────────────────────────────────

  advanceTime(minutes) {
    this.state.time.minute += minutes;
    while (this.state.time.minute >= 60) {
      this.state.time.minute -= 60;
      this.state.time.hour += 1;
    }
  },

  degradeMask() {
    if (Math.random() < 0.3) {
      this.state.resources.masks = Math.max(0, this.state.resources.masks - 1);
    }
  },

  useSanitizer() {
    this.state.resources.sanitizer = Math.max(0, this.state.resources.sanitizer - 1);
  },

  drainBattery(amount) {
    this.state.resources.phoneBattery = Math.max(0, this.state.resources.phoneBattery - amount);
  },

  losePatience(amount) {
    const mod = this.state.pace === 'rushing' ? 1.3 : this.state.pace === 'careful' ? 0.7 : 1;
    this.state.resources.patience = Math.max(0, this.state.resources.patience - Math.round(amount * mod));
  },

  loseWillpower(amount) {
    this.state.resources.willpower = Math.max(0, this.state.resources.willpower - amount);
  },

  random(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  },

  chance(pct) {
    return Math.random() * 100 < pct;
  },

  shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },

  errandName(id) {
    const names = {
      grocery: 'Grocery Store', pharmacy: 'Pharmacy',
      postoffice: 'Post Office', bank: 'Bank', hardware: 'Hardware Store'
    };
    return names[id] || id;
  },

  // ─── PARTY HEALTH SYSTEM ──────────────────────────────

  getAliveParty() {
    return this.state.party.filter(p => p.status !== 'dead');
  },

  isPlayerDead() {
    return this.state.party[0] && this.state.party[0].status === 'dead';
  },

  getDeathCause() {
    return this.random([
      'has died of COVID',
      'has died of boredom',
      'has been overcome by finance zom-bro\'s',
      'has died of Zoom fatigue',
      'has succumbed to doomscrolling',
      'has contracted terminal cabin fever',
      'has perished from mask-induced glasses fog',
      'has been lost to a TikTok rabbit hole',
      'has died of sourdough-starter neglect',
      'has expired from hand sanitizer fumes',
      'has been taken by the 5G conspiracy theories',
      'has died of contactless payment confusion',
      'has withered from vitamin D deficiency',
      'has been consumed by existential dread',
      'has drowned in a sea of Amazon packages',
      'has flatlined from Netflix autoplay',
      'has been swallowed by a Costco parking lot',
      'has perished in a hand sanitizer shortage',
      'has been defeated by a fitted N95',
      'has vanished into a Zoom breakout room',
      'has been crushed by a pallet of Charmin',
      'has succumbed to Instacart delivery anxiety'
    ]);
  },

  damagePartyMember(member, amount) {
    if (member.status === 'dead') return;
    member.health = Math.max(0, member.health - amount);
    if (member.health <= 0) {
      this.killPartyMember(member);
    } else if (member.health <= 30 && member.status !== 'symptomatic') {
      member.status = 'symptomatic';
    } else if (member.health <= 60 && member.status === 'healthy') {
      member.status = 'exposed';
    }
  },

  damageAllParty(amount) {
    this.getAliveParty().forEach(p => this.damagePartyMember(p, amount));
  },

  healPartyMember(member, amount) {
    if (member.status === 'dead') return;
    member.health = Math.min(100, member.health + amount);
    if (member.health > 60) member.status = 'healthy';
    else if (member.health > 30) member.status = 'exposed';
  },

  killPartyMember(member) {
    member.status = 'dead';
    member.health = 0;
    member.causeOfDeath = this.getDeathCause();
  },

  addExposure(amount) {
    const mod = this.state.distancing === 'strict' ? 0.5 :
                this.state.distancing === 'yolo' ? 2.0 : 1.0;
    this.state.exposureLevel += Math.round(amount * mod);
  },

  checkPartyHealth() {
    const alive = this.getAliveParty();
    if (alive.length === 0) return null;

    // Exposure can cause illness
    if (this.state.exposureLevel > 30 && this.chance(this.state.exposureLevel / 4)) {
      const target = this.random(alive);
      if (target.status === 'healthy') {
        this.damagePartyMember(target, 15);
        if (target.status === 'dead') {
          return { type: 'death', members: [target] };
        }
        if (target.status === 'healthy') target.status = 'exposed';
        return { type: 'exposed', member: target };
      }
    }

    // Symptomatic members can infect others (illness cascade)
    const symptomatic = alive.filter(p => p.status === 'symptomatic');
    if (symptomatic.length > 0 && this.chance(20)) {
      const healthy = alive.filter(p => p.status === 'healthy');
      if (healthy.length > 0) {
        const target = this.random(healthy);
        this.damagePartyMember(target, 10);
        if (target.status === 'dead') {
          return { type: 'death', members: [target] };
        }
        if (target.status === 'healthy') target.status = 'exposed';
        return { type: 'cascade', from: symptomatic[0], to: target };
      }
    }

    // Rushing pace drains health
    if (this.state.pace === 'rushing') {
      alive.forEach(p => this.damagePartyMember(p, 2));
    }

    // Check for any deaths
    const newlyDead = alive.filter(p => p.status === 'dead');
    if (newlyDead.length > 0) {
      return { type: 'death', members: newlyDead };
    }

    return null;
  },

  showHealthEvent(event, callback) {
    if (!event) { callback(); return; }

    this.clear();
    this.updateStatus();

    switch (event.type) {
      case 'exposed':
        this.print('<span class="warning">HEALTH ALERT</span>');
        this.print('');
        this.print(`${event.member.name} is not feeling well.`);
        this.print('A mysterious cough has developed.');
        this.print('Is it COVID? Allergies? Psychosomatic?');
        this.print('Nobody knows. Everyone moves 2 feet away.');
        this.print('');
        this.addChoice('1', 'Use sanitizer and press on', () => {
          this.useSanitizer();
          callback();
        });
        this.addChoice('2', 'Rest briefly (+10 health, +10 min)', () => {
          this.advanceTime(10);
          this.healPartyMember(event.member, 10);
          this.updateStatus();
          callback();
        });
        break;

      case 'cascade':
        this.print('<span class="danger">ILLNESS SPREADING</span>');
        this.print('');
        this.print(`${event.from.name} sneezed near ${event.to.name}.`);
        this.print('It was inside the mask, but still.');
        this.print('The psychological damage is done.');
        this.print(`${event.to.name} is now showing symptoms.`);
        this.print('');
        this.addChoice('1', 'Quarantine them in the car', () => {
          this.advanceTime(5);
          this.healPartyMember(event.to, 5);
          callback();
        });
        this.addChoice('2', 'Press on (risk further spread)', () => {
          this.addExposure(10);
          callback();
        });
        break;

      case 'death':
        event.members.forEach(m => {
          this.print(`<span class="danger">${this.separator()}</span>`);
          this.print(`<span class="danger">  ${m.name} ${m.causeOfDeath}.</span>`);
          this.print(`<span class="danger">${this.separator()}</span>`);
          this.print('');
        });

        if (this.isPlayerDead()) {
          this.print('Your errand run is over.');
          this.print('');
          this.addChoice('R', 'View final results', () => this.gameOver('death'));
        } else {
          this.print('The party grows smaller. The errands remain.');
          this.print('');
          this.addChoice('R', 'Continue in their memory', callback);
        }
        break;
    }
  },

  // ─── TITLE SCREEN ─────────────────────────────────────

  showTitle() {
    this.clear();
    this.print(`<span class="title">${this.separator()}</span>`);
    this.print('<span class="title">T H E   C O V I D</span>');
    this.print('<span class="title">T R A I L</span>');
    this.print(`<span class="title">${this.separator()}</span>`);
    this.print('');
    this.print('<span class="subtitle">An Oregon Trail Parody</span>');
    this.print('<span class="subtitle">"The Errand Run" -- Definitive Edition</span>');
    this.print('');
    this.print('<span class="dim">The year is 2020. It\'s Saturday morning.</span>');
    this.print('<span class="dim">You have 5 errands to run.</span>');
    this.print('<span class="dim">Pre-COVID, this took 2 hours.</span>');
    this.print('<span class="dim">Now? God help you.</span>');
    this.print('');
    this.print('<span class="dim">Stores close early. Your mask is damp.</span>');
    this.print('<span class="dim">The pharmacy line wraps the building.</span>');
    this.print('<span class="dim">Your phone is at 73%.</span>');
    this.print('<span class="dim">You haven\'t been to the bank in 8 months.</span>');
    this.print('');

    this.addChoice('ENTER', 'Begin your journey', () => this.chooseOccupation());
  },

  // ─── SETUP: OCCUPATION ─────────────────────────────────

  chooseOccupation() {
    this.clear();
    this.print('<span class="highlight">What is your occupation?</span>');
    this.print('');
    this.print('Your job determines your starting resources');
    this.print('and how your errand run will be scored.');
    this.print('');

    this.addChoice('1', 'WFH Tech Worker -- $80, full battery, atrophied social skills (Easy, x1 score)', () => {
      this.state.occupation = 'tech';
      this.state.occupationName = 'WFH Tech Worker';
      this.state.scoreMultiplier = 1;
      this.state.resources.cash = 80;
      this.state.resources.phoneBattery = 100;
      this.state.resources.willpower -= 10;
      this.chooseTransport();
    });
    this.addChoice('2', 'Essential Worker -- $40, extra PPE, seen some things (Medium, x2 score)', () => {
      this.state.occupation = 'essential';
      this.state.occupationName = 'Essential Worker';
      this.state.scoreMultiplier = 2;
      this.state.resources.cash = 40;
      this.state.resources.masks = 8;
      this.state.resources.sanitizer = 12;
      this.chooseTransport();
    });
    this.addChoice('3', 'Gig Worker -- $20, no benefits, pure grit (Hard, x3 score)', () => {
      this.state.occupation = 'gig';
      this.state.occupationName = 'Gig Worker';
      this.state.scoreMultiplier = 3;
      this.state.resources.cash = 20;
      this.state.resources.masks = 3;
      this.state.resources.sanitizer = 4;
      this.state.resources.phoneBattery = 60;
      this.chooseTransport();
    });
  },

  // ─── SETUP: TRANSPORT ──────────────────────────────────

  chooseTransport() {
    this.clear();
    this.print('<span class="highlight">How will you traverse the city?</span>');
    this.print('');
    this.print('Your choice affects travel time, parking hassles,');
    this.print('and your moral standing among peers.');
    this.print('');

    this.addChoice('1', 'Drive (car) - Fast but parking is war', () => {
      this.state.transport = 'car';
      this.chooseParty();
    });
    this.addChoice('2', 'Public transit - Slow, terrifying, but righteous', () => {
      this.state.transport = 'transit';
      this.state.resources.patience -= 10;
      this.chooseParty();
    });
    this.addChoice('3', 'Bicycle - Healthy, smug, no cargo space', () => {
      this.state.transport = 'bike';
      this.state.resources.willpower -= 10;
      this.chooseParty();
    });
  },

  // ─── SETUP: PARTY ──────────────────────────────────────

  makeMember(name) {
    return { name, health: 100, status: 'healthy', causeOfDeath: null };
  },

  chooseParty() {
    this.clear();
    this.print('<span class="highlight">Who\'s coming with you?</span>');
    this.print('');
    this.print('Party members have abilities and... liabilities.');
    this.print('Each person has their own health. If YOU go down,');
    this.print('the errand run is over for everyone.');
    this.print('');

    this.addChoice('1', 'Go solo - Maximum efficiency, maximum loneliness', () => {
      this.state.party = [this.makeMember('You')];
      this.planRoute();
    });
    this.addChoice('2', 'Bring spouse - Can split up, will have opinions', () => {
      this.state.party = [this.makeMember('You'), this.makeMember('Spouse')];
      this.planRoute();
    });
    this.addChoice('3', 'Bring the kids - Chaos agents, but family parking', () => {
      this.state.party = [this.makeMember('You'), this.makeMember('Kid (8)'), this.makeMember('Kid (5)')];
      this.state.resources.patience -= 15;
      this.planRoute();
    });
    this.addChoice('4', 'Full family expedition - God speed', () => {
      this.state.party = [this.makeMember('You'), this.makeMember('Spouse'),
                          this.makeMember('Kid (8)'), this.makeMember('Kid (5)')];
      this.state.resources.patience -= 20;
      this.state.resources.masks -= 1;
      this.planRoute();
    });
  },

  // ─── SETUP: ROUTE ──────────────────────────────────────

  planRoute() {
    this.clear();
    this.print('<span class="highlight">Plan your route.</span>');
    this.print('');
    this.print('Choose your first errand wisely. Stores have');
    this.print('different peak hours and capacity limits.');
    this.print('');
    this.print('  <span class="success">1. Grocery Store</span> - Opens 7AM, busiest 10AM-12PM');
    this.print('  <span class="success">2. Pharmacy</span> - Opens 9AM, pharmacist lunch ????');
    this.print('  <span class="success">3. Post Office</span> - Opens 9AM, closes 3PM (!)');
    this.print('  <span class="success">4. Bank</span> - Opens 9AM, "appointment preferred"');
    this.print('  <span class="success">5. Hardware Store</span> - Opens 8AM, weirdly chill');
    this.print('');
    this.print('<span class="dim">Recommended: Hit the post office before it</span>');
    this.print('<span class="dim">closes at 3. Everything else is negotiable.</span>');
    this.print('');

    this.addChoice('A', 'Optimized route (Post Office early, Hardware last)', () => {
      this.state.errandOrder = ['postoffice', 'bank', 'pharmacy', 'grocery', 'hardware'];
      this.startJourney();
    });
    this.addChoice('B', 'Grocery first (get it over with)', () => {
      this.state.errandOrder = ['grocery', 'postoffice', 'pharmacy', 'bank', 'hardware'];
      this.startJourney();
    });
    this.addChoice('C', 'Wing it (random order, chaotic energy)', () => {
      this.state.errandOrder = this.shuffleArray([...this.state.errands]);
      this.startJourney();
    });
  },

  // ─── WEATHER SYSTEM ────────────────────────────────────

  rollWeather() {
    const r = Math.random();
    if (r < 0.5) this.state.weather = 'clear';
    else if (r < 0.7) this.state.weather = 'rainy';
    else if (r < 0.85) this.state.weather = 'hot';
    else this.state.weather = 'windy';
  },

  maybeChangeWeather() {
    if (this.chance(25)) {
      const old = this.state.weather;
      this.rollWeather();
      return old !== this.state.weather ? this.state.weather : null;
    }
    return null;
  },

  // ─── JOURNEY START ─────────────────────────────────────

  startJourney() {
    this.state.phase = 'journey';
    this.advanceTime(15);
    this.rollWeather();
    this.updateStatus();
    this.clear();

    const transportMsg = {
      car: 'You grab your keys, triple-check your mask, and head to the car.',
      transit: 'You check the bus schedule app. It says 8 minutes. It has said 8 minutes for 20 minutes.',
      bike: 'You strap on your helmet, attach the panniers, and realize you can only carry about 4 items total across all errands.'
    };

    this.print(transportMsg[this.state.transport]);
    this.print('');
    this.print(`<span class="dim">Occupation: ${this.state.occupationName} (x${this.state.scoreMultiplier} score)</span>`);
    this.print(`<span class="dim">Party: ${this.getAliveParty().map(p => p.name).join(', ')}</span>`);
    this.print(`<span class="dim">Route: ${this.state.errandOrder.map(e => this.errandName(e)).join(' -> ')}</span>`);
    this.print(`<span class="dim">Pace: ${this.state.pace} | Distancing: ${this.state.distancing}</span>`);
    this.print('');
    this.print('The city awaits. Nothing will go as planned.');
    this.print('');

    this.addChoice('R', 'Head to ' + this.errandName(this.state.errandOrder[0]), () => {
      this.travelTo(0);
    });
  },

  // ─── TRAVEL ────────────────────────────────────────────

  travelTo(index) {
    this.state.errandIndex = index;
    const errand = this.state.errandOrder[index];
    this.state.currentErrand = errand;

    const baseTime = this.state.transport === 'car' ? 10 :
                     this.state.transport === 'transit' ? 25 : 15;
    const paceMod = this.state.pace === 'rushing' ? 0.7 :
                    this.state.pace === 'careful' ? 1.3 : 1.0;
    this.advanceTime(Math.round(baseTime * paceMod));
    this.drainBattery(3);

    const travelExposure = this.state.transport === 'transit' ? 8 :
                           this.state.transport === 'car' ? 2 : 4;
    this.addExposure(travelExposure);

    // Weather event
    if (this.state.weather !== 'clear' && this.chance(35)) {
      this.weatherEvent(errand);
      return;
    }

    // Crowd crossing (river crossing equivalent)
    if (this.chance(25)) {
      this.crowdCrossing(errand);
      return;
    }

    // Regular travel event
    if (this.chance(40)) {
      this.travelEvent(errand);
      return;
    }

    // Health check
    const healthEvent = this.checkPartyHealth();
    if (healthEvent) {
      this.showHealthEvent(healthEvent, () => this.arriveAtErrand(errand));
      return;
    }

    this.arriveAtErrand(errand);
  },

  // ─── WEATHER EVENTS ────────────────────────────────────

  weatherEvent(nextErrand) {
    this.clear();
    this.updateStatus();

    const events = {
      rainy: {
        title: 'RAIN -- Your Mask Is Dissolving',
        description: 'It\'s raining. Your surgical mask is absorbing water like a sponge. Every breath feels like you\'re waterboarding yourself.',
        choices: [
          {
            text: 'Swap to a fresh mask',
            result: 'You fumble in the rain, trying to swap masks without touching your face. You touch your face. You use sanitizer. Everything is wet.',
            effect: () => { this.degradeMask(); this.useSanitizer(); }
          },
          {
            text: 'Push through with the wet mask',
            result: 'You breathe through what is essentially a wet rag for the next 10 minutes. A new low, even for 2020.',
            effect: () => { this.loseWillpower(10); this.damageAllParty(5); }
          },
          {
            text: 'Wait under an awning',
            result: 'You huddle under a closed store\'s awning. Three other people join you. So much for distancing. At least you\'re dry.',
            effect: () => { this.advanceTime(10); this.addExposure(10); }
          }
        ]
      },
      hot: {
        title: 'HEATWAVE -- Mask Becomes Face Sauna',
        description: 'It\'s unseasonably warm. Your mask has become a portable sauna for your face. Your glasses are fogged. You can see nothing.',
        choices: [
          {
            text: 'Remove glasses, navigate blind',
            result: 'You pocket your glasses and squint. Everything is blurry. You walk into a sandwich board sign. It hurts.',
            effect: () => { this.damagePartyMember(this.state.party[0], 5); this.loseWillpower(5); }
          },
          {
            text: 'Lower mask briefly to defog',
            result: 'You pull the mask down for 3 seconds. A jogger sees you and gives you THE look. You pull it back up.',
            effect: () => { this.addExposure(8); this.loseWillpower(8); }
          },
          {
            text: 'Use sanitizer on lenses (internet hack)',
            result: 'You remember a tip from the internet. You use hand sanitizer on your lenses. It... kind of works. Your eyes sting.',
            effect: () => { this.useSanitizer(); this.advanceTime(3); }
          }
        ]
      },
      windy: {
        title: 'WIND ADVISORY -- Mask In Peril',
        description: 'A gust of wind catches your mask and pulls it off one ear. It flaps from your face like a tiny surrender flag.',
        choices: [
          {
            text: 'Secure it and push forward',
            result: 'The mask holds. Barely. You walk hunched against the wind like a pandemic Quasimodo.',
            effect: () => { this.loseWillpower(5); }
          },
          {
            text: 'Use a fresh mask, tie it tighter',
            result: 'You burn a mask but at least this one won\'t fly off. It\'s so tight you can feel your pulse in your ears.',
            effect: () => { this.degradeMask(); this.degradeMask(); }
          },
          {
            text: 'Fashion a mask from your scarf',
            result: 'You MacGyver a face covering from your scarf. It smells like the back of your closet. But it holds against the wind.',
            effect: () => { this.advanceTime(5); }
          }
        ]
      }
    };

    const event = events[this.state.weather];
    if (!event) { this.arriveAtErrand(nextErrand); return; }

    this.print(`<span class="warning">${event.title}</span>`);
    this.print('');
    this.print(event.description);
    this.print('');

    event.choices.forEach((choice, i) => {
      this.addChoice((i + 1).toString(), choice.text, () => {
        this.clear();
        this.updateStatus();
        this.print(choice.result);
        this.print('');
        choice.effect();
        this.updateStatus();
        this.addChoice('R', 'Continue to ' + this.errandName(nextErrand), () => {
          this.arriveAtErrand(nextErrand);
        });
      });
    });
  },

  // ─── CROWD CROSSINGS (River Crossing Equivalent) ──────

  crowdCrossing(nextErrand) {
    this.clear();
    this.updateStatus();

    const crossings = [
      {
        title: 'CROWD CROSSING -- Packed Sidewalk',
        description: 'The sidewalk ahead narrows between construction barriers. A crowd has formed -- approximately 20 people crammed into a space meant for 4. No distancing. No order. Pure chaos.',
        ford: {
          text: 'Push through the crowd (fast, risky)',
          effect: () => {
            this.addExposure(20);
            if (this.chance(30)) {
              this.print('You weave through. Someone coughs directly');
              this.print('into the back of your neck. You feel your soul');
              this.print('leave your body temporarily.');
              this.damageAllParty(10);
              this.loseWillpower(10);
            } else {
              this.print('You hold your breath and power through.');
              this.print('Made it. You use sanitizer like it\'s holy water.');
              this.useSanitizer();
            }
          }
        },
        floatAround: {
          text: 'Weave through side streets (slower, safer)',
          effect: () => {
            this.advanceTime(12);
            this.addExposure(3);
            this.print('You take a detour through residential streets.');
            this.print('It\'s quiet. Too quiet. A dog barks at you.');
            this.print('You flinch. The dog judges you.');
          }
        },
        ferry: {
          text: 'Call a rideshare ($8, safe)',
          effect: () => {
            this.state.resources.cash -= 8;
            this.advanceTime(5);
            this.addExposure(5);
            this.drainBattery(5);
            this.print('You Uber three blocks. The driver has the');
            this.print('windows down and two air fresheners hanging');
            this.print('from the mirror. Safe-ish.');
          }
        },
        wait: {
          text: 'Wait for the crowd to thin (costs time)',
          effect: () => {
            this.advanceTime(15);
            this.losePatience(10);
            this.print('You stand and wait. The crowd thins eventually.');
            this.print('You\'ve been standing here so long a pigeon');
            this.print('has landed on your shoe.');
          }
        }
      },
      {
        title: 'CROWD CROSSING -- Farmer\'s Market',
        description: 'A farmer\'s market has materialized in the street. Hundreds of people browsing artisanal soap and $9 tomatoes. Your route goes directly through it. Mask compliance: approximately 60%.',
        ford: {
          text: 'Cut through the market (fast, high exposure)',
          effect: () => {
            this.addExposure(25);
            if (this.chance(40)) {
              this.print('A woman sampling cheese pulls her mask down');
              this.print('and sneezes onto a display of heirloom squash.');
              this.print('You were standing next to the squash.');
              this.damageAllParty(8);
              this.loseWillpower(10);
            } else {
              this.print('You navigate through clouds of essential oil');
              this.print('vapors. You emerge smelling like lavender');
              this.print('and regret.');
              this.useSanitizer();
            }
          }
        },
        floatAround: {
          text: 'Go around the entire market (detour)',
          effect: () => {
            this.advanceTime(15);
            this.print('You walk six blocks around the market.');
            this.print('On the plus side, you got your steps in.');
            this.print('You can still smell the kettle corn.');
            this.loseWillpower(5);
          }
        },
        ferry: {
          text: 'Buy something and cut through ($12)',
          effect: () => {
            this.state.resources.cash -= 12;
            this.addExposure(10);
            this.print('You buy a $12 jar of "small batch" honey.');
            this.print('Having a bag makes you look like you belong.');
            this.print('You cut through with confidence.');
            this.print('You now own fancy honey. Your partner will ask why.');
          }
        },
        wait: {
          text: 'Wait for the market to close',
          effect: () => {
            this.advanceTime(25);
            this.losePatience(15);
            this.print('You sit on a bench and watch people buy');
            this.print('$7 lemonade without masks on. You count');
            this.print(`mask violations. You counted ${Math.floor(Math.random() * 30) + 15}.`);
          }
        }
      },
      {
        title: 'CROWD CROSSING -- Anti-Mask Protest',
        description: 'A group of approximately 30 people are blocking the intersection, holding signs about "freedom" and "breathing rights." None are wearing masks. A man has a megaphone.',
        ford: {
          text: 'Walk directly through (brave/foolish)',
          effect: () => {
            this.addExposure(30);
            if (this.chance(50)) {
              this.print('"TAKE OFF YOUR MASK! BREATHE FREE!"');
              this.print('Someone thrusts a pamphlet at you.');
              this.print('You speed-walk through, eyes forward.');
              this.print('The pamphlet is about "plandemic." You recycle it.');
              this.damageAllParty(8);
              this.loseWillpower(15);
            } else {
              this.print('You power through. A woman yells "SHEEP!"');
              this.print('You keep walking. Your mask has never felt');
              this.print('more important or more isolating.');
              this.loseWillpower(12);
              this.damageAllParty(5);
            }
          }
        },
        floatAround: {
          text: 'Detour three blocks around',
          effect: () => {
            this.advanceTime(12);
            this.addExposure(2);
            this.print('You reroute. From a distance, you can still');
            this.print('hear the megaphone. Something about 5G towers.');
            this.print('You walk faster.');
          }
        },
        ferry: {
          text: 'Duck into a coffee shop until it passes ($6)',
          effect: () => {
            this.state.resources.cash -= 6;
            this.advanceTime(15);
            this.addExposure(5);
            this.print('You buy a $6 oat milk latte and sit by');
            this.print('the window. The barista rolls their eyes');
            this.print('at the protest. You share a moment of');
            this.print('masked solidarity. It\'s the closest thing');
            this.print('to human connection you\'ve felt in weeks.');
            this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 5);
          }
        },
        wait: {
          text: 'Wait. They\'ll get bored eventually.',
          effect: () => {
            this.advanceTime(20);
            this.losePatience(15);
            this.addExposure(5);
            this.print('You wait. They don\'t get bored. They get louder.');
            this.print('A counter-protester arrives. Things escalate.');
            this.print('You detour anyway, having wasted 20 minutes.');
          }
        }
      },
      {
        title: 'CROWD CROSSING -- School Pickup Gauntlet',
        description: 'A hybrid-schedule school just let out. Parents in SUVs triple-parked everywhere. Children scatter like startled birds. Crossing guards look shell-shocked. The intersection is total gridlock.',
        ford: {
          text: 'Weave through the chaos',
          effect: () => {
            this.addExposure(15);
            if (this.chance(35)) {
              this.print('A child runs directly into your path.');
              this.print('You swerve. The child\'s parent glares at YOU.');
              this.print('As if you summoned their child into the street.');
              this.losePatience(12);
              this.damagePartyMember(this.state.party[0], 5);
            } else {
              this.print('You dodge through a gap between two minivans.');
              this.print('A crossing guard nods at you with the weary');
              this.print('respect of one pandemic survivor to another.');
            }
          }
        },
        floatAround: {
          text: 'Go around the school zone (long detour)',
          effect: () => {
            this.advanceTime(18);
            this.print('You reroute around the entire school zone.');
            this.print('It adds nearly 20 minutes but your blood');
            this.print('pressure remains in the "alive" range.');
          }
        },
        ferry: {
          text: 'Wait in the coffee shop across the street ($5)',
          effect: () => {
            this.state.resources.cash -= 5;
            this.advanceTime(12);
            this.addExposure(4);
            this.print('Another coffee. Your third today. The barista');
            this.print('recognizes you from the other coffee shop.');
            this.print('"Rough day?" "It\'s 2020." "Say no more."');
          }
        },
        wait: {
          text: 'Wait for pickup to end',
          effect: () => {
            this.advanceTime(15);
            this.losePatience(12);
            this.print('Fifteen minutes. That\'s how long school pickup');
            this.print('takes. An eternity measured in idling engines');
            this.print('and honking horns.');
          }
        }
      }
    ];

    const crossing = this.random(crossings);
    this.print(`<span class="danger">=== ${crossing.title} ===</span>`);
    this.print('');
    this.print(crossing.description);
    this.print('');

    const options = [
      { key: '1', ...crossing.ford },
      { key: '2', ...crossing.floatAround },
      { key: '3', ...crossing.ferry },
      { key: '4', ...crossing.wait }
    ];

    options.forEach(opt => {
      this.addChoice(opt.key, opt.text, () => {
        this.clear();
        this.updateStatus();
        opt.effect();
        this.print('');
        this.updateStatus();
        this.addChoice('R', 'Continue to ' + this.errandName(nextErrand), () => {
          this.arriveAtErrand(nextErrand);
        });
      });
    });
  },

  // ─── TRAVEL EVENTS (expanded) ─────────────────────────

  travelEvent(nextErrand) {
    this.clear();
    this.updateStatus();

    const events = this.getTravelEvents();
    const event = this.random(events);

    this.print(`<span class="warning">${event.title}</span>`);
    this.print('');
    this.print(event.description);
    this.print('');

    event.choices.forEach((choice, i) => {
      this.addChoice((i + 1).toString(), choice.text, () => {
        this.clear();
        this.updateStatus();
        if (choice.result) this.print(choice.result);
        this.print('');
        choice.effect();
        this.updateStatus();

        this.addChoice('R', 'Continue to ' + this.errandName(nextErrand), () => {
          this.arriveAtErrand(nextErrand);
        });
      });
    });
  },

  getTravelEvents() {
    const transitOnly = this.state.transport === 'transit';
    const carOnly = this.state.transport === 'car';
    const bikeOnly = this.state.transport === 'bike';
    const hasKids = this.state.party.some(p => p.name.includes('Kid') && p.status !== 'dead');
    const hasSpouse = this.state.party.some(p => p.name === 'Spouse' && p.status !== 'dead');

    const events = [
      // ── ORIGINAL EVENTS ──
      {
        title: 'ROAD BLOCKED -- Outdoor Dining Expansion',
        description: 'The entire street is now a restaurant patio. Plastic barriers and heat lamps block all lanes. A waiter glares at you for existing near his tables.',
        choices: [
          {
            text: 'Detour (adds 10 minutes)',
            result: 'You weave through side streets. A one-way system that didn\'t exist last month confuses you.',
            effect: () => { this.advanceTime(10); }
          },
          {
            text: 'Pass through slowly, accepting the judgment',
            result: 'The waiter shakes his head. A diner looks up from their bottomless mimosa with pity.',
            effect: () => { this.advanceTime(5); this.loseWillpower(5); }
          }
        ]
      },
      {
        title: 'ENCOUNTER -- Person You Vaguely Know',
        description: 'Someone from your pre-COVID life is approaching on the sidewalk. You can\'t tell if they recognize you through the mask. The social calculus begins.',
        choices: [
          {
            text: 'Wave and keep moving',
            result: 'They wave back. Or they were swatting a fly. Either way, interaction complete. You\'ll analyze this for 20 minutes later.',
            effect: () => { this.advanceTime(2); }
          },
          {
            text: 'Stop and chat (from 6 feet)',
            result: '"So... how have you BEEN?" The conversation lasts 8 minutes and covers nothing. You both say "we should hang out" knowing you won\'t.',
            effect: () => { this.advanceTime(12); this.losePatience(5); this.addExposure(5); }
          },
          {
            text: 'Pretend to check your phone',
            result: 'You stare at your phone intensely. They walk past. Did they notice? Do they hate you now? Does it matter? Everything is different.',
            effect: () => { this.drainBattery(5); this.loseWillpower(3); }
          }
        ]
      },
      {
        title: 'SUPPLY CHECK -- Mask Situation',
        description: 'Your mask is getting damp from breathing. The ear loops are stretching. You\'re not sure if the one in your pocket is clean or the one you wore to the grocery store three days ago.',
        choices: [
          {
            text: 'Swap to the pocket mask (risky)',
            result: 'You sniff it cautiously. It smells like... pocket. Good enough. Probably.',
            effect: () => { this.addExposure(3); }
          },
          {
            text: 'Use a fresh mask from your supply',
            result: 'The crisp feeling of a new mask. The brief moment of easy breathing before it, too, becomes a damp face prison.',
            effect: () => { this.degradeMask(); }
          }
        ]
      },
      {
        title: 'CLOSED STOREFRONT',
        description: 'You pass another shuttered business. The sign still says "Closed temporarily - see you soon!" The sign is sun-bleached. It\'s been 7 months.',
        choices: [
          {
            text: 'Feel a pang of sadness, keep moving',
            result: 'You remember getting coffee there. The barista knew your order. You wonder where she is now.',
            effect: () => { this.loseWillpower(5); }
          },
          {
            text: 'Take a photo for some reason',
            result: 'You\'re not sure why. Documentation? Nostalgia? Your camera roll is increasingly bleak.',
            effect: () => { this.drainBattery(3); this.advanceTime(2); }
          }
        ]
      },
      {
        title: 'NOTIFICATION -- Screen Time Report',
        description: 'Your phone buzzes. Weekly screen time report: "Your screen time was up 47% last week." Average: 6 hours 23 minutes per day.',
        choices: [
          {
            text: 'Dismiss without reading',
            result: 'You swipe it away. The number lingers in your mind like a ghost.',
            effect: () => { this.loseWillpower(3); }
          },
          {
            text: 'Open it, spiral briefly',
            result: '"Most used: Twitter - 2h 14m daily." You close your phone with the energy of someone closing a casket.',
            effect: () => { this.drainBattery(5); this.loseWillpower(8); this.advanceTime(3); }
          }
        ]
      },

      // ── EQUIPMENT FAILURES ──
      {
        title: 'EQUIPMENT FAILURE -- Mask Ear Loop Snaps',
        description: 'POP. Your mask\'s ear loop just gave out. The mask dangles from one ear like a tiny surrender flag. You are exposed to the world.',
        choices: [
          {
            text: 'Deploy a backup mask',
            result: 'You waste a mask, but dignity is preserved. The broken one goes in your pocket where it will live for the next 6 months.',
            effect: () => {
              this.state.resources.masks = Math.max(0, this.state.resources.masks - 1);
              if (this.state.resources.masks <= 0) this.addExposure(15);
            }
          },
          {
            text: 'Tie the broken loop in a knot',
            result: 'You tie it. It works, barely. The mask sits at a 15-degree angle on your face. You look like a pandemic pirate.',
            effect: () => { this.advanceTime(3); this.addExposure(5); }
          },
          {
            text: 'Hold it to your face with your hand',
            result: 'You walk with one hand on your face for the next 10 minutes. You can\'t open doors. You can\'t check your phone. This is misery.',
            effect: () => { this.losePatience(10); this.advanceTime(5); }
          }
        ]
      },
      {
        title: 'EQUIPMENT FAILURE -- Sanitizer Leak',
        description: 'Your hand sanitizer has leaked inside your bag. Everything is sticky. Your phone case is coated. The receipt you needed is now a translucent gel wafer.',
        choices: [
          {
            text: 'Salvage what you can',
            result: 'You recover about half the sanitizer. Everything you own smells like a hospital for the rest of the day.',
            effect: () => {
              this.state.resources.sanitizer = Math.max(0, this.state.resources.sanitizer - 3);
              this.advanceTime(5);
            }
          },
          {
            text: 'Wipe everything down and move on',
            result: 'You use the leaked sanitizer to clean your phone, keys, and wallet. Efficient, in a chaotic sort of way.',
            effect: () => {
              this.state.resources.sanitizer = Math.max(0, this.state.resources.sanitizer - 2);
            }
          }
        ]
      },

      // ── THEFT / LOSS EVENTS ──
      {
        title: 'SUPPLY LOSS -- Bag Fumble',
        description: 'You\'re juggling your phone, keys, sanitizer, and shopping list. Something has to give. Physics makes the choice for you.',
        choices: [
          {
            text: 'Grab the phone (sacrifice the sanitizer)',
            result: 'Your sanitizer bounces off the curb and rolls into a storm drain. It\'s gone. Just... gone. You stare at the drain for a moment too long.',
            effect: () => {
              this.state.resources.sanitizer = Math.max(0, this.state.resources.sanitizer - 2);
            }
          },
          {
            text: 'Grab the sanitizer (risk the phone)',
            result: 'You save the sanitizer! Your phone hits the ground screen-first. The screen protector takes the hit. This time.',
            effect: () => { this.drainBattery(10); this.advanceTime(2); }
          },
          {
            text: 'Try to catch everything (ambitious)',
            result: '',
            effect: () => {
              if (this.chance(25)) {
                this.print('Against all odds, you juggle-catch everything.');
                this.print('A passing stranger slow-claps. Your finest');
                this.print('moment of 2020.');
              } else {
                this.print('You catch nothing. Everything scatters.');
                this.print('Keys under a car. Phone in a puddle.');
                this.print('5 minutes recovering your life from the sidewalk.');
                this.advanceTime(5);
                this.drainBattery(8);
                this.state.resources.sanitizer = Math.max(0, this.state.resources.sanitizer - 1);
                this.losePatience(8);
              }
            }
          }
        ]
      },
      {
        title: 'SUPPLY LOSS -- Toilet Paper Heist',
        description: 'You set your bag down for ONE SECOND to check your phone. When you look back, someone has taken your toilet paper out of the bag. In broad daylight. They\'re speed-walking away clutching YOUR Charmin.',
        choices: [
          {
            text: 'Chase them down',
            result: '',
            effect: () => {
              if (this.chance(40)) {
                this.print('"HEY! That\'s my toilet paper!"');
                this.print('They drop it and run. You pick it up.');
                this.print('You are a warrior. A pandemic warrior.');
                this.advanceTime(5);
              } else {
                this.print('They\'re too fast. The TP is gone.');
                this.print('You watch them disappear around a corner,');
                this.print('clutching your Charmin like a trophy.');
                this.state.resources.toiletPaper = Math.max(0, this.state.resources.toiletPaper - 2);
                this.loseWillpower(10);
              }
            }
          },
          {
            text: 'Let them have it. Pick your battles.',
            result: 'You watch them go. In 2020, toilet paper is currency. You just got mugged.',
            effect: () => {
              this.state.resources.toiletPaper = Math.max(0, this.state.resources.toiletPaper - 2);
              this.loseWillpower(8);
            }
          }
        ]
      },

      // ── POSITIVE EVENTS ──
      {
        title: 'MIRACLE -- Short Line',
        description: 'You walk past a store. No line. Empty entrance. A parking spot right in front. The employee waves pleasantly. Is this real? Am I dreaming?',
        choices: [
          {
            text: 'Accept this gift from the universe',
            result: 'You take a deep breath (through your mask). Not everything is terrible. Some things are fine. Today, this one thing is fine.',
            effect: () => {
              this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 10);
              this.state.resources.patience = Math.min(100, this.state.resources.patience + 5);
              this.getAliveParty().forEach(p => this.healPartyMember(p, 5));
            }
          }
        ]
      },
      {
        title: 'FOUND -- Masks On Sale',
        description: 'A convenience store has a hand-written sign: "MASKS - $2/pack - LIMIT 2". This is like finding water in the desert.',
        choices: [
          {
            text: 'Buy masks ($4)',
            result: '',
            effect: () => {
              if (this.state.resources.cash >= 4) {
                this.state.resources.cash -= 4;
                this.state.resources.masks += 10;
                this.advanceTime(3);
                this.print('You buy two packs. 10 masks. You feel');
                this.print('rich. You feel prepared. You feel like');
                this.print('maybe you\'ll survive this Saturday.');
              } else {
                this.print('You check your wallet. $' + this.state.resources.cash + '.');
                this.print('Not today. The masks stay on the shelf.');
                this.loseWillpower(5);
              }
            }
          },
          {
            text: 'Pass (you\'re fine on masks)',
            result: 'You walk past. Pride intact. ...You\'ll probably regret this.',
            effect: () => { }
          }
        ]
      },
      {
        title: 'KINDNESS -- Stranger Holds the Door',
        description: 'A stranger in the parking lot sees you struggling with bags, mask, phone, and keys. They hold the door from 8 feet away with their foot.',
        choices: [
          {
            text: '"Thank you so much"',
            result: '"No problem! We\'re all in this together." For once, it doesn\'t sound hollow. Your faith in humanity ticks up slightly.',
            effect: () => {
              this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 8);
              this.getAliveParty().forEach(p => this.healPartyMember(p, 3));
            }
          }
        ]
      },
      {
        title: 'FOUND -- $10 Bill',
        description: 'There\'s a $10 bill on the sidewalk. Crumpled, slightly damp, clearly dropped. You look around. Nobody is searching.',
        choices: [
          {
            text: 'Pick it up (use sanitizer after)',
            result: 'You pocket the bill and immediately sanitize. The thrill of found money in a pandemic is genuinely the highlight of your month.',
            effect: () => { this.state.resources.cash += 10; this.useSanitizer(); }
          },
          {
            text: 'Leave it. Who knows where it\'s been.',
            result: 'You walk past a perfectly good $10 bill because of germs. This is your life now.',
            effect: () => { this.loseWillpower(3); }
          }
        ]
      },

      // ── NPC RUMORS / INTEL ──
      {
        title: 'INTEL -- Overheard in Line',
        description: 'The person ahead of you is on the phone. You can\'t help but overhear...',
        choices: [
          {
            text: 'Eavesdrop (might be useful)',
            result: '',
            effect: () => {
              const rumors = [
                '"...yeah the Walgreens on 5th closed their pharmacy early today. Just don\'t even bother..."',
                '"...I heard Costco has toilet paper again but you have to go before 10..."',
                '"...the bank is doing walk-ins now, you don\'t need an appointment, the guard is just bored..."',
                '"...they rearranged the grocery store AGAIN. Nothing is where it was last week..."',
                '"...the hardware store has N95s at the register. They don\'t advertise it, just ask..."',
                '"...my cousin got tested and it took NINE DAYS for results. Nine. What is the point..."',
                '"...apparently you can use a bandana now? The CDC changed the guidance again..."'
              ];
              this.print(this.random(rumors));
              this.print('');
              this.print('Useful? Maybe. Accurate? Unknown.');
              this.advanceTime(3);
            }
          },
          {
            text: 'Mind your own business',
            result: 'You stare at your phone instead. You\'ll never know what intelligence you missed.',
            effect: () => { this.drainBattery(3); }
          }
        ]
      },
      {
        title: 'ENCOUNTER -- Conspiracy Theorist',
        description: 'A man on the corner is explaining to nobody in particular that COVID was created by [redacted] to [redacted] the [redacted]. He has a megaphone. It\'s 10 AM on a Saturday.',
        choices: [
          {
            text: 'Walk past, eyes forward',
            result: 'He shouts something about microchips. You keep walking. This is fine.',
            effect: () => { this.loseWillpower(5); this.addExposure(3); }
          },
          {
            text: 'Cross the street to avoid',
            result: 'You cross the street. From here, the megaphone is just background noise. Like everything else that doesn\'t make sense anymore.',
            effect: () => { this.advanceTime(2); }
          }
        ]
      }
    ];

    // ── CONDITIONAL EVENTS ──

    if (hasKids) {
      events.push({
        title: 'CHILD STATUS -- Meltdown Incoming',
        description: '"I\'m BORED." "I\'m HUNGRY." "I need to PEE." The small ones are deteriorating. You have been out for ' + (this.state.time.hour - 8) + ' hour(s).',
        choices: [
          {
            text: 'Promise a treat later (buy time)',
            result: '"If you\'re good for the next stop, we\'ll get a donut." You have purchased 20 minutes of peace with a future obligation.',
            effect: () => { this.advanceTime(2); this.state.resources.cash -= 5; }
          },
          {
            text: 'Hand them your phone',
            result: 'Silence. Beautiful silence. Your phone battery enters freefall.',
            effect: () => { this.drainBattery(20); }
          },
          {
            text: 'Lecture about patience (backfires)',
            result: '"When I was your age--" You hear yourself becoming your parents. The children do not care. Patience drops for everyone.',
            effect: () => { this.losePatience(15); this.advanceTime(5); }
          }
        ]
      });
      events.push({
        title: 'CHILD STATUS -- Mask Rebellion',
        description: 'Kid (5) has removed their mask for the 4th time. "It\'s ITCHY." "I can\'t BREATHE." "It smells like my FACE."',
        choices: [
          {
            text: 'Calmly re-mask the child',
            result: 'You kneel down, fix the mask, and say "I know, buddy." The mask lasts approximately 90 seconds before the next complaint.',
            effect: () => { this.losePatience(8); this.advanceTime(3); }
          },
          {
            text: 'Bribe with screen time',
            result: '"Keep your mask on, you can watch YouTube in the car." The mask stays on. You are a negotiation genius.',
            effect: () => { this.drainBattery(5); }
          },
          {
            text: 'Let them go maskless briefly (outside)',
            result: 'You let them breathe for a minute. An older woman shoots you a look that could curdle milk. You re-mask the child immediately.',
            effect: () => { this.addExposure(8); this.loseWillpower(8); }
          }
        ]
      });
    }

    if (hasSpouse) {
      events.push({
        title: 'SPOUSE STATUS -- "Helpful" Suggestion',
        description: 'Spouse looks at the route and says: "You know, if we had just gone to the pharmacy FIRST, we wouldn\'t be in this situation."',
        choices: [
          {
            text: '"You\'re right." (lie for peace)',
            result: 'Spouse nods, satisfied. You stare out the window and think about the ocean.',
            effect: () => { this.loseWillpower(5); }
          },
          {
            text: '"I planned the route carefully."',
            result: '"Did you though?" A silence descends. It will last 1.3 errands.',
            effect: () => { this.losePatience(8); this.loseWillpower(3); }
          },
          {
            text: '"You\'re welcome to drive next time."',
            result: 'Spouse makes a face you can\'t see behind their mask but can FEEL in your bones. The temperature in the car drops 4 degrees.',
            effect: () => { this.losePatience(10); this.loseWillpower(5); }
          }
        ]
      });
    }

    if (carOnly) {
      events.push({
        title: 'PARKING -- The Lot is Full',
        description: 'Capacity limits mean fewer people inside but more cars circling the lot like vultures. A spot opens. Someone else is closer.',
        choices: [
          {
            text: 'Circle the lot (burn time)',
            result: 'Three loops. Finally, a spot opens in the far corner, next to a cart return that no one uses.',
            effect: () => { this.advanceTime(8); }
          },
          {
            text: 'Park on the street two blocks away',
            result: 'The walk isn\'t bad. The parking meter only takes an app now. The app needs an update. The update needs WiFi.',
            effect: () => { this.advanceTime(5); this.drainBattery(8); this.losePatience(5); }
          }
        ]
      });
      events.push({
        title: 'EQUIPMENT FAILURE -- Car Won\'t Start',
        description: 'You turn the key. Click. Click. Click. The engine doesn\'t turn over. The battery is dead. Of course it is. You\'ve barely driven in 7 months.',
        choices: [
          {
            text: 'Try again. And again. And again.',
            result: '',
            effect: () => {
              if (this.chance(70)) {
                this.print('On the fifth try, the engine catches.');
                this.print('You whisper "please" and it rumbles to life.');
                this.print('You will not turn this car off again until');
                this.print('you are home.');
                this.advanceTime(8);
                this.losePatience(10);
              } else {
                this.print('Nothing. Dead. You call roadside assistance.');
                this.print('"Estimated wait: 45 minutes."');
                this.print('You sit in your dead car, scrolling your phone,');
                this.print('watching your Saturday evaporate.');
                this.advanceTime(40);
                this.drainBattery(15);
                this.losePatience(20);
                this.loseWillpower(15);
              }
            }
          },
          {
            text: 'Ask a stranger for a jump',
            result: '',
            effect: () => {
              this.addExposure(8);
              this.print('A man in a truck says "sure thing." He pulls');
              this.print('up. You both stand over the engine, masks on,');
              this.print('trying to remember which cable goes where.');
              this.print('Neither of you knows. You both pretend you do.');
              this.print('');
              this.print('It works. "Thanks, man." "No problem."');
              this.print('The most meaningful human interaction');
              this.print('you\'ve had in months.');
              this.advanceTime(12);
              this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 5);
            }
          }
        ]
      });
    }

    if (transitOnly) {
      events.push({
        title: 'BUS SITUATION',
        description: 'The bus arrives. Through the window you can see it\'s... not empty. The driver\'s mask is below his nose. A man in back is coughing.',
        choices: [
          {
            text: 'Board and stand near the door',
            result: 'You press against the door like you\'re trying to phase through it. Every stop you briefly taste fresh air like a prisoner.',
            effect: () => { this.loseWillpower(10); this.useSanitizer(); this.addExposure(15); }
          },
          {
            text: 'Wait for the next one (15 min)',
            result: 'The next bus is identical. There is no escape. You board anyway.',
            effect: () => { this.advanceTime(15); this.losePatience(10); this.addExposure(10); }
          }
        ]
      });
    }

    if (bikeOnly) {
      events.push({
        title: 'EQUIPMENT FAILURE -- Flat Tire',
        description: 'Psssssssss. Your rear tire is going flat. You ran over something. A nail? A shard of 2020\'s collective broken dreams?',
        choices: [
          {
            text: 'Patch it (if you have the kit)',
            result: 'You flip the bike, find the puncture, and patch it with shaking sanitizer-sticky hands. 12 minutes on the sidewalk like a bike mechanic of the apocalypse.',
            effect: () => { this.advanceTime(12); this.losePatience(8); }
          },
          {
            text: 'Walk the bike to the next stop',
            result: 'You push your bike like a shopping cart of shame. Every cyclist who passes gives you a knowing nod. The brotherhood of flats.',
            effect: () => { this.advanceTime(20); this.loseWillpower(8); }
          }
        ]
      });
    }

    return events;
  },

  // ─── BETWEEN ERRANDS MENU ─────────────────────────────

  betweenErrands() {
    const remaining = this.state.errandOrder.filter(
      e => !this.state.completedErrands.includes(e)
    );

    if (remaining.length === 0) {
      this.finalGauntlet();
      return;
    }

    if (this.isPlayerDead()) { this.gameOver('death'); return; }
    if (this.state.time.hour >= 18) { this.gameOver('time'); return; }
    if (this.state.resources.patience <= 0) { this.gameOver('patience'); return; }
    if (this.state.resources.willpower <= 0) { this.gameOver('willpower'); return; }
    if (this.state.resources.masks <= 0) { this.gameOver('masks'); return; }

    const newWeather = this.maybeChangeWeather();

    this.clear();
    this.updateStatus();

    this.print('<span class="highlight">=== TRAIL STATUS ===</span>');
    this.print('');

    if (newWeather) {
      const msgs = { clear: 'The sky clears up.', rainy: 'It starts raining.', hot: 'The heat is building.', windy: 'The wind is picking up.' };
      this.print(`<span class="warning">${msgs[newWeather]}</span>`);
      this.print('');
    }

    this.print('Party Status:');
    this.getAliveParty().forEach(p => {
      const filled = Math.ceil(p.health / 10);
      const bar = '\u2588'.repeat(filled) + '\u2591'.repeat(10 - filled);
      const tag = p.status !== 'healthy' ? ` [${p.status}]` : '';
      this.print(`  ${p.name}: ${bar} ${p.health}%${tag}`);
    });
    this.state.party.filter(p => p.status === 'dead').forEach(p => {
      this.print(`  <span class="danger">RIP ${p.name} -- ${p.causeOfDeath}</span>`);
    });
    this.print('');
    this.print(`<span class="dim">Pace: ${this.state.pace} | Distancing: ${this.state.distancing}</span>`);
    this.print('');

    const nextErrand = remaining[0];
    this.print(`Next: ${this.errandName(nextErrand)}`);
    this.print('');

    this.addChoice('1', 'Continue to ' + this.errandName(nextErrand), () => {
      const idx = this.state.errandOrder.indexOf(nextErrand);
      this.travelTo(idx);
    });
    this.addChoice('2', 'Adjust pace & distancing', () => this.adjustSettings());
    this.addChoice('3', 'Stop at convenience store (resupply)', () => this.convenienceStore());
    if (this.state.supplyHuntsToday < 3) {
      this.addChoice('4', 'Search for supplies (hunt)', () => this.supplyHunt());
    }
    this.addChoice('5', 'Rest briefly (heal party, costs time)', () => {
      this.clear();
      this.updateStatus();
      this.advanceTime(15);
      this.getAliveParty().forEach(p => this.healPartyMember(p, 10));
      this.state.resources.patience = Math.min(100, this.state.resources.patience + 5);
      this.print('You sit on a bench. You close your eyes.');
      this.print('For 15 minutes, you pretend it\'s 2019.');
      this.print('');
      this.print('The party feels slightly better.');
      this.print('');
      this.updateStatus();
      this.addChoice('R', 'Continue', () => this.betweenErrands());
    });
  },

  // ─── ADJUST SETTINGS ──────────────────────────────────

  adjustSettings() {
    this.clear();
    this.updateStatus();
    this.print('<span class="highlight">Adjust Your Approach</span>');
    this.print('');
    this.print(`Current pace: <span class="success">${this.state.pace}</span>`);
    this.print(`Current distancing: <span class="success">${this.state.distancing}</span>`);
    this.print('');
    this.print('<span class="dim">Pace affects travel time and patience drain:</span>');
    this.print('<span class="dim">  Careful -- slower travel, less patience drain</span>');
    this.print('<span class="dim">  Normal -- balanced</span>');
    this.print('<span class="dim">  Rushing -- faster, more patience drain, health cost</span>');
    this.print('');
    this.print('<span class="dim">Distancing affects exposure risk:</span>');
    this.print('<span class="dim">  Strict -- 50% exposure, slower in stores</span>');
    this.print('<span class="dim">  Moderate -- normal exposure</span>');
    this.print('<span class="dim">  YOLO -- 2x exposure, but fast</span>');
    this.print('');

    this.addChoice('1', 'Pace: Careful', () => { this.state.pace = 'careful'; this.adjustSettings(); });
    this.addChoice('2', 'Pace: Normal', () => { this.state.pace = 'normal'; this.adjustSettings(); });
    this.addChoice('3', 'Pace: Rushing', () => { this.state.pace = 'rushing'; this.adjustSettings(); });
    this.addChoice('4', 'Distancing: Strict', () => { this.state.distancing = 'strict'; this.adjustSettings(); });
    this.addChoice('5', 'Distancing: Moderate', () => { this.state.distancing = 'moderate'; this.adjustSettings(); });
    this.addChoice('6', 'Distancing: YOLO', () => { this.state.distancing = 'yolo'; this.adjustSettings(); });
    this.addChoice('B', 'Back', () => this.betweenErrands());
  },

  // ─── CONVENIENCE STORE (Fort Resupply) ─────────────────

  convenienceStore() {
    this.clear();
    this.updateStatus();
    this.advanceTime(8);
    this.addExposure(5);

    this.print('<span class="highlight">=== CONVENIENCE STORE ===</span>');
    this.print('');
    this.print('A 7-Eleven materializes like a desert oasis.');
    this.print('The fluorescent lights hum. The hot dogs rotate');
    this.print('endlessly, as they have since March. Nobody has');
    this.print('bought one. Nobody will. They persist.');
    this.print('');
    this.print('Pandemic prices apply. Everything costs more.');
    this.print(`Your cash: $${this.state.resources.cash}`);
    this.print('');

    const items = [
      { key: '1', name: 'Masks (3-pack)', cost: 8, effect: () => { this.state.resources.masks += 3; } },
      { key: '2', name: 'Hand sanitizer', cost: 5, effect: () => { this.state.resources.sanitizer += 3; } },
      { key: '3', name: 'Toilet paper (1 roll, limit 1)', cost: 4, effect: () => { this.state.resources.toiletPaper += 1; } },
      { key: '4', name: 'Phone charger cable (+30% battery)', cost: 12, effect: () => { this.state.resources.phoneBattery = Math.min(100, this.state.resources.phoneBattery + 30); } },
      { key: '5', name: 'Energy drink (+15 willpower)', cost: 3, effect: () => { this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 15); } },
      { key: '6', name: 'Snacks (+10 patience, heal party)', cost: 5, effect: () => {
        this.state.resources.patience = Math.min(100, this.state.resources.patience + 10);
        this.getAliveParty().forEach(p => this.healPartyMember(p, 8));
      }}
    ];

    items.forEach(item => {
      const can = this.state.resources.cash >= item.cost;
      this.addChoice(item.key, `${item.name} -- $${item.cost}${can ? '' : ' (can\'t afford)'}`, () => {
        if (this.state.resources.cash >= item.cost) {
          this.state.resources.cash -= item.cost;
          item.effect();
        }
        this.convenienceStore();
      });
    });

    this.addChoice('B', 'Leave the store', () => this.betweenErrands());
  },

  // ─── SUPPLY HUNT (Hunting Mini-Game) ───────────────────

  supplyHunt() {
    this.state.supplyHuntsToday++;
    this.clear();
    this.updateStatus();
    this.advanceTime(12);
    this.addExposure(8);

    this.print('<span class="highlight">=== SUPPLY HUNT ===</span>');
    this.print('');
    this.print('You duck into a store to search the shelves.');
    this.print('The aisles are picked clean like a post-apocalyptic');
    this.print('movie, except it\'s just a CVS in October 2020.');
    this.print('');

    const maxCarry = this.state.transport === 'bike' ? 1 : 2;
    let found = 0;

    if (this.chance(30) && found < maxCarry) {
      this.print('<span class="success">TOILET PAPER.</span> Two rolls. Behind the paper towels.');
      this.print('Hidden like buried treasure. You grab them with');
      this.print('the reverence of an archaeologist.');
      this.print('');
      this.state.resources.toiletPaper += 2;
      found++;
    }
    if (this.chance(40) && found < maxCarry) {
      this.print('<span class="success">HAND SANITIZER.</span> A bottle, dented and missing');
      this.print('its cap, but full. You take it.');
      this.print('');
      this.state.resources.sanitizer += 2;
      found++;
    }
    if (this.chance(25) && found < maxCarry) {
      this.print('<span class="success">N95 MASK.</span> Behind the reading glasses display.');
      this.print('A gift from the pandemic gods.');
      this.print('');
      this.state.resources.masks += 2;
      found++;
    }
    if (this.chance(20) && found < maxCarry) {
      this.print('<span class="success">CLOROX WIPES.</span> The holy grail. One canister,');
      this.print('full, untouched. You hold it like a newborn.');
      this.print('A woman eyes you from aisle 3. You walk faster.');
      this.print('');
      this.state.resources.sanitizer += 4;
      found++;
    }
    if (this.chance(15) && found < maxCarry) {
      this.print('<span class="success">$10 BILL</span> on the floor, under a shelf.');
      this.print('The most exciting thing since February.');
      this.print('');
      this.state.resources.cash += 10;
      found++;
    }

    if (found === 0) {
      this.print('<span class="danger">Nothing. The shelves are bare.</span>');
      this.print('');
      this.print('You walk out empty-handed. A sign reads:');
      this.print('"Limit 1 per customer" next to an empty shelf.');
      this.loseWillpower(5);
    } else {
      this.print(`Found ${found} item(s)!`);
      if (found >= maxCarry && this.state.transport === 'bike') {
        this.print('<span class="dim">Your bike panniers are full.</span>');
      }
    }
    this.print('');
    this.updateStatus();
    this.addChoice('R', 'Continue', () => this.betweenErrands());
  },

  // ─── ERRAND ENCOUNTERS ─────────────────────────────────

  arriveAtErrand(errand) {
    if (errand === 'postoffice' && this.state.time.hour >= 15) {
      this.errandClosed(errand); return;
    }
    if (errand === 'bank' && this.state.time.hour >= 16) {
      this.errandClosed(errand); return;
    }

    if (this.isPlayerDead()) { this.gameOver('death'); return; }
    if (this.state.time.hour >= 18) { this.gameOver('time'); return; }
    if (this.state.resources.patience <= 0) { this.gameOver('patience'); return; }
    if (this.state.resources.willpower <= 0) { this.gameOver('willpower'); return; }
    if (this.state.resources.masks <= 0) { this.gameOver('masks'); return; }

    this.clear();
    this.updateStatus();

    switch (errand) {
      case 'grocery': this.errandGrocery(); break;
      case 'pharmacy': this.errandPharmacy(); break;
      case 'postoffice': this.errandPostOffice(); break;
      case 'bank': this.errandBank(); break;
      case 'hardware': this.errandHardware(); break;
    }
  },

  errandClosed(errand) {
    this.clear();
    this.updateStatus();
    this.print('<span class="danger">CLOSED</span>');
    this.print('');
    this.print(`You arrive at the ${this.errandName(errand)}.`);
    this.print('The lights are off. A sign on the door reads:');
    this.print('');
    this.print('<span class="warning">"Reduced hours due to COVID-19."</span>');
    this.print('');
    this.print(`The ${this.errandName(errand)} has closed for the day.`);
    this.print('This errand will haunt your to-do list until next Saturday.');
    this.print('');

    this.loseWillpower(10);
    this.state.closedErrands.push(errand);
    this.state.completedErrands.push(errand);
    this.updateStatus();
    this.continueAfterErrand(false);
  },

  // ─── GROCERY STORE ─────────────────────────────────────

  errandGrocery() {
    this.addExposure(10);
    this.print('<span class="highlight">=== GROCERY STORE ===</span>');
    this.print('');
    this.print('You arrive at the grocery store.');
    if (this.state.time.hour >= 10 && this.state.time.hour <= 12) {
      this.print('<span class="warning">Peak hours. The parking lot is full.</span>');
      this.print('A line snakes out the front door.');
    } else {
      this.print('It\'s not too busy. Small mercies.');
    }
    this.print('');
    this.groceryCapacity();
  },

  groceryCapacity() {
    const busy = this.state.time.hour >= 10 && this.state.time.hour <= 12;
    if (busy) {
      this.print('A teenager with a click counter guards the door.');
      this.print('"We\'re at capacity. Shouldn\'t be long."');
      this.print('');
      this.addChoice('1', 'Wait in line (15 minutes)', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(15);
        this.losePatience(10);
        this.addExposure(8);
        this.print('You shuffle forward. A man behind you stands');
        this.print('uncomfortably close. You take a step forward.');
        this.print('He takes a step forward. The dance continues.');
        this.print('');
        this.print('Finally, you\'re waved in.');
        this.print('');
        this.updateStatus();
        this.groceryAisles();
      });
      this.addChoice('2', 'Come back later (skip for now)', () => {
        this.clear(); this.updateStatus();
        this.print('You\'ll circle back. Probably. Maybe.');
        this.print('');
        const idx = this.state.errandOrder.indexOf('grocery');
        this.state.errandOrder.splice(idx, 1);
        this.state.errandOrder.push('grocery');
        this.continueAfterErrand(false);
      });
    } else {
      this.groceryAisles();
    }
  },

  groceryAisles() {
    this.print('<span class="highlight">You\'re inside.</span>');
    this.print('');
    this.print('The store has been rearranged. Again.');
    this.print('One-way arrows on the floor. Plexiglass everywhere.');
    this.print('The bread aisle is now aisle 7. It used to be 3.');
    this.print('Nothing makes sense anymore.');
    this.print('');
    this.print('You find everything on your list except pasta sauce.');
    this.print('It\'s in aisle 2. You\'re in aisle 9. The arrows');
    this.print('only go one direction.');
    this.print('');

    this.addChoice('1', 'Follow the arrows back around (adds 10 minutes)', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(10);
      this.print('You walk the entire perimeter of the store.');
      this.print('Past the deli. Past frozen. Past dairy.');
      this.print('You arrive at aisle 2. The pasta sauce is there.');
      this.print('');
      this.print('<span class="dim">A small victory.</span>');
      this.print('');
      this.groceryCheckout();
    });
    this.addChoice('2', 'Go against the arrows (risk social judgment)', () => {
      this.clear(); this.updateStatus();
      if (this.chance(50)) {
        this.print('You dart against traffic. A woman gasps audibly.');
        this.print('"The arrows are there for a REASON," she hisses.');
        this.print('You grab the sauce and avoid eye contact.');
        this.loseWillpower(8);
        this.addExposure(5);
      } else {
        this.print('You slip against the arrows. Nobody notices.');
        this.print('Or everyone notices and nobody says anything.');
        this.print('The social contract is in shambles either way.');
        this.print('Sauce acquired.');
      }
      this.print('');
      this.advanceTime(3);
      this.updateStatus();
      this.groceryCheckout();
    });
    this.addChoice('3', 'Skip the sauce. It\'s not worth it.', () => {
      this.clear(); this.updateStatus();
      this.print('You abandon the sauce. At home you\'ll eat');
      this.print('plain pasta and tell yourself it\'s "minimalist."');
      this.print('');
      this.loseWillpower(3);
      this.updateStatus();
      this.groceryCheckout();
    });
  },

  groceryCheckout() {
    this.print('You approach checkout.');
    this.print('');

    if (this.chance(40)) {
      this.print('Self-checkout is open. You scan your items.');
      this.print('"UNEXPECTED ITEM IN BAGGING AREA."');
      this.print('');
      this.addChoice('1', 'Wave down the attendant', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(5);
        this.print('The attendant walks over slowly, badge-swipes,');
        this.print('and walks away without a word. A professional.');
        this.print('');
        this.print('<span class="success">* Grocery Store - COMPLETE</span>');
        this.print('');
        this.useSanitizer();
        this.completeErrand('grocery');
      });
      this.addChoice('2', 'Remove item, re-scan, pray', () => {
        this.clear(); this.updateStatus();
        if (this.chance(50)) {
          this.advanceTime(3);
          this.print('It works on the third try. You bag everything');
          this.print('with the speed of someone defusing a bomb.');
        } else {
          this.advanceTime(8);
          this.losePatience(10);
          this.print('"UNEXPECTED ITEM IN BAGGING AREA."');
          this.print('"UNEXPECTED ITEM IN BAGGING AREA."');
          this.print('"UNEXPECTED ITEM IN BAGGING AREA."');
          this.print('');
          this.print('The machine has won. You wait for the attendant.');
        }
        this.print('');
        this.print('<span class="success">* Grocery Store - COMPLETE</span>');
        this.print('');
        this.useSanitizer();
        this.completeErrand('grocery');
      });
    } else {
      this.print('Only two lanes are open. The cashier is behind');
      this.print('a plexiglass shield that makes communication');
      this.print('impossible. You\'re both just pointing at things.');
      this.print('');
      this.print('"DO YOU HAVE A REWARDS CARD?"');
      this.print('"WHAT?"');
      this.print('"REWARDS. CARD."');
      this.print('"OH. NO."');
      this.print('');
      this.advanceTime(12);
      this.losePatience(5);
      this.useSanitizer();
      this.print('<span class="success">* Grocery Store - COMPLETE</span>');
      this.print('');
      this.updateStatus();
      this.completeErrand('grocery');
    }
  },

  // ─── PHARMACY ──────────────────────────────────────────

  errandPharmacy() {
    this.addExposure(12);
    this.print('<span class="highlight">=== PHARMACY ===</span>');
    this.print('');
    this.print('You arrive at the pharmacy.');
    this.print('The line... is outside. It wraps around the corner.');
    this.print('You count. Fourteen people ahead of you.');
    this.print('');

    if (this.chance(40)) {
      this.print('<span class="warning">A sign on the door: "Pharmacist at lunch.</span>');
      this.print('<span class="warning">Back at... [smudged]"</span>');
      this.print('');
      this.addChoice('1', 'Wait anyway. You\'re already here.', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(25);
        this.losePatience(20);
        this.loseWillpower(10);
        this.addExposure(10);
        this.print('You wait. And wait. The pharmacist returns');
        this.print('eating a sandwich. No urgency. None.');
        this.print('The line begins to move. Slowly.');
        this.print('');
        this.pharmacyCounter();
      });
      this.addChoice('2', 'Leave and come back (risky - time cost)', () => {
        this.clear(); this.updateStatus();
        this.print('You\'ll come back. You make a mental note.');
        this.print('The mental note dissolves immediately.');
        this.print('');
        const idx = this.state.errandOrder.indexOf('pharmacy');
        this.state.errandOrder.splice(idx, 1);
        this.state.errandOrder.push('pharmacy');
        this.loseWillpower(5);
        this.updateStatus();
        this.continueAfterErrand(false);
      });
    } else {
      this.print('The line moves. Slowly. Six feet between each');
      this.print('person, so it looks longer than it is.');
      this.print('Or that\'s what you tell yourself.');
      this.print('');
      this.advanceTime(15);
      this.losePatience(10);
      this.addExposure(8);
      this.updateStatus();
      this.pharmacyCounter();
    }
  },

  pharmacyCounter() {
    this.print('You reach the counter.');
    this.print('');

    if (this.chance(35)) {
      this.print('"We... don\'t have that ready yet."');
      this.print('"But I called it in yesterday."');
      this.print('"Let me check... it\'ll be about 20 minutes."');
      this.print('');
      this.addChoice('1', 'Wait the 20 minutes', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(25);
        this.losePatience(15);
        this.print('It takes 28 minutes. You count the ceiling tiles.');
        this.print('There are 847. You browse the "As Seen On TV"');
        this.print('section. You almost buy a Snuggie.');
        this.print('');
        this.print('They call your name. You collect your prescription.');
        this.print('');
        this.print('<span class="success">* Pharmacy - COMPLETE</span>');
        this.print('');
        this.useSanitizer();
        this.updateStatus();
        this.completeErrand('pharmacy');
      });
      this.addChoice('2', 'Browse while waiting (spend money)', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(25);
        this.state.resources.cash -= 15;
        this.print('You buy hand sanitizer ($8), a candle ($6),');
        this.print('and something called "Immune Support Gummies"');
        this.print('that probably do nothing but the packaging');
        this.print('is reassuring.');
        this.print('');
        this.state.resources.sanitizer += 3;
        this.print('They call your name. Prescription acquired.');
        this.print('');
        this.print('<span class="success">* Pharmacy - COMPLETE</span>');
        this.print('');
        this.updateStatus();
        this.completeErrand('pharmacy');
      });
    } else {
      this.print('"Last name?"');
      this.print('You spell it. They can\'t hear through the mask');
      this.print('and the plexiglass. You spell it again. Louder.');
      this.print('The whole store hears your name now.');
      this.print('');
      this.print('"That\'ll be $45 with insurance."');
      this.print('');
      this.state.resources.cash -= 12;
      this.advanceTime(5);
      this.print('<span class="success">* Pharmacy - COMPLETE</span>');
      this.print('');
      this.useSanitizer();
      this.updateStatus();
      this.completeErrand('pharmacy');
    }
  },

  // ─── POST OFFICE ───────────────────────────────────────

  errandPostOffice() {
    this.addExposure(10);
    this.print('<span class="highlight">=== POST OFFICE ===</span>');
    this.print('');
    this.print('The Post Office. Federal territory.');
    this.print('Different rules. Different energy. Same dread.');
    this.print('');

    const timeLeft = 15 - this.state.time.hour;
    if (timeLeft <= 2) {
      this.print(`<span class="warning">They close in ${timeLeft} hour(s). The clock is ticking.</span>`);
      this.print('');
    }

    this.print('The line is outside. It goes around the building.');
    this.print('There is one (1) employee visible inside.');
    this.print('');
    this.postOfficeLine();
  },

  postOfficeLine() {
    this.print('A man is standing approximately 2 feet behind you.');
    this.print('His mask is around his chin. He\'s on speakerphone.');
    this.print('');

    this.addChoice('1', 'Say nothing. Suffer in silence.', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(20);
      this.losePatience(15);
      this.addExposure(12);
      this.print('You inch forward. The man follows. His phone call');
      this.print('is about a boat he\'s trying to sell. You know');
      this.print('everything about this boat now. It\'s a 2004 Bayliner.');
      this.print('He wants $12,000. It needs a new lower unit.');
      this.print('');
      this.postOfficeCounter();
    });
    this.addChoice('2', 'Politely ask for space', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(20);
      if (this.chance(50)) {
        this.print('"Hey, could you maybe stand back a bit--"');
        this.print('"Oh sure, sure, no problem."');
        this.print('He steps back 8 inches. His call continues.');
        this.losePatience(8);
        this.addExposure(8);
      } else {
        this.print('"Hey, could you--"');
        this.print('"It\'s OUTSIDE. We\'re OUTSIDE."');
        this.print('He gestures at the sky as if fresh air is');
        this.print('a magical COVID shield. You say nothing more.');
        this.losePatience(20);
        this.loseWillpower(10);
        this.addExposure(15);
      }
      this.print('');
      this.updateStatus();
      this.postOfficeCounter();
    });
    this.addChoice('3', 'Put in earbuds (passive aggressive)', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(20);
      this.drainBattery(8);
      this.addExposure(10);
      this.print('You put in your earbuds. You don\'t play anything.');
      this.print('You just stand there, "unavailable," while the');
      this.print('boat saga continues behind you.');
      this.print('');
      this.print('A small boundary. A tiny fortress.');
      this.print('');
      this.losePatience(5);
      this.updateStatus();
      this.postOfficeCounter();
    });
  },

  postOfficeCounter() {
    this.print('You reach the counter. The postal worker looks');
    this.print('tired. So tired. A plexiglass wall separates you.');
    this.print('');

    if (this.chance(40)) {
      this.print('"Do you have a customs form?"');
      this.print('"A what? I\'m mailing this within the state."');
      this.print('"Oh. Wrong line. You need window 2."');
      this.print('"There\'s only one window open."');
      this.print('"...Give me a moment."');
      this.print('');
      this.advanceTime(10);
      this.losePatience(10);
    }

    this.print('Your package is weighed, stamped, and accepted.');
    this.print('It feels like a miracle.');
    this.print('');
    this.print('<span class="success">* Post Office - COMPLETE</span>');
    this.print('');
    this.useSanitizer();
    this.updateStatus();
    this.completeErrand('postoffice');
  },

  // ─── BANK ──────────────────────────────────────────────

  errandBank() {
    this.addExposure(8);
    this.print('<span class="highlight">=== BANK ===</span>');
    this.print('');
    this.print('You haven\'t been inside a bank since March.');
    this.print('You\'re not sure the rules anymore.');
    this.print('There\'s a QR code on the door. A security guard.');
    this.print('An empty lobby that feels like a hospital.');
    this.print('');
    this.bankEntrance();
  },

  bankEntrance() {
    this.print('The security guard holds up a hand.');
    this.print('"Do you have an appointment?"');
    this.print('');

    this.addChoice('1', '"...No. I didn\'t know I needed one."', () => {
      this.clear(); this.updateStatus();
      if (this.chance(60)) {
        this.print('He sighs. "Scan the QR code to check in."');
        this.print('You scan it. It loads a form. The form asks');
        this.print('for your account number. You don\'t have it.');
        this.print('You check your email. You check your app.');
        this.print('');
        this.drainBattery(10);
        this.advanceTime(8);
        this.print('Found it. Form submitted. "Have a seat."');
        this.print('There are two chairs in a lobby meant for 30.');
        this.print('');
        this.updateStatus();
        this.bankWait();
      } else {
        this.print('"Appointments only today. You can schedule');
        this.print('one through our app or call the main line."');
        this.print('');
        this.print('<span class="danger">The app crashes. The phone line is 45 min hold.</span>');
        this.print('');
        this.addChoice('A', 'Try to charm your way in', () => {
          this.clear(); this.updateStatus();
          this.print('"I just need to deposit a check, it\'ll take');
          this.print('two minutes--"');
          this.print('');
          this.print('He looks at you. Looks at the empty lobby.');
          this.print('Looks back at you.');
          this.print('');
          this.print('"...Fine. Window 3."');
          this.print('');
          this.loseWillpower(5);
          this.updateStatus();
          this.bankCounter();
        });
        this.addChoice('B', 'Give up. Use the ATM outside.', () => {
          this.clear(); this.updateStatus();
          this.print('You use the ATM. It charges a $3 fee even');
          this.print('though it\'s YOUR bank. You can\'t deposit');
          this.print('the check here. The check will live in your');
          this.print('wallet for another month.');
          this.print('');
          this.state.resources.cash -= 3;
          this.advanceTime(5);
          this.loseWillpower(8);
          this.print('<span class="warning">* Bank - PARTIALLY COMPLETE</span>');
          this.print('<span class="dim">(check still in wallet)</span>');
          this.print('');
          this.updateStatus();
          this.completeErrand('bank');
        });
      }
    });
    this.addChoice('2', '"Yes." (lie confidently)', () => {
      this.clear(); this.updateStatus();
      if (this.chance(40)) {
        this.print('"Name?"');
        this.print('You give your name. He checks a tablet.');
        this.print('"...I don\'t see you on here."');
        this.print('"Maybe it\'s under my middle name?"');
        this.print('');
        this.print('He stares. You stare back. The mask hides');
        this.print('your expression, which is the only advantage');
        this.print('of this entire pandemic.');
        this.print('');
        this.print('"...Just go to window 3."');
        this.print('');
        this.loseWillpower(5);
        this.updateStatus();
        this.bankCounter();
      } else {
        this.print('"Name?"');
        this.print('You give your name. He checks the list.');
        this.print('"Go ahead."');
        this.print('');
        this.print('The lie worked. You feel powerful and guilty.');
        this.print('');
        this.bankCounter();
      }
    });
  },

  bankWait() {
    this.advanceTime(12);
    this.losePatience(8);
    this.print('You sit. Muzak plays. The clock on the wall');
    this.print('might be broken. Twelve minutes pass like an hour.');
    this.print('');
    this.print('"They\'re ready for you at window 3."');
    this.print('');
    this.updateStatus();
    this.bankCounter();
  },

  bankCounter() {
    this.print('The teller is behind plexiglass, wearing a mask,');
    this.print('a face shield, AND gloves. They slide a tray');
    this.print('under the partition. Very prison-visit energy.');
    this.print('');
    this.print('"How can I help you today?"');
    this.print('"I need to deposit a check and--"');
    this.print('"WHAT?"');
    this.print('"DEPOSIT. A CHECK."');
    this.print('"Oh! Slide it through."');
    this.print('');
    this.advanceTime(10);
    this.print('The transaction takes 10 minutes for something');
    this.print('that should take 2. But it\'s done. It\'s done.');
    this.print('');
    this.print('<span class="success">* Bank - COMPLETE</span>');
    this.print('');
    this.useSanitizer();
    this.updateStatus();
    this.completeErrand('bank');
  },

  // ─── HARDWARE STORE ────────────────────────────────────

  errandHardware() {
    this.addExposure(3);
    this.print('<span class="highlight">=== HARDWARE STORE ===</span>');
    this.print('');
    this.print('You arrive at the hardware store.');
    this.print('');
    this.print('It\'s... fine.');
    this.print('');
    this.print('The parking lot isn\'t full. There\'s no line.');
    this.print('You walk in. Nobody stops you. The aisles');
    this.print('are wide. The employees are helpful. A man');
    this.print('in an orange apron asks if you need anything.');
    this.print('');
    this.print('You almost cry.');
    this.print('');

    this.addChoice('1', 'Get what you need and leave (quick)', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(12);
      this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 10);
      this.getAliveParty().forEach(p => this.healPartyMember(p, 10));
      this.print('You find the light bulbs, the WD-40, and the');
      this.print('picture hooks. Everything is where it should be.');
      this.print('The cashier says "have a good one" and sounds');
      this.print('like they mean it.');
      this.print('');
      this.print('You sit in your car for a moment, overwhelmed');
      this.print('by how easy that was.');
      this.print('');
      this.print('<span class="success">* Hardware Store - COMPLETE</span>');
      this.print('');
      this.updateStatus();
      this.completeErrand('hardware');
    });
    this.addChoice('2', 'Wander the aisles (decompress)', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(25);
      this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 20);
      this.state.resources.patience = Math.min(100, this.state.resources.patience + 10);
      this.state.resources.cash -= 8;
      this.getAliveParty().forEach(p => this.healPartyMember(p, 20));
      this.print('You wander. Past the power tools. Past garden.');
      this.print('Past the inexplicable aisle of just... rope.');
      this.print('');
      this.print('You buy a thing you don\'t need. A level, maybe.');
      this.print('Or a set of clamps. It doesn\'t matter.');
      this.print('For 25 minutes, the world felt normal.');
      this.print('');
      this.print('This is the rest stop. The oasis. The one place');
      this.print('where 2020 hasn\'t fully taken root.');
      this.print('');
      this.print('<span class="success">* Hardware Store - COMPLETE</span>');
      this.print('');
      this.updateStatus();
      this.completeErrand('hardware');
    });
  },

  // ─── ERRAND COMPLETION / PROGRESSION ───────────────────

  completeErrand(errand) {
    this.state.completedErrands.push(errand);
    this.degradeMask();

    const healthEvent = this.checkPartyHealth();
    if (healthEvent) {
      this.print('');
      this.addChoice('R', 'Continue...', () => {
        this.showHealthEvent(healthEvent, () => this.betweenErrands());
      });
    } else {
      this.continueAfterErrand(true);
    }
  },

  continueAfterErrand(completed) {
    const remaining = this.state.errandOrder.filter(
      e => !this.state.completedErrands.includes(e)
    );

    if (remaining.length === 0) {
      this.addChoice('R', 'Head home', () => this.finalGauntlet());
      return;
    }

    if (this.isPlayerDead()) { this.addChoice('R', '...', () => this.gameOver('death')); return; }
    if (this.state.time.hour >= 18) { this.addChoice('R', '...', () => this.gameOver('time')); return; }
    if (this.state.resources.patience <= 0) { this.addChoice('R', '...', () => this.gameOver('patience')); return; }
    if (this.state.resources.willpower <= 0) { this.addChoice('R', '...', () => this.gameOver('willpower')); return; }
    if (this.state.resources.masks <= 0) { this.addChoice('R', '...', () => this.gameOver('masks')); return; }

    this.addChoice('R', 'Continue...', () => this.betweenErrands());
  },

  // ─── FINAL GAUNTLET ────────────────────────────────────

  finalGauntlet() {
    this.clear();
    this.updateStatus();

    this.print('<span class="highlight">=== THE HOME STRETCH ===</span>');
    this.print('');
    this.print('All errands are done. Home beckons.');
    this.print('But the journey isn\'t over yet.');
    this.print('');

    if (this.state.transport === 'car') {
      this.print('Your gas light is on. It\'s been on for two errands.');
      this.print('Home is 15 minutes away. The nearest gas station');
      this.print('is right here.');
      this.print('');

      this.addChoice('1', 'Stop for gas (safe but more time)', () => {
        this.clear(); this.updateStatus();
        this.advanceTime(8);
        this.state.resources.cash -= 5;
        this.addExposure(5);
        this.print('You pump gas. The nozzle is sticky. You use');
        this.print('sanitizer three times. The receipt printer');
        this.print('is broken. It\'s always broken.');
        this.print('');
        this.updateStatus();
        this.finalChoice();
      });
      this.addChoice('2', 'Risk it. You\'ll make it. Probably.', () => {
        this.clear(); this.updateStatus();
        if (this.chance(20)) {
          this.print('The car sputters. Coughs. Dies.');
          this.print('You coast to the shoulder.');
          this.print('');
          this.advanceTime(25);
          this.losePatience(15);
          this.loseWillpower(10);
          this.state.resources.cash -= 18;
          this.print('You walk to the gas station. Buy a gas can.');
          this.print('Walk back. Fill the car. Drive to the station.');
          this.print('Fill it properly. $18 and 25 minutes later,');
          this.print('you\'re back on the road. Humbled.');
          this.print('');
        } else {
          this.print('The needle is below E. The car is running on');
          this.print('fumes and spite. But it moves.');
          this.print('');
        }
        this.updateStatus();
        this.finalChoice();
      });
    } else {
      this.finalChoice();
    }
  },

  finalChoice() {
    this.print('You pass a Starbucks. The drive-through line');
    this.print('has 11 cars in it. You deserve a treat.');
    this.print('But also: you just want to be HOME.');
    this.print('');

    this.addChoice('1', 'Starbucks. You\'ve earned it.', () => {
      this.clear(); this.updateStatus();
      this.advanceTime(18);
      this.state.resources.cash -= 7;
      this.addExposure(3);
      this.state.resources.willpower = Math.min(100, this.state.resources.willpower + 10);
      this.getAliveParty().forEach(p => this.healPartyMember(p, 5));
      this.print('You wait. You order a complicated drink because');
      this.print('you\'re worth it. The barista spells your name wrong');
      this.print('on the cup. It\'s always wrong. But the drink is warm');
      this.print('and sweet and for a moment -- just a moment -- things');
      this.print('feel almost normal.');
      this.print('');

      const healthEvent = this.checkPartyHealth();
      if (healthEvent) {
        this.showHealthEvent(healthEvent, () => this.gameWin());
      } else {
        this.addChoice('R', 'Head home at last', () => this.gameWin());
      }
    });
    this.addChoice('2', 'No. Home. Now.', () => {
      this.clear(); this.updateStatus();
      this.print('You drive past. The Starbucks shrinks in the');
      this.print('mirror. You feel nothing. You are beyond temptation.');
      this.print('You are a machine built for errands and errands alone.');
      this.print('');
      this.addChoice('R', 'Pull into the driveway', () => this.gameWin());
    });
  },

  // ─── GAME OVER ─────────────────────────────────────────

  gameOver(reason) {
    this.clear();
    this.updateStatus();

    const reasons = {
      death: {
        title: this.state.party[0].causeOfDeath
          ? `YOU ${this.state.party[0].causeOfDeath.toUpperCase()}`
          : 'YOU HAVE DIED OF COVID',
        body: [
          '',
          'Your errand run ends here, in a parking lot,',
          'between a Walgreens and a closed Pier 1 Imports.',
          '',
          'You completed ' + this.state.completedErrands.length + ' of 5 errands.',
          'The rest die with you.',
          '',
          'Your family will find the grocery list in your pocket.',
          'They will never get that pasta sauce.'
        ]
      },
      time: {
        title: 'THE STORES HAVE CLOSED',
        body: [
          'It\'s 6 PM. The city is shutting down.',
          '"Reduced hours due to COVID-19."',
          '',
          'You completed ' + this.state.completedErrands.length + ' of 5 errands.',
          'The rest will haunt your to-do list.',
          'You\'ll try again next Saturday.',
          'You said that last Saturday too.'
        ]
      },
      patience: {
        title: 'PATIENCE DEPLETED',
        body: [
          'You\'re done. You cannot stand in one more line.',
          'You cannot spell your name through one more',
          'plexiglass barrier. You cannot.',
          '',
          'You completed ' + this.state.completedErrands.length + ' of 5 errands.',
          'You drive home in silence, gripping the wheel,',
          'wondering if you can just... never go outside again.',
          'Everything delivers now. Right? Right.'
        ]
      },
      willpower: {
        title: 'WILLPOWER EXHAUSTED',
        body: [
          'You sit in your car. The engine is running.',
          'You could go to the next stop. You could.',
          '',
          'But you don\'t.',
          '',
          'You completed ' + this.state.completedErrands.length + ' of 5 errands.',
          'You go home. You order DoorDash. You watch',
          'four episodes of something you won\'t remember.',
          'The to-do list remains.'
        ]
      },
      masks: {
        title: 'OUT OF MASKS',
        body: [
          'Your last mask just snapped an ear loop.',
          'You could go in without one, but... no.',
          'You\'re not that person.',
          '',
          'You completed ' + this.state.completedErrands.length + ' of 5 errands.',
          'You go home. You order masks online.',
          '"Delivery: 3-5 business days."',
          'The errands will wait. Again.'
        ]
      }
    };

    const r = reasons[reason];
    this.print(`<span class="danger">${this.separator()}</span>`);
    this.print(`<span class="danger">  ${r.title}</span>`);
    this.print(`<span class="danger">${this.separator()}</span>`);
    this.printLines(r.body);
    this.print('');

    const dead = this.state.party.filter(p => p.status === 'dead');
    if (dead.length > 0) {
      this.print('<span class="danger">--- CASUALTIES ---</span>');
      dead.forEach(p => {
        this.print(`  <span class="danger">${p.name} ${p.causeOfDeath}.</span>`);
      });
      this.print('');
    }

    this.showTombstone();
    this.print('');

    this.addChoice('R', 'Try again next Saturday', () => this.init());
  },

  // ─── GAME WIN ──────────────────────────────────────────

  gameWin() {
    this.clear();
    this.updateStatus();

    this.print(`<span class="success">${this.separator()}</span>`);
    this.print('<span class="success">ALL ERRANDS COMPLETE</span>');
    this.print(`<span class="success">${this.separator()}</span>`);
    this.print('');
    this.print('You did it. Five errands. One day.');
    this.print('');
    this.print(`Time: ${this.formatTime()}`);
    this.print(`Masks remaining: ${this.state.resources.masks}`);
    this.print(`Patience remaining: ${this.state.resources.patience}%`);
    this.print(`Willpower remaining: ${this.state.resources.willpower}%`);
    this.print(`Cash remaining: $${this.state.resources.cash}`);
    this.print(`Toilet paper: ${this.state.resources.toiletPaper} rolls`);
    this.print('');

    const alive = this.getAliveParty();
    const dead = this.state.party.filter(p => p.status === 'dead');
    this.print(`Party survived: ${alive.length}/${this.state.party.length}`);
    alive.forEach(p => {
      this.print(`  <span class="success">${p.name} -- ${p.health}% health</span>`);
    });
    if (dead.length > 0) {
      this.print('');
      this.print('Lost along the way:');
      dead.forEach(p => {
        this.print(`  <span class="danger">${p.name} ${p.causeOfDeath}.</span>`);
      });
    }
    if (this.state.closedErrands.length > 0) {
      this.print('');
      this.print(`<span class="warning">Closed before you got there: ${this.state.closedErrands.map(e => this.errandName(e)).join(', ')}</span>`);
    }
    this.print('');

    this.print('You pull into your driveway. Turn off the engine.');
    this.print('Sit for a moment in silence.');
    this.print('');
    this.print('You used to do this every week without thinking.');
    this.print('Now it feels like you summited Everest.');
    this.print('');
    this.print('You wash your hands for 20 seconds.');
    this.print('You wipe down the groceries. Probably unnecessary.');
    this.print('You do it anyway.');
    this.print('');
    this.print('Congratulations. You survived The Errand Run.');
    this.print('');

    const score = this.calculateScore();
    this.print(`<span class="highlight">SCORE: ${score} points</span>`);
    this.print(`<span class="dim">(${this.state.occupationName} multiplier: x${this.state.scoreMultiplier})</span>`);
    this.print('');
    this.printLines(this.getScoreComment(score));
    this.print('');

    this.addChoice('R', 'Play again', () => this.init());
  },

  calculateScore() {
    let score = 50;
    score += this.state.resources.patience * 0.2;
    score += this.state.resources.willpower * 0.1;
    score += this.state.resources.masks * 2;
    score += this.state.resources.toiletPaper * 3;
    score -= (this.state.time.hour - 8) * 2;
    if (this.state.transport === 'transit') score += 10;
    if (this.state.party.length >= 3) score += 5;

    const alive = this.getAliveParty();
    score += alive.length * 10;
    score -= (this.state.party.length - alive.length) * 15;
    alive.forEach(p => { score += p.health * 0.1; });
    score -= this.state.closedErrands.length * 10;

    score = Math.round(score * this.state.scoreMultiplier);
    return Math.max(0, score);
  },

  getScoreComment(score) {
    if (score >= 200) return [
      '<span class="success">LEGENDARY RUN.</span>',
      'You are a pandemic errand savant.',
      'They should study you. The CDC should',
      'have you on speed dial.'
    ];
    if (score >= 150) return [
      '<span class="success">Outstanding performance.</span>',
      'You navigated the apocalypse like a pro.',
      'Your grandchildren will hear of this day.'
    ];
    if (score >= 100) return [
      '<span class="success">Solid performance.</span>',
      'You got everything done with energy to spare.',
      'Treat yourself. You\'ve earned that DoorDash.'
    ];
    if (score >= 70) return [
      '<span class="warning">You survived. Barely.</span>',
      'Everything got done but at what cost?',
      'Your patience is a smoldering ruin.'
    ];
    if (score >= 40) return [
      '<span class="danger">Pyrrhic victory.</span>',
      'Yes, the errands are done. But you are',
      'a hollow shell. Was it worth it?',
      '(It was. The alternative was going next week.)'
    ];
    return [
      '<span class="danger">Survival is a strong word.</span>',
      'You finished. Bodies and masks litter',
      'the trail behind you. The errands are done',
      'but nothing will ever be the same.'
    ];
  },

  showTombstone() {
    const tombstones = [
      'Here lies my Saturday.\n"I\'ll just run a few quick errands."',
      'RIP my patience.\nDied in line at the post office.\nThe man with the boat killed it.',
      'Here lies my will to leave the house.\n2020 took you too soon.',
      'In memory of productivity.\nLast seen: February 2020.',
      'Here lies my sanity.\n"We\'re all in this together."\n(We were not together.\nWe were 6 feet apart.)',
      'RIP the before times.\nWhen you could just... go places.\nWithout a plan. Without a mask.\nWithout dread.',
      '"I\'ll do it next week."\n- Me, every week since March',
      'Here lies my faith in humanity.\nCause of death: the man who\ncoughed without a mask\nat the farmer\'s market.',
      'RIP my 2020 goals.\nDied: March 15, 2020.\n"This year is MY year."',
      'Here lies my social skills.\nLast used: February 2020.\n"We should get together sometime."'
    ];

    const stone = this.random(tombstones);
    const maxW = window.innerWidth < 600 ? 22 : 33;
    const lines = [];
    stone.split('\n').forEach(line => {
      while (line.length > maxW) {
        let i = line.lastIndexOf(' ', maxW);
        if (i <= 0) i = maxW;
        lines.push(line.slice(0, i));
        line = line.slice(i).trimStart();
      }
      lines.push(line);
    });
    const boxW = Math.max(maxW, 5) + 4;
    const border = '+' + '-'.repeat(boxW - 2) + '+';
    const empty = '|' + ' '.repeat(boxW - 2) + '|';
    const ripPad = Math.floor((boxW - 7) / 2);
    const ripLine = '|' + ' '.repeat(ripPad) + '+===+' + ' '.repeat(boxW - 7 - ripPad) + '|';
    const ripText = '|' + ' '.repeat(ripPad) + '|RIP|' + ' '.repeat(boxW - 7 - ripPad) + '|';
    this.print(`<span class="dim">${border}</span>`);
    lines.forEach(l => {
      const padded = l.padEnd(boxW - 4);
      this.print(`<span class="dim">| ${padded} |</span>`);
    });
    this.print(`<span class="dim">${empty}</span>`);
    this.print(`<span class="dim">${ripLine}</span>`);
    this.print(`<span class="dim">${ripText}</span>`);
    this.print(`<span class="dim">${ripLine}</span>`);
    this.print(`<span class="dim">${border}</span>`);
  }
};

// ─── START ───────────────────────────────────────────────

function startGame() {
  if (!document.getElementById('narrative') || !document.getElementById('choices') || !document.getElementById('status-bar')) {
    setTimeout(startGame, 50);
    return;
  }
  Game.narrative = document.getElementById('narrative');
  Game.choices = document.getElementById('choices');
  Game.statusBar = document.getElementById('status-bar');
  Game.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}

// Keyboard support
document.addEventListener('keydown', (e) => {
  const buttons = document.querySelectorAll('#choices button');
  const key = e.key.toUpperCase();

  if (key >= '1' && key <= '9') {
    const idx = parseInt(key) - 1;
    if (buttons[idx]) buttons[idx].click();
    return;
  }

  buttons.forEach((btn) => {
    const btnText = btn.textContent;
    if (btnText.includes(`[${key}]`) || (key === 'ENTER' && btnText.includes('[ENTER]')) ||
        (key === 'ARROWRIGHT' && btnText.includes('[->]'))) {
      btn.click();
    }
  });
});
