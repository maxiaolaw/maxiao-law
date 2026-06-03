/* ── 诗名 · Poetic Name Finder ── */

(function () {
  'use strict';

  // ── Phoneme map: English sound clusters → Mandarin pinyin patterns ──
  const PHONEME_MAP = [
    // Initials first (longer matches take priority)
    { en: /^sh/i,  py: ['sh', 'x'] },
    { en: /^ch/i,  py: ['ch', 'zh', 'q'] },
    { en: /^ph/i,  py: ['f', 'b'] },
    { en: /^th/i,  py: ['s', 'd', 't'] },
    { en: /^wh/i,  py: ['w', 'h'] },
    { en: /^zh/i,  py: ['zh', 'j'] },
    { en: /^qu/i,  py: ['q', 'k'] },
    { en: /^[ck]/i,py: ['k', 'q', 'g'] },
    { en: /^g/i,   py: ['g', 'j'] },
    { en: /^j/i,   py: ['j', 'zh', 'q'] },
    { en: /^x/i,   py: ['x', 'j', 's'] },
    { en: /^z/i,   py: ['z', 'zh', 'j'] },
    { en: /^[aeiou]/i, py: ['y', 'w', ''] },
    { en: /^b/i,   py: ['b', 'p'] },
    { en: /^p/i,   py: ['p', 'b'] },
    { en: /^d/i,   py: ['d', 't'] },
    { en: /^t/i,   py: ['t', 'd'] },
    { en: /^f/i,   py: ['f'] },
    { en: /^h/i,   py: ['h'] },
    { en: /^l/i,   py: ['l'] },
    { en: /^m/i,   py: ['m'] },
    { en: /^n/i,   py: ['n'] },
    { en: /^r/i,   py: ['r', 'l'] },
    { en: /^[sv]/i,py: ['s', 'x'] },
    { en: /^w/i,   py: ['w'] },
    { en: /^y/i,   py: ['y', 'j'] },
  ];

  // Vowel nucleus → finals
  const VOWEL_MAP = [
    { en: /ee|ea|ie|i$/i,  py: ['i', 'ī', 'í'] },
    { en: /ay|ai|a$/i,     py: ['ai', 'a', 'an'] },
    { en: /oh|ow|o$/i,     py: ['o', 'ou', 'ong'] },
    { en: /oo|ue|u$/i,     py: ['u', 'ū', 'un'] },
    { en: /or|aw|a[lr]/i,  py: ['ao', 'ang', 'an'] },
    { en: /er|ir|ur/i,     py: ['er', 'en'] },
    { en: /in|ing/i,       py: ['in', 'ing', 'i'] },
    { en: /an|en|on/i,     py: ['an', 'en', 'ang'] },
    { en: /[aeiou]/i,      py: ['a', 'e', 'i'] },
  ];

  // ── Syllabify a name loosely ──
  function syllabify(name) {
    // Very simple: split on consonant clusters following a vowel
    const lower = name.toLowerCase().replace(/[^a-z]/g, '');
    const matches = lower.match(/[^aeiou]*[aeiou]+(?:[^aeiou]*(?=$|[aeiou]))?/g) || [lower];
    return matches.slice(0, 2); // max 2 syllables (2-char name)
  }

  // ── Mandarin syllable initials (longest first, so "sh"/"zh"/"ch" win) ──
  const INITIALS = ['zh','ch','sh','b','p','m','f','d','t','n','l','g','k','h',
                    'j','q','x','r','z','c','s','y','w'];

  function plainPinyin(py) {
    return py.replace(/[āáǎàīíǐìūúǔùēéěèōóǒò]/g, c =>
      'āáǎà'.includes(c) ? 'a' : 'īíǐì'.includes(c) ? 'i' :
      'ūúǔù'.includes(c) ? 'u' : 'ēéěè'.includes(c) ? 'e' : 'o');
  }

  function pinyinInitial(py) {
    const p = plainPinyin(py);
    for (const ini of INITIALS) if (p.startsWith(ini)) return ini;
    return '';   // zero-initial (a/e/o/...)
  }

  // Leading consonant cluster (or first vowel) of the English name
  function leadingSound(name) {
    const lower = name.toLowerCase().replace(/[^a-z]/g, '');
    const cons = lower.match(/^[^aeiou]+/);
    if (cons) return cons[0];          // "th", "sh", "br", "s"…
    const vow = lower.match(/^[aeiou]+/);
    return vow ? vow[0] : lower.slice(0, 1);
  }

  function initialCandidatesFor(fragment) {
    for (const rule of PHONEME_MAP) if (rule.en.test(fragment)) return rule.py;
    return [''];
  }
  function finalCandidatesFor(fragment) {
    for (const rule of VOWEL_MAP) if (rule.en.test(fragment)) return rule.py;
    return ['a', 'e', 'i'];
  }

  // ── Score an entry: initial match dominates, then final echo, then theme ──
  function scoreEntry(entry, initials, finals, themeFilter, themeWeight) {
    const py = plainPinyin(entry.pinyin);
    const ini = pinyinInitial(entry.pinyin);
    let score = 0;
    const initialHit = initials.includes(ini);
    if (initialHit) score += 10;                       // sound of the first letter
    if (ini === initials[0]) score += 4;               // prefer the closest equivalent
    for (const fin of finals) if (py.includes(fin)) { score += 3; break; }
    if (themeFilter && entry.theme_tags.includes(themeFilter)) {
      score += (themeWeight == null ? 2 : themeWeight);
    }
    return { score, initialHit };
  }

  // ── Guess gender from the English name (lists + ending heuristic) ──
  const MALE_NAMES = new Set(('james john robert michael william david richard joseph thomas charles ' +
    'christopher daniel matthew anthony donald mark paul steven andrew kenneth george joshua kevin ' +
    'brian edward ronald timothy jason jeffrey ryan jacob gary nicholas eric jonathan stephen larry ' +
    'justin scott brandon benjamin samuel gregory frank alexander raymond patrick jack dennis jerry ' +
    'tyler aaron jose henry adam douglas nathan peter zachary kyle walter harold jeremy ethan carl ' +
    'keith roger gerald christian terry sean arthur austin noah lawrence jesse joe bryan billy jordan ' +
    'albert dylan bruce willie gabriel alan juan logan wayne ralph roy eugene randy vincent russell ' +
    'louis philip bobby johnny bradley liam mason lucas oscar leo max theodore felix victor martin ' +
    'tom tony nick sam alex luke marcus elijah owen caleb miles oliver harry simon').split(/\s+/));
  const FEMALE_NAMES = new Set(('mary patricia jennifer linda elizabeth barbara susan jessica sarah ' +
    'karen nancy lisa margaret betty sandra ashley dorothy kimberly emily donna michelle carol amanda ' +
    'melissa deborah stephanie rebecca laura sharon cynthia kathleen amy angela shirley anna brenda ' +
    'pamela emma nicole helen samantha katherine christine debra rachel carolyn janet maria catherine ' +
    'heather diane olivia julie joyce victoria ruth virginia lauren kelly christina joan evelyn judith ' +
    'megan andrea cheryl hannah jacqueline martha gloria teresa ann sara madison frances kathryn janice ' +
    'jean abigail alice julia judy sophia grace denise amber doris marilyn danielle beverly isabella ' +
    'theresa diana natalie brittany charlotte marie kayla alexis lori bella fiona elena nina lucy chloe ' +
    'ella mia zoe sophie amelia ivy lily rose daisy claire eva aria nora').split(/\s+/));

  function guessGender(name) {
    const n = name.toLowerCase().replace(/[^a-z]/g, '');
    if (!n) return null;
    if (FEMALE_NAMES.has(n)) return 'f';
    if (MALE_NAMES.has(n)) return 'm';
    // Heuristic fallback for names not in the lists
    if (/(a|ia|ie|ee|ey|ette|elle|ina|een|lyn|wyn)$/.test(n)) return 'f';
    if (/(o|us|er|on|en|an|in|am| as|us|k|d|t|r|n)$/.test(n)) return 'm';
    return null; // unknown → no gender bias
  }

  // ── Build a combined meaning gloss ──
  function buildGloss(chars) {
    const meanings = chars.map(c => c.meaning_en.split(',')[0].trim());
    if (meanings.length === 1) return `"${meanings[0]}"`;
    return `"${meanings[0]} and ${meanings[1]}"`;
  }

  // ── Generate a name ──
  // Char 1 echoes the English name's first SOUND (+ gentle "feeling" flavor).
  // Char 2 is driven by the theme — "what draws you".
  // Both are filtered toward the name's likely gender.
  function generateName(englishName, theme, feeling, db, previousNames = []) {
    const syllables = syllabify(englishName);
    const used = new Set(previousNames.flat().map(n => n.hanzi));
    const want = guessGender(englishName);   // 'm' | 'f' | null
    const selectedChars = [];
    let echo = null;

    function refineGender(pool) {
      if (!want) return pool;
      const ok = pool.filter(s => s.entry.gender === 'n' || s.entry.gender === want);
      return ok.length ? ok : pool;          // never empty the pool
    }
    function pickFrom(pool) {
      const top = pool[0].score;
      let tier = pool.filter(s => s.score >= top - 2);
      if (tier.length > 6) tier = tier.slice(0, 6);
      return tier[Math.floor(Math.random() * tier.length)].entry;
    }

    // ── Char 1: first-letter sound (primary), feeling as a light flavor ──
    {
      const initials = initialCandidatesFor(leadingSound(englishName));
      const finals   = finalCandidatesFor(syllables[0] || englishName);
      const scored = db.filter(e => !used.has(e.hanzi))
        .map(e => {
          const s = scoreEntry(e, initials, finals, feeling, 2);
          if (want && e.gender === want) s.score += 1;   // gentle gender nudge
          return { entry: e, ...s };
        })
        .sort((a, b) => b.score - a.score);

      const primary = scored.filter(s =>
        s.initialHit && pinyinInitial(s.entry.pinyin) === initials[0]);
      let pool = primary.length ? primary : scored.filter(s => s.initialHit);
      if (pool.length === 0) pool = scored.filter(s => s.score > 0);
      if (pool.length === 0) pool = scored;
      pool = refineGender(pool);

      const pick = pickFrom(pool);
      selectedChars.push(pick);
      used.add(pick.hanzi);

      const lead = leadingSound(englishName);
      echo = {
        letter: lead.charAt(0).toUpperCase() + lead.slice(1),
        hanzi: pick.hanzi,
        pinyin: formatPinyin(pick),
        matched: initials.includes(pinyinInitial(pick.pinyin)),
      };
    }

    // ── Char 2: tied to the theme — "what draws you" ──
    {
      const frag = syllables[1] || syllables[0] || englishName.toLowerCase();
      const initials = initialCandidatesFor(frag);
      const finals   = finalCandidatesFor(frag);
      const scored = db.filter(e => !used.has(e.hanzi))
        .map(e => {
          const s = scoreEntry(e, initials, finals, theme, 12);
          if (want && e.gender === want) s.score += 1;   // gentle gender nudge
          return { entry: e, ...s };
        })
        .sort((a, b) => b.score - a.score);

      let pool;
      if (theme) {
        const themed = scored.filter(s => s.entry.theme_tags.includes(theme));
        pool = themed.length ? themed : scored.filter(s => s.score > 0);
      } else {
        pool = scored.filter(s => s.score > 0);
      }
      if (pool.length === 0) pool = scored;
      pool = refineGender(pool);

      const pick = pickFrom(pool);
      selectedChars.push(pick);
      used.add(pick.hanzi);
    }

    if (selectedChars.length === 0) return null;

    return {
      chars: selectedChars,
      gloss: buildGloss(selectedChars),
      displayName: selectedChars.map(c => c.hanzi).join(''),
      echo,
    };
  }

  // ── Tone marks ──
  const TONE_MARKS = {
    a: ['ā','á','ǎ','à'], e: ['ē','é','ě','è'],
    i: ['ī','í','ǐ','ì'], o: ['ō','ó','ǒ','ò'],
    u: ['ū','ú','ǔ','ù'],
  };
  function addToneMark(pinyin, tone) {
    // Find last vowel and mark it
    for (let i = pinyin.length - 1; i >= 0; i--) {
      const c = pinyin[i];
      if (TONE_MARKS[c]) {
        return pinyin.slice(0, i) + TONE_MARKS[c][tone - 1] + pinyin.slice(i + 1);
      }
    }
    return pinyin;
  }
  function formatPinyin(entry) {
    return addToneMark(entry.pinyin.replace(/[āáǎàīíǐìūúǔùēéěèōóǒò]/g, c => {
      if ('āáǎà'.includes(c)) return 'a';
      if ('īíǐì'.includes(c)) return 'i';
      if ('ūúǔù'.includes(c)) return 'u';
      if ('ēéěè'.includes(c)) return 'e';
      if ('ōóǒò'.includes(c)) return 'o';
      return c;
    }), entry.tone);
  }

  // ── Rain ripple canvas (rain falling on the page surface) ──
  function initRain() {
    const canvas = document.getElementById('rain-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    const ripples = [];

    // Respect reduced-motion preference
    const reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    // Spawn a raindrop ripple at a random point
    function spawn(x, y) {
      const px = x != null ? x : Math.random() * W;
      const py = y != null ? y : Math.random() * H;
      ripples.push({
        x: px,
        y: py,
        r: 1,
        maxR: 22 + Math.random() * 46,
        life: 0,
        maxLife: 70 + Math.random() * 50,
        // squash the ring so it reads as a surface seen at an angle
        squash: 0.34 + Math.random() * 0.12,
        width: 1 + Math.random() * 1.2,
      });
    }

    // Rain density: a few drops per frame
    let dropTimer = 0;
    function maybeRain() {
      dropTimer += 1;
      const interval = 7; // frames between drops (lower = heavier rain)
      if (dropTimer >= interval) {
        dropTimer = 0;
        const burst = 1 + (Math.random() < 0.4 ? 1 : 0);
        for (let i = 0; i < burst; i++) spawn();
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);

      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.life += 1;
        const t = rp.life / rp.maxLife;
        if (t >= 1) { ripples.splice(i, 1); continue; }

        // Ease the radius outward, fade the opacity
        const ease = 1 - Math.pow(1 - t, 2);
        rp.r = 1 + ease * rp.maxR;
        const fade = (1 - t);

        const cx = rp.x, cy = rp.y;
        const rx = rp.r, ry = rp.r * rp.squash;

        // Outer ripple ring — light crest
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(250, 245, 232, ${0.42 * fade})`;
        ctx.lineWidth = rp.width;
        ctx.stroke();

        // Inner shadow ring — gives depth (trough)
        if (rp.r > 6) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx * 0.72, ry * 0.72, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(40, 30, 18, ${0.18 * fade})`;
          ctx.lineWidth = rp.width * 0.8;
          ctx.stroke();
        }

        // Faint second crest for a layered look
        if (rp.r > 14) {
          ctx.beginPath();
          ctx.ellipse(cx, cy, rx * 0.45, ry * 0.45, 0, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(250, 245, 232, ${0.20 * fade})`;
          ctx.lineWidth = rp.width * 0.7;
          ctx.stroke();
        }
      }

      if (!reduceMotion) maybeRain();
      requestAnimationFrame(draw);
    }

    if (reduceMotion) {
      // A few static ripples, no continuous rain
      for (let i = 0; i < 5; i++) spawn();
    }
    draw();

    // A ripple follows the cursor occasionally (playful touch)
    let moveThrottle = 0;
    window.addEventListener('pointermove', e => {
      moveThrottle += 1;
      if (moveThrottle % 6 === 0) spawn(e.clientX, e.clientY);
    });
  }

  // ── TTS ──
  function hasChinese() {
    if (!window.speechSynthesis) return false;
    const voices = window.speechSynthesis.getVoices();
    return voices.some(v => v.lang.startsWith('zh'));
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'zh-CN';
    utter.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const zh = voices.find(v => v.lang.startsWith('zh-CN')) ||
               voices.find(v => v.lang.startsWith('zh'));
    if (zh) utter.voice = zh;
    window.speechSynthesis.speak(utter);
    return utter;
  }

  // ── UI state ──
  let db = [];
  let currentResult = null;
  let previousNames = [];
  let currentEnglishName = '';
  let speakBtn, resultPanel;

  async function loadDB() {
    const res = await fetch('poetry-db.json');
    db = await res.json();
  }

  function getSelections(groupClass) {
    const selected = document.querySelectorAll(`.${groupClass} .pill.selected`);
    if (selected.length === 0) return null;
    return selected[0].dataset.value;
  }

  function showInkTransition(cb) {
    const overlay = document.getElementById('ink-overlay');
    overlay.innerHTML = '<div class="ink-blob"></div>';
    overlay.classList.add('active');
    setTimeout(() => {
      overlay.classList.remove('active');
      overlay.innerHTML = '';
      if (cb) cb();
    }, 900);
  }

  function showResult(result) {
    currentResult = result;
    resultPanel = document.getElementById('result-panel');

    // Populate chars
    const nameRow = document.getElementById('result-name-row');
    nameRow.innerHTML = '';
    result.chars.forEach((ch, i) => {
      const div = document.createElement('div');
      div.className = 'result-char';
      div.innerHTML = `
        <span class="char-hanzi">${ch.hanzi}</span>
        <span class="char-pinyin">${formatPinyin(ch)}</span>
        <span class="char-meaning">${ch.meaning_en.split(',')[0].trim()}</span>
      `;
      nameRow.appendChild(div);
      setTimeout(() => div.classList.add('revealed'), 100 + i * 280);
    });

    // Gloss
    const gloss = document.getElementById('result-gloss');
    gloss.textContent = result.gloss;
    setTimeout(() => gloss.classList.add('revealed'), 700);

    // Phonetic echo — how the name relates to the English name's sound
    const echoEl = document.getElementById('result-echo');
    if (result.echo && result.echo.matched) {
      const e = result.echo;
      echoEl.innerHTML =
        `<span class="echo-hanzi">${e.hanzi}</span> ` +
        `<span class="echo-pinyin">${e.pinyin}</span> ` +
        `echoes the &ldquo;<span class="echo-letter">${e.letter}</span>&rdquo; ` +
        `in <span class="echo-name">${currentEnglishName || 'your name'}</span>`;
      echoEl.style.display = '';
    } else {
      echoEl.innerHTML = '';
      echoEl.style.display = 'none';
    }
    setTimeout(() => echoEl.classList.add('revealed'), 800);

    // Sources
    const sources = document.getElementById('result-sources');
    sources.innerHTML = '';
    result.chars.forEach(ch => {
      const block = document.createElement('div');
      block.className = 'source-block';
      const dates = ch.poet_dates ? `, ${ch.poet_dates}` : '';
      block.innerHTML = `
        <div class="source-line">${ch.line}</div>
        <div class="source-line-en">${ch.line_en || ''}</div>
        <div class="source-attr">
          <span class="source-title">《${ch.poem_title}》${ch.title_en ? ' · ' + ch.title_en : ''}</span>
          <span class="source-poet">${ch.poet}${ch.poet_en ? ' (' + ch.poet_en + dates + ')' : ''} · ${ch.dynasty}</span>
        </div>
      `;
      sources.appendChild(block);
    });
    setTimeout(() => sources.classList.add('revealed'), 950);

    // Speak button
    speakBtn = document.getElementById('btn-speak');
    const ttsWrap = document.getElementById('tts-wrap');
    // Load voices (may need async on some browsers)
    const checkVoices = () => {
      if (hasChinese()) {
        ttsWrap.innerHTML = `
          <button class="btn-speak" id="btn-speak">
            <span class="speak-icon">♪</span> 朗读 · Read aloud
          </button>`;
        document.getElementById('btn-speak').addEventListener('click', onSpeak);
      } else {
        ttsWrap.innerHTML = '<p class="no-tts">Read-aloud not available in this browser</p>';
      }
    };
    if (window.speechSynthesis && window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = checkVoices;
    } else {
      checkVoices();
    }

    // Actions
    setTimeout(() => {
      document.getElementById('result-actions').classList.add('revealed');
    }, 1150);

    resultPanel.classList.add('visible');
    document.body.classList.add('result-open');
  }

  function onSpeak() {
    if (!currentResult) return;
    const btn = document.getElementById('btn-speak');
    if (!btn) return;
    btn.classList.add('speaking');
    const full = currentResult.displayName;
    const chars = currentResult.chars.map(c => c.hanzi);

    // Speak full name, then each char
    const fullUtter = speak(full);
    if (fullUtter) {
      fullUtter.onend = () => {
        chars.forEach((c, i) => {
          setTimeout(() => {
            const u = speak(c);
            if (u && i === chars.length - 1) {
              u.onend = () => btn && btn.classList.remove('speaking');
            }
          }, i * 800);
        });
      };
    } else {
      btn.classList.remove('speaking');
    }
  }

  function onAnother() {
    if (!currentResult) return;
    previousNames.push(currentResult.chars);
    // Reset reveal classes
    document.querySelectorAll('.result-char').forEach(el => el.classList.remove('revealed'));
    document.getElementById('result-gloss').classList.remove('revealed');
    document.getElementById('result-echo').classList.remove('revealed');
    document.getElementById('result-sources').classList.remove('revealed');
    document.getElementById('result-actions').classList.remove('revealed');

    setTimeout(() => {
      const englishName = document.getElementById('name-input').value.trim();
      currentEnglishName = englishName;
      const theme  = getSelections('pref-theme');
      const feeling = getSelections('pref-feeling');
      const result = generateName(englishName, theme, feeling, db, previousNames);
      if (result) showResult(result);
    }, 200);
  }

  function onCopy() {
    if (!currentResult) return;
    const btn = document.getElementById('btn-copy');
    const chars = currentResult.chars;
    const lines = [
      `诗名: ${currentResult.displayName}`,
      `Pinyin: ${chars.map(c => formatPinyin(c)).join(' ')}`,
      `Meaning: ${currentResult.gloss}`,
      '',
      ...chars.map(c => {
        const dates = c.poet_dates ? `, ${c.poet_dates}` : '';
        const titleEn = c.title_en ? ` — ${c.title_en}` : '';
        const poetEn = c.poet_en ? ` (${c.poet_en}${dates})` : '';
        return [
          `《${c.poem_title}》${titleEn} · ${c.poet}${poetEn} · ${c.dynasty}`,
          c.line,
          c.line_en || '',
        ].join('\n');
      }),
    ];
    navigator.clipboard.writeText(lines.join('\n')).then(() => {
      btn.textContent = '✓ Copied';
      btn.classList.add('copied');
      setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('copied'); }, 2000);
    });
  }

  function onBack() {
    const panel = document.getElementById('result-panel');
    panel.classList.remove('visible');
    document.body.classList.remove('result-open');
    previousNames = [];
    currentResult = null;
  }

  async function onGenerate() {
    const input = document.getElementById('name-input').value.trim();
    if (!input) { document.getElementById('name-input').focus(); return; }
    if (!db.length) await loadDB();

    currentEnglishName = input;
    const theme   = getSelections('pref-theme');
    const feeling = getSelections('pref-feeling');
    previousNames = [];

    const result = generateName(input, theme, feeling, db, []);
    if (!result) return;

    showInkTransition(() => showResult(result));
  }

  // ── Background music toggle ──
  function initMusic() {
    const audio = document.getElementById('bg-music');
    const btn = document.getElementById('music-toggle');
    if (!audio || !btn) return;

    audio.volume = 0.0; // fade in from silence

    function fadeTo(target, done) {
      const step = (target - audio.volume) / 20;
      let i = 0;
      const id = setInterval(() => {
        i++;
        audio.volume = Math.min(1, Math.max(0, audio.volume + step));
        if (i >= 20) { clearInterval(id); audio.volume = target; if (done) done(); }
      }, 40);
    }

    btn.addEventListener('click', () => {
      if (audio.paused) {
        audio.play().then(() => {
          btn.classList.add('playing');
          btn.setAttribute('aria-label', 'Pause background music');
          fadeTo(0.55);
        }).catch(() => {
          // Autoplay/codec issue — surface nothing intrusive
          btn.classList.remove('playing');
        });
      } else {
        fadeTo(0, () => {
          audio.pause();
          btn.classList.remove('playing');
          btn.setAttribute('aria-label', 'Play background music');
        });
      }
    });
  }

  // ── Boot ──
  document.addEventListener('DOMContentLoaded', () => {
    loadDB();
    initRain();
    initMusic();

    // Pill toggles
    document.querySelectorAll('.pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const group = pill.closest('.pref-group');
        group.querySelectorAll('.pill').forEach(p => p.classList.remove('selected'));
        pill.classList.add('selected');
      });
    });

    // Generate
    const genBtn = document.getElementById('btn-generate');
    genBtn.addEventListener('click', onGenerate);

    document.getElementById('name-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') onGenerate();
    });

    // Result actions
    document.getElementById('btn-another').addEventListener('click', onAnother);
    document.getElementById('btn-copy').addEventListener('click', onCopy);
    document.getElementById('btn-back').addEventListener('click', onBack);
  });
})();
