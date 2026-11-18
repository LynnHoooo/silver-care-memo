/* 岁岁念 · 卡片式银发温情备忘录 —— 纯前端逻辑（无后端，数据全部存于 localStorage） */
(() => {
  'use strict';

  const STORE_KEY = 'suisuinian.memo.v1';
  const ENERGY_PER_CHECKIN = 100;
  const ENERGY_PER_MESSAGE = 60;

  const TEXT_SIZES = { normal: '标准', large: '大', xlarge: '特大' };

  /* ============ 配置 ============ */

  const CATS = {
    medicine: {
      name: '按时吃药', icon: 'ic-medicine', className: 'card-medicine',
      fields: [
        { key: 'heading', label: '药名', placeholder: '例如：氨氯地平 5 毫克' },
        { key: 'line2', label: '剂量与叮嘱', placeholder: '例如：每次 1 片，早饭后半小时温水送服' },
        { key: 'line3', label: '提醒时间', placeholder: '例如：每天 08:00' },
      ],
      rowLabels: { line2: '剂量与叮嘱', line3: '提醒时间' },
      templates: [
        { heading: '降压药 氨氯地平', line2: '每次 1 片 · 早饭后半小时', line3: '每天 08:00' },
        { heading: '钙片 + 维生素D', line2: '每次 1 片 · 晚饭后', line3: '每天 19:00' },
        { heading: '胰岛素', line2: '早中晚各 6 单位 · 打后马上吃饭', line3: '三餐前 10 分钟' },
      ],
      praise: [
        '太棒啦！您已完成今日吃药小任务，健康守护值加 100 分，亲情小树又长大了一点点！',
        '做得好！按时吃药是最了不起的坚持，孩子们看到打卡，心里特别踏实！',
      ],
    },
    phone: {
      name: '亲友电话', icon: 'ic-phone', className: 'card-phone',
      fields: [
        { key: 'heading', label: '亲友称呼', placeholder: '例如：女儿 · 小满' },
        { key: 'phone', label: '电话号码', placeholder: '例如：138 0000 1234' },
        { key: 'line2', label: '最方便的时间', placeholder: '例如：晚上 7 点到 9 点' },
      ],
      rowLabels: { phone: '号码', line2: '方便时间' },
      templates: [
        { heading: '女儿 · 小满', phone: '138 0000 1234', line2: '晚 7 点到 9 点' },
        { heading: '儿子 · 小川', phone: '139 0000 5678', line2: '午休 12 点到 1 点' },
        { heading: '老姐妹 · 王阿姨', phone: '137 0000 4321', line2: '上午随便打' },
      ],
      praise: [
        '真好！和孩子们通上话，比吃什么补品都管用，亲情能量加 100 分！',
        '说得开心吧？您这一通电话，全家都安心了，亲情小树又长高了一截！',
      ],
    },
    travel: {
      name: '出行提醒', icon: 'ic-travel', className: 'card-travel',
      fields: [
        { key: 'heading', label: '去哪儿', placeholder: '例如：社区医院 · 复查血压' },
        { key: 'line3', label: '出发时间', placeholder: '例如：明天上午 9:30' },
        { key: 'line2', label: '要带的东西', placeholder: '例如：医保卡、病历本、老花镜' },
      ],
      rowLabels: { line3: '出发时间', line2: '随身带' },
      templates: [
        { heading: '社区医院 · 复查血压', line3: '明天上午 9:30', line2: '医保卡、病历本、老花镜' },
        { heading: '人民公园 · 晨练', line3: '早上 7:00', line2: '水杯、毛巾、雨伞' },
        { heading: '惠民超市 · 买菜', line3: '今天下午 4:00', line2: '购物袋、老年卡、手机' },
      ],
      praise: [
        '一路平安！您出门前准备得妥妥当当，健康守护值加 100 分！',
        '真利索！按时出门、带齐东西，这份认真让儿女最放心，亲情小树又长大啦！',
      ],
    },
    message: {
      name: '给孩子的留言', icon: 'ic-message', className: 'card-message',
      fields: [
        { key: 'heading', label: '留言卡标题', placeholder: '例如：想对孩子说点什么' },
      ],
      rowLabels: {},
      templates: [{ heading: '想对孩子说点什么' }],
      praise: [
        '话已送到！孩子读到您的留言，心里暖暖的，亲情能量加 100 分！',
        '报平安啦！您这一句「我很好」，就是家里最好的消息！',
      ],
    },
  };

  const QUICK_PHRASES = [
    '今天按时吃药啦，别惦记',
    '天气转凉，你们注意保暖',
    '周末想听听你们的声音',
    '我很好，放心，别太累',
    '今天下楼走了两千步，腿脚有劲',
    '给你们留了柿子，记得回来拿',
  ];

  const STAGES = [
    { at: 0, icon: 'ic-sprout', label: '小嫩芽' },
    { at: 300, icon: 'ic-bud', label: '含苞待放' },
    { at: 800, icon: 'ic-blossom', label: '繁花盛开' },
    { at: 1600, icon: 'ic-fruit', label: '硕果累累' },
  ];

  /* 紧急求助信息：子女填一次，长辈侧大字展示并可朗读 */
  const EMG_FIELDS = [
    { key: 'contact', label: '紧急联系人', placeholder: '例如：女儿 · 林小满' },
    { key: 'phone', label: '联系电话', placeholder: '例如：138 0000 1234', tel: true },
    { key: 'address', label: '家庭住址', placeholder: '例如：阳光社区 3 号楼 502 室' },
    { key: 'blood', label: '血型', placeholder: '例如：A 型' },
    { key: 'meds', label: '正在服用的药', placeholder: '例如：降压药 氨氯地平 5 毫克' },
    { key: 'history', label: '过敏与既往情况', placeholder: '例如：青霉素过敏 · 高血压 8 年' },
  ];

  const seedEmergency = () => ({
    contact: '女儿 · 林小满',
    phone: '138 0000 1234',
    address: '阳光社区 3 号楼 502 室',
    blood: 'A 型',
    meds: '降压药 氨氯地平 5 毫克 · 钙片 + 维生素D',
    history: '青霉素过敏 · 高血压 8 年',
  });

  const MEDALS = [
    { emoji: '🌟', name: '坚持打卡新星', need: s => s.tasks >= 1, hint: '完成第 1 次打卡' },
    { emoji: '💪', name: '生活有节奏达人', need: s => s.tasks >= 3, hint: '累计完成 3 次打卡' },
    { emoji: '🏅', name: '全年按时吃药满贯王', need: s => s.byType.medicine >= 5, hint: '累计完成 5 次吃药打卡' },
    { emoji: '💖', name: '最佳暖心牵挂子女', need: s => s.childSetups >= 3, hint: '子女累计设置 3 条提醒' },
    { emoji: '🌸', name: '亲情花园金牌园丁', need: s => s.energy >= 800, hint: '亲情能量攒到 800 点' },
    { emoji: '📞', name: '亲情连线之星', need: s => s.byType.phone >= 3, hint: '累计完成 3 次亲友通话' },
    { emoji: '💌', name: '报平安小能手', need: s => s.messages >= 3, hint: '发送 3 条暖心留言' },
    { emoji: '🚌', name: '出行安全小达人', need: s => s.byType.travel >= 3, hint: '完成 3 次出行提醒' },
    { emoji: '🔥', name: '七日连打不间断', need: s => s.bestStreak >= 7, hint: '连续打卡满 7 天' },
  ];

  /* ============ 状态存取 ============ */

  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  const todayKey = () => dayKey(new Date());

  const uid = () => 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);

  function seedState() {
    return {
      day: todayKey(),
      mode: 'elder',
      textSize: 'normal',
      energy: 0,
      stats: { childSetups: 0, messages: 0 },
      checkins: [],
      feed: [],
      emergency: seedEmergency(),
      cards: [
        { id: uid(), type: 'medicine', source: 'child', heading: '氨氯地平 5 毫克', line2: '每次 1 片 · 早饭后半小时温水送服', line3: '今天 08:00', done: false, doneAt: null },
        { id: uid(), type: 'phone', source: 'child', heading: '女儿 · 林小满', phone: '138 0000 1234', line2: '晚 7 点到 9 点', line3: '今天 19:30', done: false, doneAt: null },
        { id: uid(), type: 'travel', source: 'child', heading: '社区医院 · 复查血压', line2: '医保卡、病历本、老花镜', line3: '明天上午 9:30', done: false, doneAt: null },
        { id: uid(), type: 'message', source: 'child', heading: '想对孩子说点什么', line2: '', line3: '随时可以说', done: false, doneAt: null },
      ],
    };
  }

  let state = loadState();
  let filter = 'all';
  let boardView = 'flip';
  let boardPage = 0;
  let flipTimer = null;

  function loadState() {
    let s = null;
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) s = JSON.parse(raw);
    } catch (err) {
      console.warn('本地数据读取失败，将使用示例数据', err);
    }
    if (!s || !Array.isArray(s.cards)) s = seedState();
    migrate(s);
    return s;
  }

  function migrate(s) {
    s.energy = typeof s.energy === 'number' ? s.energy : 0;
    s.stats = s.stats || { childSetups: 0, messages: 0 };
    s.checkins = s.checkins || [];
    s.feed = s.feed || [];
    s.cards = s.cards || [];
    s.emergency = Object.assign(seedEmergency(), s.emergency || {});
    s.mode = s.mode === 'child' ? 'child' : 'elder';
    s.textSize = TEXT_SIZES[s.textSize] ? s.textSize : 'normal';
    if (s.day !== todayKey()) {
      s.day = todayKey();
      s.cards.forEach(c => { c.done = false; c.doneAt = null; });
    }
  }

  /* 页面一直开着也会跨日：由定时器与可见性事件触发 */
  function rolloverIfNewDay(announce) {
    const today = todayKey();
    if (state.day === today) return false;
    state.day = today;
    state.cards.forEach(c => { c.done = false; c.doneAt = null; });
    save();
    if (announce) {
      render();
      toast('新的一天，印章已清空，今天的卡片可以重新办理啦');
      voice.say('新的一天开始啦，昨天的印章已经收起，今天的卡片可以重新办理了。', 0.9);
    }
    return true;
  }

  function save() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(state));
    } catch (err) {
      console.warn('保存失败', err);
      toast('⚠️ 浏览器不允许保存数据，本次体验不会记住进度');
    }
  }

  /* ============ 小工具 ============ */

  const iconBtn = (cls, iconId, text) => {
    const b = el('button', cls);
    b.type = 'button';
    b.appendChild(icon(iconId));
    b.appendChild(document.createTextNode(text));
    return b;
  };

  const $ = sel => document.querySelector(sel);
  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  };
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const rand = (a, b) => a + Math.random() * (b - a);

  const SVG_NS = 'http://www.w3.org/2000/svg';
  const icon = (id, cls) => {
    const s = document.createElementNS(SVG_NS, 'svg');
    s.setAttribute('class', cls ? `ic ${cls}` : 'ic');
    s.setAttribute('aria-hidden', 'true');
    s.setAttribute('focusable', 'false');
    const u = document.createElementNS(SVG_NS, 'use');
    u.setAttribute('href', '#' + id);
    s.appendChild(u);
    return s;
  };
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let toastTimer = null;
  function toast(msg, ms = 3600) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), ms);
  }

  function fmtClock(iso) {
    const d = new Date(iso);
    const sameDay = d.toDateString() === new Date().toDateString();
    const hm = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    return sameDay ? hm : `${d.getMonth() + 1}月${d.getDate()}日 ${hm}`;
  }

  function stampDate(iso) {
    const d = new Date(iso);
    return `${d.getMonth() + 1}.${d.getDate()}`;
  }

  function avatarFor(name) {
    if (/女儿|姑|姨|妈|媳|姐/.test(name)) return '👩';
    if (/儿子|叔|爸|哥|舅/.test(name)) return '👨';
    if (/奶奶|外婆|姥姥/.test(name)) return '👵';
    if (/爷爷|外公|大爷/.test(name)) return '👴';
    if (/老姐妹|老伙计|朋友/.test(name)) return '🧑‍🤝‍🧑';
    return '📞';
  }

  /* ============ 字号调节 ============ */

  function applyTextSize(size, announce) {
    state.textSize = TEXT_SIZES[size] ? size : 'normal';
    document.documentElement.dataset.textsize = state.textSize;
    document.querySelectorAll('.ts-btn').forEach(b => {
      const on = b.dataset.size === state.textSize;
      b.classList.toggle('is-on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (announce) {
      save();
      toast(`字号已切到「${TEXT_SIZES[state.textSize]}」`);
      voice.say(`字号已经调整为${TEXT_SIZES[state.textSize]}，看看现在是不是更清楚了。`, 0.9);
    }
  }

  /* ============ 弹窗焦点管理 ============ */

  const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';
  let openerFocus = null;

  function showOverlay(node, focusNode) {
    openerFocus = document.activeElement;
    node.hidden = false;
    if (focusNode) focusNode.focus();
  }

  function hideOverlay(node) {
    node.hidden = true;
    if (openerFocus && document.contains(openerFocus)) openerFocus.focus();
    openerFocus = null;
  }

  function trapTab(e, container) {
    if (e.key !== 'Tab') return;
    const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter(n => n.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  }

  /* ============ 语音朗读 ============ */

  const voice = {
    get supported() { return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window; },
    zhVoice() {
      const vs = window.speechSynthesis.getVoices() || [];
      return vs.find(v => /^zh([-_]|$)/i.test(v.lang)) || vs.find(v => /Chinese|中文|普通话/i.test(v.name + v.lang)) || null;
    },
    say(text, rate = 0.82) {
      if (!this.supported) { toast('这个浏览器不支持语音朗读，已用文字提示代替'); return; }
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'zh-CN';
        u.rate = rate;
        u.pitch = 1.0;
        u.volume = 1;
        const v = this.zhVoice();
        if (v) u.voice = v;
        window.speechSynthesis.speak(u);
      } catch (err) {
        console.warn('语音播报失败', err);
      }
    },
    /* 多段顺序朗读：speechSynthesis 本身会排队，所以这里只在开头 cancel 一次 */
    saySeq(list, onDone) {
      if (!this.supported) { toast('这个浏览器不支持语音朗读，已用文字提示代替'); return false; }
      try {
        window.speechSynthesis.cancel();
        list.forEach((text, i) => {
          const u = new SpeechSynthesisUtterance(text);
          u.lang = 'zh-CN';
          u.rate = 0.8;
          u.pitch = 1.0;
          u.volume = 1;
          const v = this.zhVoice();
          if (v) u.voice = v;
          if (i === list.length - 1 && onDone) { u.onend = onDone; u.onerror = onDone; }
          window.speechSynthesis.speak(u);
        });
        return true;
      } catch (err) {
        console.warn('连续朗读失败', err);
        return false;
      }
    },
  };
  if (voice.supported) {
    window.speechSynthesis.getVoices();
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
  }

  function cardSpeechText(card) {
    const cat = CATS[card.type];
    const parts = [`这是一条${cat.name}提醒。`];
    if (card.type === 'medicine') parts.push(`药名 ${card.heading}。${card.line2}。提醒时间 ${card.line3}。`);
    if (card.type === 'phone') parts.push(`亲友 ${card.heading}。号码 ${readablePhone(card.phone)}。${card.line2 ? '方便时间 ' + card.line2 + '。' : ''}`);
    if (card.type === 'travel') parts.push(`目的地 ${card.heading}。出发时间 ${card.line3}。要带的东西 ${card.line2}。`);
    if (card.type === 'message') parts.push(`留言卡片，标题是 ${card.heading}。不用打字，点下面任意一句大字，话就发到孩子手机上了。`);
    parts.push(card.done ? '这张卡片您今天已经办妥了，真棒。' : '听完以后，点右边的大按钮，我办妥了。');
    return parts.join('');
  }

  function readablePhone(phone) {
    if (!phone) return '暂未填写';
    return String(phone).replace(/\D/g, '').split('').map(d => ({ '0': '零', '1': '一', '2': '二', '3': '三', '4': '四', '5': '五', '6': '六', '7': '七', '8': '八', '9': '九' }[d])).join(' ');
  }

  /* ============ 今日概览 · 连续天数 · 一键播报 ============ */

  /* 今天还没打卡时从昨天往前数：否则白天打开永远显示 0 天，等于惩罚还没做的人 */
  function streakDays() {
    const days = new Set(state.checkins.map(c => dayKey(new Date(c.at))));
    const d = new Date();
    if (!days.has(dayKey(d))) d.setDate(d.getDate() - 1);
    let n = 0;
    while (days.has(dayKey(d))) {
      n += 1;
      d.setDate(d.getDate() - 1);
    }
    return n;
  }

  function streakText(n) {
    if (n <= 0) return '还没有打卡记录，办妥一张就从今天开始';
    if (n === 1) return '今天是坚持的第 1 天，明天继续就成串啦';
    return `已连续坚持 ${n} 天，花园陪您走了 ${n} 天`;
  }

  function renderSummary() {
    const total = state.cards.length;
    const done = state.cards.filter(c => c.done).length;
    $('#sumTotal').textContent = String(total);
    $('#sumDone').textContent = String(done);
    $('#sumStreak').textContent = streakText(streakDays());
  }

  let todaySpeaking = false;

  function setSpeakLabel() {
    $('#speakAllLabel').textContent = todaySpeaking ? '别念了，停下' : '把今天的事念给我听';
    $('#speakAllBtn').setAttribute('aria-pressed', String(todaySpeaking));
  }

  function speakToday() {
    if (todaySpeaking) { stopSpeakToday(); return; }
    const pending = state.cards.filter(c => !c.done);
    const d = new Date();
    const head = `今天是 ${d.getMonth() + 1} 月 ${d.getDate()} 日，一共有 ${state.cards.length} 件事，已经办妥 ${state.cards.length - pending.length} 件。`;
    const list = pending.length
      ? [head].concat(pending.map(c => cardSpeechText(c)))
      : [head, '今天的事全部办妥啦，一件不落，孩子们看到一定特别放心。'];
    todaySpeaking = true;
    setSpeakLabel();
    if (!voice.saySeq(list, () => { todaySpeaking = false; setSpeakLabel(); })) {
      todaySpeaking = false;
      setSpeakLabel();
      return;
    }
    toast(pending.length ? `正在按顺序念 ${pending.length} 件还没办妥的事，再点一次按钮可停下` : '今天的事都办妥啦，给您念一句总结');
  }

  function stopSpeakToday() {
    if (voice.supported) window.speechSynthesis.cancel();
    todaySpeaking = false;
    setSpeakLabel();
    toast('已停止朗读');
  }

  /* 演示用：示例数据只有今天，连续天数与年度战绩需要一个"过去几天"才看得出效果。
     补的是真实结构的历史打卡（同样 +100 能量），所以战绩、能量、花园、streak 口径一致。 */
  function seedHistoryDemo() {
    const med = state.cards.find(c => c.type === 'medicine');
    let added = 0;
    for (let back = 1; back <= 3; back += 1) {
      const d = new Date();
      d.setDate(d.getDate() - back);
      const key = dayKey(d);
      if (state.checkins.some(c => dayKey(new Date(c.at)) === key)) continue;
      d.setHours(8, 30, 0, 0);
      state.checkins.push({
        cardId: med ? med.id : 'demo',
        type: 'medicine',
        at: d.toISOString(),
        heading: med ? med.heading : '按时吃药',
      });
      addEnergy(ENERGY_PER_CHECKIN);
      added += 1;
    }
    if (!added) { toast('最近三天已经有打卡记录了，不需要再补'); return; }
    save();
    render();
    toast(`已补上 ${added} 天的示例吃药打卡，连续天数与年度战绩都会跟着变`);
  }

  /* ============ 紧急求助信息 ============ */

  function spacedPhone(v) {
    const digits = String(v).replace(/\D/g, '');
    return digits.length === 11 ? `${digits.slice(0, 3)} ${digits.slice(3, 7)} ${digits.slice(7)}` : String(v);
  }

  function renderEmergencyView() {
    const box = $('#emgList');
    box.innerHTML = '';
    EMG_FIELDS.forEach(f => {
      const raw = (state.emergency[f.key] || '').trim();
      const row = el('div', 'emg-row' + (raw ? '' : ' is-empty'));
      row.appendChild(el('dt', 'emg-label', f.label));
      row.appendChild(el('dd', 'emg-value', raw ? (f.tel ? spacedPhone(raw) : raw) : '未填写 · 请在子女守护模式补充'));
      box.appendChild(row);
    });
  }

  function emergencySpeechText() {
    const e = state.emergency;
    const parts = ['这是本机保存的紧急求助信息，请给身边的人听。'];
    parts.push(`紧急联系人 ${e.contact || '暂未填写'}。`);
    parts.push(`联系电话 ${readablePhone(e.phone)}。`);
    if (e.address) parts.push(`家庭住址 ${e.address}。`);
    if (e.blood) parts.push(`血型 ${e.blood}。`);
    if (e.meds) parts.push(`正在服用的药 ${e.meds}。`);
    if (e.history) parts.push(`过敏与既往情况 ${e.history}。`);
    parts.push('请把电话拨给紧急联系人，谢谢。');
    return parts.join('');
  }

  let emgDraft = null;

  function renderEmergencyRows() {
    const box = $('#emgRows');
    box.innerHTML = '';
    EMG_FIELDS.forEach(f => {
      const lab = el('label');
      lab.appendChild(el('span', null, f.label));
      const input = document.createElement('input');
      input.type = f.tel ? 'tel' : 'text';
      input.placeholder = f.placeholder;
      input.value = emgDraft[f.key] || '';
      if (f.tel) input.inputMode = 'tel';
      input.addEventListener('input', () => { emgDraft[f.key] = input.value; });
      lab.appendChild(input);
      box.appendChild(lab);
    });
  }

  function showEmergencyPane(edit) {
    $('#emgView').hidden = edit;
    $('#emgEdit').hidden = !edit;
    if (edit) {
      emgDraft = Object.assign({}, state.emergency);
      renderEmergencyRows();
    } else {
      renderEmergencyView();
    }
  }

  function openEmergency(edit) {
    const wantEdit = edit === undefined ? state.mode === 'child' : edit;
    showEmergencyPane(wantEdit);
    const overlay = $('#emergencyOverlay');
    const target = wantEdit ? $('#emgRows input') : $('#emgSpeakBtn');
    if (overlay.hidden) showOverlay(overlay, target);
    else if (target) target.focus();
  }

  function closeEmergency() {
    if (voice.supported) window.speechSynthesis.cancel();
    hideOverlay($('#emergencyOverlay'));
  }

  function saveEmergency() {
    EMG_FIELDS.forEach(f => { state.emergency[f.key] = (emgDraft[f.key] || '').trim(); });
    pushFeed('setup', '您更新了爸妈的紧急求助信息');
    save();
    showEmergencyPane(false);
    $('#emgSpeakBtn').focus();
    toast('紧急求助信息已保存，父母那边用大字显示');
  }

  /* ============ 音效（WebAudio 提示音） ============ */

  let audioCtx = null;
  function ctx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }

  function beep(freq, at, dur = 0.22, vol = 0.16, type = 'sine') {
    const c = ctx();
    if (!c) return;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, c.currentTime + at);
    gain.gain.linearRampToValueAtTime(vol, c.currentTime + at + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + at + dur);
    osc.connect(gain).connect(c.destination);
    osc.start(c.currentTime + at);
    osc.stop(c.currentTime + at + dur + 0.05);
  }

  function cheerChime() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => beep(f, i * 0.11, 0.3, 0.14, 'triangle'));
  }

  /* ============ 粒子庆祝 ============ */

  const FX_EMOJI = ['🌸', '⭐', '✨', '🍀'];

  function rainParticles(count = 18) {
    if (reduced()) return;
    const layer = $('#fxLayer');
    for (let i = 0; i < count; i++) {
      const p = el('span', 'particle', pick(FX_EMOJI));
      p.style.left = rand(0, 100) + 'vw';
      p.style.fontSize = rand(1.1, 2.6) + 'rem';
      p.style.animationDuration = rand(1.9, 3.6) + 's';
      p.style.animationDelay = rand(0, .5) + 's';
      p.style.setProperty('--dx', Math.round(rand(-160, 160)) + 'px');
      p.style.setProperty('--rot', Math.round(rand(180, 720)) + 'deg');
      p.addEventListener('animationend', () => p.remove());
      layer.appendChild(p);
    }
  }

  function burstFrom(node) {
    if (reduced() || !node) return;
    const r = node.getBoundingClientRect();
    const layer = $('#fxLayer');
    for (let i = 0; i < 9; i++) {
      const p = el('span', 'particle', pick(FX_EMOJI));
      p.style.left = (r.left + r.width / 2) + 'px';
      p.style.top = r.top + 'px';
      p.style.fontSize = rand(1.1, 1.9) + 'rem';
      p.style.animationDuration = rand(1.4, 2.4) + 's';
      p.style.setProperty('--dx', Math.round(rand(-260, 260)) + 'px');
      p.style.setProperty('--rot', Math.round(rand(360, 900)) + 'deg');
      p.addEventListener('animationend', () => p.remove());
      layer.appendChild(p);
    }
  }

  /* ============ 亲情花园 ============ */

  function stageIndex(energy) {
    let idx = 0;
    for (let i = 0; i < STAGES.length; i++) if (energy >= STAGES[i].at) idx = i;
    return idx;
  }

  function stageProgress(energy) {
    const i = stageIndex(energy);
    if (i === STAGES.length - 1) return 100;
    const cur = STAGES[i].at, next = STAGES[i + 1].at;
    return Math.max(3, Math.round(((energy - cur) / (next - cur)) * 100));
  }

  /* ============ 一次性动效 ============ */

  // 卡片错峰入场：只在首屏、筛选切换、视角切换时播；打卡/保存等数据刷新不重播，
  // 否则每点一次「我办妥了」四张卡都会重新跳一遍。
  let enterTimer = null;
  function playEntrance() {
    if (reduced()) return;
    const board = $('#board');
    clearTimeout(enterTimer);
    board.classList.remove('is-entering');
    void board.offsetWidth;
    board.classList.add('is-entering');
    enterTimer = setTimeout(() => board.classList.remove('is-entering'), 900);
  }

  // 能量数字滚动：目标值立刻写进 aria-valuetext，读屏听到的始终是最终值
  let energyShown = state.energy;
  let energyRaf = null;
  let energySnap = null;
  function showEnergy(target) {
    const node = $('#energyNum');
    cancelAnimationFrame(energyRaf);
    clearTimeout(energySnap);
    if (reduced() || document.hidden || energyShown === target) {
      energyShown = target;
      node.textContent = target;
      return;
    }
    const from = energyShown;
    const t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 620);
      energyShown = Math.round(from + (target - from) * (1 - Math.pow(1 - k, 3)));
      node.textContent = energyShown;
      if (k < 1) energyRaf = requestAnimationFrame(step);
    };
    energyRaf = requestAnimationFrame(step);
    // rAF 在后台标签页或被节流的窗口里可能一帧都不回调，兜底把数字钉到目标值
    energySnap = setTimeout(() => {
      cancelAnimationFrame(energyRaf);
      energyShown = target;
      node.textContent = target;
    }, 760);
  }

  let lastStage = stageIndex(state.energy);
  // 升级与生长标记由 addEnergy 置位、renderGarden 消费：跨标签页同步等外部更新不会误播动画
  let pendingLevelUp = false;
  let pendingGrow = 0;

  function spawnPlantBurst(text) {
    const scene = $('#plantScene');
    const b = el('span', 'plant-burst', text);
    scene.appendChild(b);
    setTimeout(() => b.remove(), 1050);
  }

  function renderGarden() {
    const energy = state.energy;
    const i = stageIndex(energy);
    const st = STAGES[i];

    showEnergy(energy);
    const pct = stageProgress(energy);
    $('#energyFill').style.width = pct + '%';
    const bar = $('#energyBar');
    bar.setAttribute('aria-valuenow', String(pct));
    bar.setAttribute('aria-valuetext', `亲情能量 ${energy} 点，${st.label}`);

    const main = $('#plantMain');
    main.replaceChildren(icon(st.icon));
    // 阶段内连续物理成长：随当前阶段能量百分比从 0.82 逐渐长高到 1.12
    const growScale = i === STAGES.length - 1 ? '1.14' : (0.82 + (pct / 100) * 0.28).toFixed(3);
    main.style.setProperty('--grow', growScale);
    const scene = $('#plantScene');
    scene.dataset.stage = String(i);
    $('#plantStage').textContent = st.label;

    $('#energyNext').textContent = i === STAGES.length - 1
      ? '花园已经硕果累累，这份亲情满分啦！'
      : `再攒 ${STAGES[i + 1].at - energy} 点，就能进入「${STAGES[i + 1].label}」`;

    $('#stageTrack').querySelectorAll('li').forEach((li, n) => {
      li.classList.toggle('done', n < i);
      li.classList.toggle('now', n === i);
    });

    if (pendingGrow > 0) {
      scene.classList.remove('is-growing');
      void scene.offsetWidth;
      scene.classList.add('is-growing');
      setTimeout(() => scene.classList.remove('is-growing'), 800);
      spawnPlantBurst(`+${pendingGrow} 🌱 长大啦`);
    }

    if (pendingLevelUp && i > lastStage) {
      scene.classList.add('level-up');
      setTimeout(() => scene.classList.remove('level-up'), 1000);
      const nowLi = $('#stageTrack').querySelector('li.now');
      if (nowLi) {
        nowLi.classList.add('is-pop');
        setTimeout(() => nowLi.classList.remove('is-pop'), 700);
      }
      rainParticles(14);
    }
    pendingGrow = 0;
    pendingLevelUp = false;
    lastStage = i;
  }

  function addEnergy(n) {
    const before = stageIndex(state.energy);
    state.energy += n;
    pendingGrow = n;
    const after = stageIndex(state.energy);
    if (after <= before) return null;
    pendingLevelUp = true;
    return STAGES[after].label;
  }

  /* ============ 打卡日历与连续天数 ============ */

  const calView = { y: new Date().getFullYear(), m: new Date().getMonth() };

  function checkinDayCounts() {
    const map = new Map();
    state.checkins.forEach(c => {
      const k = dayKey(new Date(c.at));
      map.set(k, (map.get(k) || 0) + 1);
    });
    return map;
  }

  function shiftDay(d, n) {
    const x = new Date(d);
    x.setDate(x.getDate() + n);
    return x;
  }

  function computeStreak(days) {
    let cursor = new Date();
    // 今天还没打卡时从昨天往前算，今天补上就能接上
    if (!days.has(dayKey(cursor))) cursor = shiftDay(cursor, -1);

    let current = 0;
    while (days.has(dayKey(cursor))) {
      current += 1;
      cursor = shiftDay(cursor, -1);
    }

    let best = 0, run = 0, prev = null;
    [...days.keys()].sort().forEach(k => {
      run = prev && dayKey(shiftDay(prev, 1)) === k ? run + 1 : 1;
      best = Math.max(best, run);
      prev = new Date(k + 'T00:00:00');
    });

    return { current, best: Math.max(best, current) };
  }

  function renderCalendar() {
    const days = checkinDayCounts();
    const streak = computeStreak(days);

    $('#streakNum').textContent = String(streak.current);
    $('#bestStreakNum').textContent = String(streak.best);
    $('#streakBox').classList.toggle('is-hot', streak.current >= 7);

    $('#calMonth').textContent = `${calView.y} 年 ${calView.m + 1} 月`;

    const now = new Date();
    $('#calNext').disabled = calView.y === now.getFullYear() && calView.m === now.getMonth();

    const lead = (new Date(calView.y, calView.m, 1).getDay() + 6) % 7;
    const lastDate = new Date(calView.y, calView.m + 1, 0).getDate();
    const ym = `${calView.y}-${String(calView.m + 1).padStart(2, '0')}`;
    const todayStr = todayKey();

    const grid = $('#calGrid');
    grid.innerHTML = '';
    for (let i = 0; i < lead; i += 1) {
      const blank = el('div', 'cal-day is-blank');
      blank.setAttribute('aria-hidden', 'true');
      grid.appendChild(blank);
    }

    let monthTotal = 0;
    for (let d = 1; d <= lastDate; d += 1) {
      const key = `${ym}-${String(d).padStart(2, '0')}`;
      const count = days.get(key) || 0;
      monthTotal += count;

      const cls = 'cal-day'
        + (count ? ` lv${Math.min(count, 3)}` : '')
        + (key === todayStr ? ' is-today' : '');
      const cell = el('div', cls, String(d));
      cell.setAttribute('role', 'listitem');
      cell.setAttribute('aria-label', count
        ? `${calView.m + 1} 月 ${d} 日，完成 ${count} 项`
        : `${calView.m + 1} 月 ${d} 日，没有打卡`);
      if (count) cell.appendChild(el('span', 'cal-dot', count > 1 ? `✓${count}` : '✓'));
      grid.appendChild(cell);
    }

    $('#calEmpty').hidden = monthTotal > 0;
  }

  function stepMonth(delta) {
    const now = new Date();
    if (delta > 0 && calView.y === now.getFullYear() && calView.m === now.getMonth()) return;
    calView.m += delta;
    if (calView.m < 0) { calView.m = 11; calView.y -= 1; }
    if (calView.m > 11) { calView.m = 0; calView.y += 1; }
    renderCalendar();
  }

  /* ============ 打卡 ============ */

  function pushFeed(kind, text) {
    state.feed.unshift({ kind, text, at: new Date().toISOString() });
    state.feed = state.feed.slice(0, 24);
  }

  function checkin(card, fromNode) {
    if (card.done) {
      toast(`「${card.heading}」今天已经办妥啦，明天再来领取新的能量`);
      return;
    }
    card.done = true;
    card.doneAt = new Date().toISOString();
    state.checkins.push({ cardId: card.id, type: card.type, at: card.doneAt, heading: card.heading });

    const newStage = addEnergy(ENERGY_PER_CHECKIN);
    pushFeed('checkin', `长辈刚完成「${CATS[card.type].name} · ${card.heading}」打卡，亲情能量 +${ENERGY_PER_CHECKIN}`);

    save();
    render();

    rainParticles(16);
    burstFrom(fromNode);
    cheerChime();
    voice.say(pick(CATS[card.type].praise), 0.9);

    toast(`已盖上红印章！亲情能量 +${ENERGY_PER_CHECKIN}`);
    if (newStage) {
      setTimeout(() => {
        toast(`亲情花园升级啦：${newStage}！您真了不起`);
        voice.say(`恭喜！亲情花园升级啦，现在是${newStage}。您的坚持，让全家人都安心。`, 0.9);
      }, 1800);
    }
  }

  function sendPhrase(card, text, fromNode) {
    if (!card.sent) card.sent = [];
    const already = card.sent.includes(text);
    card.sent.push(text);
    if (!already) {
      state.stats.messages += 1;
      const newStage = addEnergy(ENERGY_PER_MESSAGE);
      pushFeed('message', `长辈刚发来留言：「${text}」，亲情能量 +${ENERGY_PER_MESSAGE}`);
      save();
      render();
      burstFrom(fromNode);
      cheerChime();
      voice.say(`话已经送到孩子手机上啦，内容是：${text}。`, 0.9);
      toast(`已发送给子女：${text}`);
      if (newStage) setTimeout(() => toast(`亲情花园升级啦：${newStage}`), 1500);
    } else {
      save();
      render();
      toast(`这句已经发过啦，孩子都读到过了`);
    }
  }

  /* ============ 模拟通话 ============ */

  let callTimers = [];
  let callIntervals = [];

  function clearCallTimers() {
    callTimers.forEach(clearTimeout);
    callIntervals.forEach(clearInterval);
    callTimers = [];
    callIntervals = [];
  }

  function startCall(card) {
    const overlay = $('#callOverlay');
    const name = card.heading || '亲友';
    clearCallTimers();
    $('#callAvatar').textContent = avatarFor(name);
    $('#callName').textContent = name;
    $('#callNum').textContent = card.phone || '（未填写号码，仅作温情演示）';
    $('#callState').textContent = '正在呼叫…';
    $('#callHint').textContent = card.line2 ? `方便的时间：${card.line2}` : '接通后慢慢聊，说一句「我挺好的」。';
    showOverlay(overlay, $('#hangupBtn'));

    voice.say(`正在为您呼叫 ${name.split('·')[0].trim()}，请稍候`, 0.9);
    const ring = () => { beep(500, 0, .3, .1); beep(650, .35, .3, .1); };
    ring();
    callIntervals.push(setInterval(ring, 1700));

    callTimers.push(setTimeout(() => {
      clearCallTimers();
      [659.25, 783.99, 1046.5].forEach((f, i) => beep(f, i * 0.13, 0.25, 0.13, 'triangle'));
      let sec = 0;
      const show = () => {
        $('#callState').textContent = `已接通 · ${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;
      };
      show();
      $('#callHint').textContent = '温情演示：孩子接起来了，说说今天吃了什么、身体怎么样。';
      voice.say('接通啦，孩子就在电话那头，慢慢说。', 0.9);
      callIntervals.push(setInterval(() => { sec += 1; show(); }, 1000));
    }, 2800));
  }

  function endCall() {
    clearCallTimers();
    hideOverlay($('#callOverlay'));
    toast('通话结束。回到卡片点「我办妥了」，把这份团圆记进战绩');
  }

  /* ============ 年度战绩海报 ============ */

  function computeStats() {
    const year = new Date().getFullYear();
    const thisYear = state.checkins.filter(c => new Date(c.at).getFullYear() === year);
    const byType = { medicine: 0, phone: 0, travel: 0, message: 0 };
    thisYear.forEach(c => { if (byType[c.type] !== undefined) byType[c.type] += 1; });
    const total = state.cards.length;
    const doneToday = state.cards.filter(c => c.done).length;
    const streak = computeStreak(checkinDayCounts());
    return {
      year,
      tasks: thisYear.length,
      byType,
      total,
      doneToday,
      rate: total ? Math.round((doneToday / total) * 100) : 0,
      childSetups: state.stats.childSetups,
      energy: state.energy,
      messages: state.stats.messages,
      stage: STAGES[stageIndex(state.energy)].label,
      streak: streak.current,
      bestStreak: streak.best,
    };
  }

  function renderReport() {
    const s = computeStats();
    $('#posterYear').textContent = String(s.year);
    $('#posterSlogan').textContent = `${s.year} 年，长辈共完成 ${s.tasks} 项日常守护任务，今日健康守护率 ${s.rate}%；子女共设置 ${s.childSetups} 次暖心提醒，累计收获亲情能量 ${s.energy} 点`;

    const stats = [
      { num: s.tasks, lab: `${s.year} 年完成守护任务` },
      { num: s.rate + '%', lab: `今日健康守护率（${s.doneToday}/${s.total}）` },
      { num: s.childSetups, lab: '子女设置暖心提醒' },
      { num: s.energy, lab: '累计亲情能量（点）' },
      { num: s.messages, lab: '长辈发来留言（条）' },
      { num: s.stage, lab: '亲情花园当前阶段' },
      { num: s.streak, lab: '当前连续打卡（天）' },
      { num: s.bestStreak, lab: '最长连续打卡（天）' },
    ];
    const grid = $('#statGrid');
    grid.innerHTML = '';
    stats.forEach((it, i) => {
      const box = el('div', 'stat');
      const n = el('span', 'num', String(it.num));
      box.appendChild(n);
      box.appendChild(el('span', 'lab', it.lab));
      box.style.animation = `rise .45s ease both`;
      box.style.animationDelay = (i * 0.06) + 's';
      grid.appendChild(box);
    });

    const mg = $('#medalGrid');
    mg.innerHTML = '';
    let gotCount = 0;
    MEDALS.forEach((m, i) => {
      const got = m.need(s);
      if (got) gotCount += 1;
      const box = el('div', 'medal' + (got ? '' : ' locked'));
      box.appendChild(el('span', 'm-emoji', got ? m.emoji : '🔒'));
      const txt = el('div');
      txt.appendChild(el('div', null, m.name));
      txt.appendChild(el('small', null, got ? '已获得 · 挂在您的胸前' : '解锁条件：' + m.hint));
      box.appendChild(txt);
      box.style.animationDelay = (0.15 + i * 0.07) + 's';
      mg.appendChild(box);
    });
    $('.medal-title').textContent = `本年度趣味勋章（已点亮 ${gotCount} / ${MEDALS.length}）`;
    $('#posterTip').hidden = true;
    $('#poster').classList.remove('poster-mode');
    $('#posterSaveBtn').textContent = '生成纪念海报提示';
  }

  function openReport() {
    renderReport();
    showOverlay($('#reportOverlay'), $('#reportCloseBtn'));
    const s = computeStats();
    voice.say(`${s.year} 年岁岁念亲情战绩：您一共完成 ${s.tasks} 项日常守护任务，今日健康守护率 ${s.rate} 百分之，子女为您设置了 ${s.childSetups} 次暖心提醒，累计亲情能量 ${s.energy} 点。这一年，爱被记了很多次。`, 0.95);
  }

  function closeReport() {
    hideOverlay($('#reportOverlay'));
    if (voice.supported) window.speechSynthesis.cancel();
  }

  function posterHint() {
    const poster = $('#poster');
    if (poster.classList.contains('poster-mode')) {
      poster.classList.remove('poster-mode');
      $('#posterTip').hidden = true;
      $('#posterSaveBtn').textContent = '生成纪念海报提示';
      voice.say('已返回战绩明细。', 0.9);
      return;
    }
    const s = computeStats();
    poster.classList.add('poster-mode');
    const tip = $('#posterTip');
    tip.hidden = false;
    tip.textContent = '已进入「纪念海报模式」：按钮和未解锁勋章都收起来了。按 Ctrl + P（苹果电脑 ⌘ + P）选择「另存为 PDF」即可永久保存；也可以直接用系统截图保存这张海报。';
    $('#posterSaveBtn').textContent = '返回战绩明细';
    const summary = `岁岁念 · ${s.year} 年度亲情战绩：完成 ${s.tasks} 项守护任务，今日健康守护率 ${s.rate}%，子女设置 ${s.childSetups} 次暖心提醒，累计亲情能量 ${s.energy} 点，亲情花园「${s.stage}」。`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(summary).then(
        () => toast('战绩文字总结已复制，可直接粘贴到家庭群'),
        () => {}
      );
    }
    voice.say('纪念海报已经准备好，可以按控制加 P 键打印保存，也可以用截图留住这一年的牵挂。', 0.95);
  }

  /* ============ 渲染：卡片 ============ */

  function cardRows(card) {
    const cat = CATS[card.type];
    const list = el('ul', 'card-rows');
    Object.entries(cat.rowLabels).forEach(([key, label]) => {
      const val = card[key];
      if (!val) return;
      const li = el('li');
      li.appendChild(el('span', 'k', label + '：'));
      li.appendChild(el('span', 'v', val));
      list.appendChild(li);
    });
    return list;
  }

  function buildCard(card) {
    const cat = CATS[card.type];
    const node = el('article', `card ${cat.className}` + (card.done ? ' is-done' : ''));
    node.dataset.id = card.id;

    const top = el('div', 'card-top');
    top.appendChild(icon(cat.icon, 'card-ic'));
    top.appendChild(el('span', 'card-cat', cat.name));
    if (card.line3 && card.type !== 'medicine' && card.type !== 'travel') top.appendChild(el('span', 'card-time', card.line3));
    node.appendChild(top);
    node.appendChild(el('h3', 'card-head', card.heading));
    node.appendChild(cardRows(card));

    if (card.type === 'message') {
      const box = el('div', 'phrases');
      box.setAttribute('role', 'group');
      box.setAttribute('aria-label', '快捷暖心短语');
      QUICK_PHRASES.forEach(p => {
        const sent = (card.sent || []).includes(p);
        const b = el('button', 'phrase' + (sent ? ' sent' : ''), (sent ? '✓ 已发送 · ' : '') + p);
        b.type = 'button';
        if (state.mode === 'elder') b.addEventListener('click', () => sendPhrase(card, p, b));
        else { b.disabled = true; b.title = '这一句由爸妈自己点选发送'; }
        box.appendChild(b);
      });
      node.appendChild(box);
      const meta = el('p', 'phrase-meta', state.mode === 'elder'
        ? `已发送 ${(card.sent || []).length} 条 · 孩子那边会同步出现在通知栏`
        : `爸妈已发送 ${(card.sent || []).length} 条 · 点选由父母自己完成，无需打字`);
      node.appendChild(meta);
    }

    if (card.type === 'medicine') node.appendChild(el('p', 'card-note', '温水送服，别空腹；不舒服就先给家人打个电话。'));
    if (card.type === 'travel') node.appendChild(el('p', 'card-note', '出门前看看天气，路上慢一点，不着急。'));

    const actions = el('div', 'card-actions');

    if (state.mode === 'elder') {
      if (card.type === 'phone') {
        const call = iconBtn('act act-call', 'ic-phone', `一键呼叫 ${card.heading.split('·')[0].trim()}`);
        call.addEventListener('click', () => startCall(card));
        actions.appendChild(call);
        actions.classList.add('is-phone');
      }
      const listen = iconBtn('act', 'ic-sound', '听一听');
      listen.addEventListener('click', () => {
        voice.say(cardSpeechText(card), 0.78);
        toast('正在为您朗读这张卡片…');
      });
      const done = iconBtn('act' + (card.done ? '' : ' act-done'), 'ic-check', card.done ? '已办妥' : '我办妥了');
      if (card.done) { done.disabled = true; done.setAttribute('aria-label', `今天 ${fmtClock(card.doneAt)} 已办妥`); }
      else done.addEventListener('click', () => checkin(card, done));
      actions.appendChild(listen);
      actions.appendChild(done);
    } else {
      const listen = iconBtn('act', 'ic-sound', '听一听（试听朗读）');
      listen.addEventListener('click', () => voice.say(cardSpeechText(card), 0.78));
      actions.appendChild(listen);
      actions.classList.add('is-child-preview');
    }
    node.appendChild(actions);

    if (state.mode === 'child') {
      const admin = el('div', 'card-admin');
      admin.appendChild(el('span', 'pill ' + (card.done ? 'pill-done' : 'pill-wait'), card.done ? `父母已办妥 · ${fmtClock(card.doneAt)}` : '父母还没打卡'));
      const edit = el('button', 'mini-btn mini-btn-edit', '修改这张');
      edit.type = 'button';
      edit.addEventListener('click', () => openComposer(card));
      admin.appendChild(edit);
      const del = el('button', 'mini-btn', '移除这张卡片');
      del.type = 'button';
      del.addEventListener('click', () => {
        if (!confirm(`确定移除这张「${CATS[card.type].name}」卡片吗？`)) return;
        state.cards = state.cards.filter(c => c.id !== card.id);
        save(); render();
        toast('已移除该卡片');
      });
      admin.appendChild(del);
      node.appendChild(admin);
    }

    if (card.done && card.doneAt) {
      const stamp = el('div', 'stamp');
      stamp.appendChild(el('span', null, '已办妥'));
      stamp.appendChild(el('small', null, stampDate(card.doneAt)));
      node.appendChild(stamp);
    }
    return node;
  }

  function playFlip(dir) {
    const board = $('#board');
    clearTimeout(flipTimer);
    board.classList.remove('is-flip-next', 'is-flip-prev');
    void board.offsetWidth;
    board.classList.add(dir > 0 ? 'is-flip-next' : 'is-flip-prev');
    flipTimer = setTimeout(() => board.classList.remove('is-flip-next', 'is-flip-prev'), 480);
  }

  function goPage(nextPage) {
    const shown = state.cards.filter(c => filter === 'all' || c.type === filter);
    if (!shown.length) return;
    const clamped = Math.max(0, Math.min(shown.length - 1, nextPage));
    if (clamped === boardPage) return;
    const dir = clamped > boardPage ? 1 : -1;
    boardPage = clamped;
    renderBoard();
    playFlip(dir);
  }

  function syncBoardViewButtons() {
    const isFlip = boardView === 'flip';
    $('#viewFlipBtn').classList.toggle('is-on', isFlip);
    $('#viewFlipBtn').setAttribute('aria-pressed', String(isFlip));
    $('#viewGridBtn').classList.toggle('is-on', !isFlip);
    $('#viewGridBtn').setAttribute('aria-pressed', String(!isFlip));
  }

  function renderBoard() {
    const stage = $('#boardStage');
    const board = $('#board');
    const pager = $('#boardPager');
    const prevBtn = $('#prevPageBtn');
    const nextBtn = $('#nextPageBtn');
    board.innerHTML = '';
    const shown = state.cards.filter(c => filter === 'all' || c.type === filter);
    const isFlip = boardView === 'flip';
    const showFlip = shown.length > 0 && isFlip;
    board.classList.toggle('is-flip', isFlip);
    stage.classList.toggle('is-grid-stage', !showFlip);
    prevBtn.hidden = !showFlip;
    nextBtn.hidden = !showFlip;
    syncBoardViewButtons();

    if (showFlip) {
      boardPage = Math.max(0, Math.min(shown.length - 1, boardPage));
      // 左右对称扇形叠放：左侧露前 2 张，右侧露后 2 张，当前卡居中置顶
      [
        { offset: -2, cls: 'card-deck-prev2' },
        { offset: -1, cls: 'card-deck-prev1' },
        { offset:  2, cls: 'card-deck-next2' },
        { offset:  1, cls: 'card-deck-next1' },
      ].forEach(({ offset, cls }) => {
        const idx = boardPage + offset;
        if (idx >= 0 && idx < shown.length) {
          const back = buildCard(shown[idx]);
          back.classList.add(cls);
          back.setAttribute('aria-hidden', 'true');
          back.addEventListener('click', () => goPage(idx));
          board.appendChild(back);
        }
      });
      const front = buildCard(shown[boardPage]);
      front.classList.add('card-deck-front');
      board.appendChild(front);

      pager.hidden = false;
      $('#pagerText').textContent = `第 ${boardPage + 1} 张 · 共 ${shown.length} 张`;
      prevBtn.disabled = boardPage === 0;
      nextBtn.disabled = boardPage >= shown.length - 1;
      const dots = $('#pagerDots');
      dots.innerHTML = '';
      let activeDot = null;
      shown.forEach((c, idx) => {
        const isOn = idx === boardPage;
        const d = el('button', 'pager-dot' + (isOn ? ' is-on' : ''));
        d.type = 'button';
        d.style.setProperty('--cat', `var(--c-${c.type})`);
        const icBox = el('span', 'pager-dot-ic');
        icBox.appendChild(icon(CATS[c.type].icon));
        const info = el('span', 'pager-dot-info');
        info.appendChild(el('span', 'pager-dot-title', c.heading));
        info.appendChild(el('span', 'pager-dot-sub', c.done ? '✓ 已办妥' : (c.line3 || CATS[c.type].name)));
        d.appendChild(icBox);
        d.appendChild(info);
        d.setAttribute('aria-label', `翻到第 ${idx + 1} 张：${c.heading}`);
        d.addEventListener('click', () => goPage(idx));
        dots.appendChild(d);
        if (isOn) activeDot = d;
      });
      if (activeDot && activeDot.scrollIntoView) {
        activeDot.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    } else {
      shown.forEach(c => board.appendChild(buildCard(c)));
      pager.hidden = true;
    }

    $('#boardEmpty').hidden = shown.length > 0;
    const doneCount = shown.filter(c => c.done).length;
    $('#boardCount').textContent = state.mode === 'elder'
      ? `共 ${shown.length} 张 · 已办妥 ${doneCount} 张 · ${todayDisplay()}`
      : `父母今日已完成 ${doneCount}/${shown.length} 张`;
    $('#boardTitle').textContent = state.mode === 'elder' ? '今日备忘卡片' : '爸妈的卡片（守护视角）';
  }

  function todayDisplay() {
    const d = new Date();
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  }

  /* ============ 渲染：通知栏 ============ */

  function renderNotice() {
    const list = $('#noticeList');
    list.innerHTML = '';
    state.feed.forEach(item => {
      const li = el('li', 'notice-item');
      li.appendChild(el('span', 'when', fmtClock(item.at)));
      li.appendChild(el('span', null, item.text));
      list.appendChild(li);
    });
    $('#noticeEmpty').hidden = state.feed.length > 0;
  }

  /* ============ 子女设置面板 ============ */

  const composerDraft = { type: 'medicine', values: {}, editingId: null };

  function renderCatPick() {
    const box = $('#catPick');
    box.innerHTML = '';
    Object.entries(CATS).forEach(([key, cat]) => {
      const b = el('button', 'cat-btn' + (composerDraft.type === key ? ' is-on' : ''));
      b.appendChild(icon(cat.icon));
      b.appendChild(document.createTextNode(cat.name));
      b.type = 'button';
      b.addEventListener('click', () => {
        composerDraft.type = key;
        composerDraft.values = {};
        renderCatPick();
        renderTplPick();
        renderFieldRows();
      });
      box.appendChild(b);
    });
  }

  function renderTplPick() {
    const box = $('#tplPick');
    box.innerHTML = '';
    CATS[composerDraft.type].templates.forEach(t => {
      const label = Object.values(t).join(' · ');
      const b = el('button', 'tpl', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        composerDraft.values = Object.assign({}, t);
        renderFieldRows();
        toast('模板已填入，可直接修改文字');
      });
      box.appendChild(b);
    });
  }

  function renderFieldRows() {
    const box = $('#fieldRows');
    box.innerHTML = '';
    CATS[composerDraft.type].fields.forEach(f => {
      const lab = el('label');
      lab.appendChild(el('span', null, f.label));
      const input = document.createElement('input');
      input.type = f.key === 'phone' ? 'tel' : 'text';
      input.placeholder = f.placeholder;
      input.value = composerDraft.values[f.key] || '';
      if (f.key === 'phone') input.inputMode = 'tel';
      input.addEventListener('input', () => { composerDraft.values[f.key] = input.value; });
      lab.appendChild(input);
      box.appendChild(lab);
    });
    if (composerDraft.type === 'message') {
      box.appendChild(el('p', 'card-note', '留言卡片自带 6 句大字快捷短语，爸妈点一下就能发送，无需打字。'));
    }
  }

  function saveComposerCard() {
    const type = composerDraft.type;
    const heading = (composerDraft.values.heading || '').trim();
    if (!heading) {
      toast('⚠️ 请先填写「' + CATS[type].fields[0].label + '」，字大一点更好认');
      const first = $('#fieldRows input');
      if (first) first.focus();
      return;
    }
    const v = composerDraft.values;
    const fields = {
      type,
      heading,
      line2: (v.line2 || '').trim(),
      line3: (v.line3 || '').trim(),
      phone: (v.phone || '').trim(),
    };
    if (type === 'medicine' && !fields.line3) fields.line3 = '今天';
    if (type === 'travel' && !fields.line3) fields.line3 = '今天出门';

    if (composerDraft.editingId) {
      const card = state.cards.find(c => c.id === composerDraft.editingId);
      if (!card) { closeComposer(); return; }
      Object.assign(card, fields);
      pushFeed('setup', `您修改了「${CATS[type].name} · ${heading}」卡片`);
      save();
      render();
      closeComposer();
      toast('修改已保存，爸妈那边看到的就是新内容');
      return;
    }

    state.cards.unshift(Object.assign({ id: uid(), source: 'child', done: false, doneAt: null }, fields));
    state.stats.childSetups += 1;
    pushFeed('setup', `您刚为爸妈新增「${CATS[type].name} · ${heading}」卡片`);
    save();
    filter = 'all';
    render();
    closeComposer();
    toast('已添加到爸妈的卡片，切到长辈模式就能看到');
  }

  function openComposer(editCard) {
    composerDraft.editingId = editCard ? editCard.id : null;
    composerDraft.type = editCard ? editCard.type : 'medicine';
    composerDraft.values = editCard
      ? { heading: editCard.heading || '', line2: editCard.line2 || '', line3: editCard.line3 || '', phone: editCard.phone || '' }
      : {};

    $('#composerTitle').textContent = editCard ? '修改这张卡片' : '远程为爸妈添加一张大卡片';
    $('#saveCardBtn').textContent = editCard ? '保存修改' : '保存到爸妈的卡片';

    $('#composer').hidden = false;
    $('#composerBtn').hidden = true;
    renderCatPick(); renderTplPick(); renderFieldRows();
    $('#composer').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth', block: 'start' });
    const inp = $('#fieldRows input');
    if (inp) inp.focus();
  }

  function closeComposer() {
    composerDraft.editingId = null;
    $('#composer').hidden = true;
    if (state.mode === 'child') $('#composerBtn').hidden = false;
  }

  /* ============ 模式切换 ============ */

  function applyMode(mode) {
    state.mode = mode;
    document.body.dataset.mode = mode;
    const elder = mode === 'elder';
    $('#modeElder').classList.toggle('is-on', elder);
    $('#modeChild').classList.toggle('is-on', !elder);
    $('#modeElder').setAttribute('aria-pressed', String(elder));
    $('#modeChild').setAttribute('aria-pressed', String(!elder));
    $('#modeLabel').textContent = elder ? '当前视角：长辈卡片模式' : '当前视角：子女守护模式';
    $('#noticeBar').hidden = elder;
    $('#composerBtn').hidden = elder || !$('#composer').hidden;
    if (elder) closeComposer();
    save();
  }

  /* ============ 总渲染 ============ */

  function syncTabs() {
    document.querySelectorAll('.filter-tabs .tab').forEach(t => {
      const on = t.dataset.filter === filter;
      t.classList.toggle('is-on', on);
      t.setAttribute('aria-pressed', String(on));
    });
  }

  function render() {
    syncTabs();
    renderGarden();
    renderCalendar();
    renderBoard();
    renderNotice();
    renderSummary();
  }

  function renderHeader() {
    const d = new Date();
    const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
    $('#todayLine').textContent = `今天是 ${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${week}`;
  }

  /* ============ 事件绑定 ============ */

  $('#modeElder').addEventListener('click', () => {
    applyMode('elder'); render(); playEntrance();
    voice.say('已切换到长辈卡片模式，卡片上的大字一看就明白。', 0.9);
  });

  $('#modeChild').addEventListener('click', () => {
    applyMode('child'); render(); playEntrance();
    toast('子女守护模式：可远程加卡片、查看父母打卡动态（通知栏已打开）');
  });

  $('#reportBtn').addEventListener('click', openReport);
  $('#reportCloseBtn').addEventListener('click', closeReport);
  $('#posterSaveBtn').addEventListener('click', posterHint);
  $('#composerBtn').addEventListener('click', () => openComposer());
  $('#closeComposerBtn').addEventListener('click', closeComposer);
  $('#saveCardBtn').addEventListener('click', saveComposerCard);
  $('#hangupBtn').addEventListener('click', endCall);

  $('#speakAllBtn').addEventListener('click', speakToday);
  $('#emergencyBtn').addEventListener('click', () => openEmergency());
  $('#emgSpeakBtn').addEventListener('click', () => voice.say(emergencySpeechText(), 0.8));
  $('#emgEditBtn').addEventListener('click', () => openEmergency(true));
  $('#emgCloseBtn').addEventListener('click', closeEmergency);
  $('#emgSaveBtn').addEventListener('click', saveEmergency);
  $('#emgBackBtn').addEventListener('click', () => showEmergencyPane(false));
  $('#historyBtn').addEventListener('click', seedHistoryDemo);

  document.querySelectorAll('.ts-btn').forEach(b => {
    b.addEventListener('click', () => applyTextSize(b.dataset.size, true));
  });

  $('#calPrev').addEventListener('click', () => stepMonth(-1));
  $('#calNext').addEventListener('click', () => stepMonth(1));

  $('#callOverlay').addEventListener('keydown', e => trapTab(e, $('#callOverlay')));
  $('#reportOverlay').addEventListener('keydown', e => trapTab(e, $('#reportOverlay')));
  $('#emergencyOverlay').addEventListener('keydown', e => trapTab(e, $('#emergencyOverlay')));

  document.querySelectorAll('.filter-tabs .tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filter = tab.dataset.filter;
      boardPage = 0;
      syncTabs();
      renderBoard();
      playEntrance();
    });
  });

  $('#viewFlipBtn').addEventListener('click', () => {
    if (boardView === 'flip') return;
    boardView = 'flip';
    boardPage = 0;
    renderBoard();
    playEntrance();
  });
  $('#viewGridBtn').addEventListener('click', () => {
    if (boardView === 'grid') return;
    boardView = 'grid';
    renderBoard();
    playEntrance();
  });
  $('#prevPageBtn').addEventListener('click', () => goPage(boardPage - 1));
  $('#nextPageBtn').addEventListener('click', () => goPage(boardPage + 1));

  $('#speakTestBtn').addEventListener('click', () => {
    voice.say('您好呀！我是岁岁念。以后每天的吃药、打电话、出门，都由我陪您一起记着，点一下我办妥了，亲情小树就会长大一点点。', 0.85);
    toast('正在朗读，声音来自您手机/电脑自带的中文语音');
  });

  $('#plantScene').addEventListener('click', () => {
    const scene = $('#plantScene');
    scene.classList.remove('is-growing');
    void scene.offsetWidth;
    scene.classList.add('is-growing');
    setTimeout(() => scene.classList.remove('is-growing'), 800);
    const i = stageIndex(state.energy);
    const msg = i === STAGES.length - 1
      ? '花园已经硕果累累啦！'
      : `小植物正在努力长大，再攒 ${STAGES[i + 1].at - state.energy} 点就能进入「${STAGES[i + 1].label}」`;
    toast(msg);
  });

  $('#resetBtn').addEventListener('click', () => {
    if (!confirm('会清空本机记录的所有卡片和打卡进度，恢复到 4 条示例卡片，确定吗？')) return;
    state = seedState();
    filter = 'all';
    boardPage = 0;
    lastStage = 0;
    const nowD = new Date();
    calView.y = nowD.getFullYear();
    calView.m = nowD.getMonth();
    save();
    applyTextSize(state.textSize, false);
    applyMode('elder');
    render();
    toast('已恢复示例数据，四大分类卡片都回来了');
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      if (!$('#callOverlay').hidden) endCall();
      else if (!$('#reportOverlay').hidden) closeReport();
      else if (!$('#emergencyOverlay').hidden) closeEmergency();
      return;
    }
    const tag = document.activeElement && document.activeElement.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA') return;
    if (!$('#callOverlay').hidden || !$('#reportOverlay').hidden || !$('#emergencyOverlay').hidden) return;
    if (boardView === 'flip') {
      if (e.key === 'ArrowLeft') goPage(boardPage - 1);
      else if (e.key === 'ArrowRight') goPage(boardPage + 1);
    }
  });

  $('#callOverlay').addEventListener('click', e => { if (e.target === $('#callOverlay')) endCall(); });
  $('#reportOverlay').addEventListener('click', e => { if (e.target === $('#reportOverlay')) closeReport(); });
  $('#emergencyOverlay').addEventListener('click', e => { if (e.target === $('#emergencyOverlay')) closeEmergency(); });

  window.addEventListener('storage', e => {
    if (e.key !== STORE_KEY) return;
    state = loadState();
    lastStage = stageIndex(state.energy);
    render();
    toast('已同步另一端最新打卡动态');
  });

  /* ============ 启动 ============ */

  renderHeader();
  applyTextSize(state.textSize, false);
  applyMode(state.mode);
  render();
  playEntrance();

  setInterval(() => rolloverIfNewDay(true), 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) rolloverIfNewDay(true); });
  window.addEventListener('focus', () => rolloverIfNewDay(true));

  setTimeout(() => {
    toast('欢迎体验岁岁念：点卡片上的「听一听」或「我办妥了」就能感受语音与花园成长');
  }, 700);
})();
