'use strict';

// 家人手记与备忘卡片共用本机数据和长辈 / 子女视角。
function createFamilyJournal({ getState, updateStoredState, save, todayKey, uid, el, toast, hasExampleEmergency }) {
  const byId = id => document.getElementById(id);
  const profile = byId('profileForm');
  const letters = byId('letterForm');
  const wishes = byId('wishForm');
  const popup = byId('letterPopup');
  const titles = { once: '家人给您的悄悄话', daily: '今天的悄悄话', birthday: '生日快乐！', festival: '节日快乐！' };
  const scheduleNames = { once: '下次打开', daily: '每天一次', birthday: '每年生日' };
  let showing = null;
  let beforeEdit = null;

  // 2 月 29 日的生日在平年按 2 月 28 日庆祝，周岁也使用同一日期。
  function anniversary(birthday, today) {
    const year = Number(today.slice(0, 4));
    const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
    const monthDay = birthday.slice(5);
    return today.slice(0, 4) + '-' + (monthDay === '02-29' && !leap ? '02-28' : monthDay);
  }

  function profileData() {
    const state = getState();
    return {
      birthday: state.profile.birthday || '',
      diet: state.profile.diet || '',
      history: hasExampleEmergency() ? '' : state.emergency.history || ''
    };
  }

  function renderProfile() {
    const { birthday, diet, history } = profileData();
    const today = todayKey();
    let age = '填写生日后显示';
    if (birthday) {
      const years = Number(today.slice(0, 4)) - Number(birthday.slice(0, 4));
      age = (today < anniversary(birthday, today) ? years - 1 : years) + ' 周岁';
    }
    const facts = byId('profileFacts');
    facts.replaceChildren();
    for (const [label, value] of [
      ['公历生日', birthday], ['年龄', age],
      ['饮食忌口', diet], ['药物过敏史与既往情况', history]
    ]) {
      facts.append(el('dt', null, label), el('dd', null, value || '未填写'));
    }
    profile.elements.birthday.max = today;
  }

  function editProfile(edit) {
    beforeEdit = edit ? profileData() : null;
    byId('profileFacts').hidden = edit;
    byId('profileEdit').hidden = edit;
    profile.hidden = !edit;
    if (edit) {
      for (const [key, value] of Object.entries(beforeEdit)) profile.elements[key].value = value;
      profile.elements.birthday.focus();
    } else {
      byId('profileEdit').focus();
    }
  }

  byId('profileEdit').onclick = () => editProfile(true);
  byId('profileCancel').onclick = () => editProfile(false);
  profile.onsubmit = event => {
    event.preventDefault();
    updateStoredState(() => {
      if (!beforeEdit) return;
      const state = getState();
      for (const key of ['birthday', 'diet', 'history']) {
        const value = profile.elements[key].value.trim();
        if (value === beforeEdit[key]) continue;
        if (key === 'history') {
          if (hasExampleEmergency()) state.emergency = {};
          state.emergency.history = value;
        } else state.profile[key] = value;
      }
      save();
      editProfile(false);
      render();
      toast('长辈资料已保存');
    });
  };

  function syncOccasion() {
    const kind = letters.elements.occasion.value;
    const date = letters.elements.festivalDate;
    byId('festivalField').hidden = kind !== 'festival';
    date.disabled = kind !== 'festival';
    date.required = !date.disabled;
    date.min = todayKey();
    byId('letterHint').textContent = kind === 'birthday'
      ? birthdayHint()
      : '留言会在这台设备的长辈视角弹出。';
  }

  function birthdayHint() {
    const birthday = getState().profile.birthday;
    if (!birthday) return '请先在长辈资料里填写公历生日。';
    if (birthday.endsWith('02-29')) return '2 月 29 日的生日，在平年 2 月 28 日送上祝福。';
    return '按长辈资料里的公历生日送达。';
  }

  function requireText(input) {
    input.setCustomValidity(input.value.trim() ? '' : '请先写一点内容');
    return input.reportValidity();
  }
  for (const input of [letters.elements.message, wishes.elements.wish]) {
    input.oninput = () => input.setCustomValidity('');
  }
  letters.elements.occasion.onchange = syncOccasion;
  letters.onsubmit = event => {
    event.preventDefault();
    updateStoredState(() => {
      const state = getState();
      if (state.mode !== 'child' || !requireText(letters.elements.message)) return;
      const kind = letters.elements.occasion.value;
      if (kind === 'birthday' && !state.profile.birthday) {
        byId('familyProfile').open = true;
        if (!beforeEdit) editProfile(true);
        profile.elements.birthday.focus();
        toast('先填好生日，再回来保存这句祝福');
        return;
      }
      state.letters.unshift({
        id: uid(), body: letters.elements.message.value.trim(), kind,
        date: kind === 'festival' ? letters.elements.festivalDate.value : '', lastShown: ''
      });
      save();
      letters.reset();
      render();
      toast('悄悄话已保存');
    });
  };

  function isDue(note, today) {
    switch (note.kind) {
      case 'once': return !note.lastShown;
      case 'daily': return note.lastShown !== today;
      case 'festival': return note.date === today && note.lastShown !== today;
      case 'birthday': {
        const birthday = getState().profile.birthday;
        return birthday && anniversary(birthday, today) === today && note.lastShown !== today;
      }
      default: return false;
    }
  }

  function closePopup() {
    showing = null;
    popup.hidden = true;
  }

  function nextLetter(today) {
    if (showing || document.hidden || getState().mode !== 'elder'
        || document.querySelector('dialog[open], .overlay:not([hidden])')
        || document.activeElement?.matches('input, textarea, select')) return;
    const due = getState().letters.filter(item => isDue(item, today));
    return due.find(item => item.kind === 'birthday') || due.find(item => item.kind === 'festival') || due[0];
  }

  function offerLetter() {
    const state = getState();
    if (showing && (state.mode !== 'elder' || showing.day !== todayKey()
        || !state.letters.some(note => note.id === showing.id))) closePopup();
    if (!nextLetter(todayKey())) return;
    return updateStoredState(() => {
      const today = todayKey();
      const note = nextLetter(today);
      if (!note) return;
      showing = { id: note.id, day: today };
      byId('letterPopupTitle').textContent = titles[note.kind];
      byId('letterPopupText').textContent = note.body;
      popup.hidden = false;
      note.lastShown = today;
      save();
      renderLetters();
    });
  }

  byId('letterRead').onclick = async () => {
    closePopup();
    await offerLetter();
    if (popup.hidden) byId('familyLetters').querySelector('summary').focus({ preventScroll: true });
    else byId('letterRead').focus({ preventScroll: true });
  };

  function renderLetters() {
    const state = getState();
    const child = state.mode === 'child';
    const list = byId('letterList');
    const today = todayKey();
    const notes = state.letters.filter(note => child || note.lastShown || (note.kind === 'festival' && note.date <= today));
    letters.hidden = !child;
    byId('letterListTitle').textContent = child ? '写给长辈的留言' : '收到的留言';
    byId('letterEmpty').hidden = notes.length > 0;
    byId('letterEmpty').textContent = child ? '还没有给长辈写留言。' : '收到的悄悄话会留在这里，随时可以再读。';
    list.replaceChildren();
    for (const note of notes) {
      const row = el('li');
      const label = child ? (note.kind === 'festival' ? note.date + ' · 节日' : scheduleNames[note.kind])
        : (note.lastShown || note.date) + ' · ' + titles[note.kind];
      row.append(el('small', null, label), el('p', null, note.body));
      if (child) {
        const remove = el('button', 'family-text-btn', '删除留言');
        remove.type = 'button';
        remove.onclick = () => {
          if (!confirm('删除这条留言？两个视角都会移除。')) return;
          updateStoredState(() => {
            const latest = getState();
            latest.letters = latest.letters.filter(item => item.id !== note.id);
            save();
            render();
            letters.elements.message.focus();
          });
        };
        row.append(remove);
      }
      list.append(row);
    }
    syncOccasion();
  }

  wishes.onsubmit = event => {
    event.preventDefault();
    updateStoredState(() => {
      if (!requireText(wishes.elements.wish)) return;
      getState().wishes.unshift({ id: uid(), body: wishes.elements.wish.value.trim(), fulfilled: '' });
      save();
      wishes.reset();
      renderWishes();
      toast('愿望已记下');
    });
  };

  function renderWishes() {
    const list = byId('wishList');
    const entries = getState().wishes;
    list.replaceChildren();
    byId('wishEmpty').hidden = entries.length > 0;
    for (const wish of entries) {
      const row = el('li', 'wish-row');
      const label = el('label');
      const check = el('input');
      check.type = 'checkbox';
      check.checked = Boolean(wish.fulfilled);
      const status = el('small');
      const statusText = date => date ? date + ' 已实现' : '待实现';
      status.textContent = statusText(wish.fulfilled);
      check.onchange = () => {
        const fulfilled = check.checked ? todayKey() : '';
        updateStoredState(() => {
          const current = getState().wishes.find(item => item.id === wish.id);
          if (!current) { renderWishes(); return; }
          current.fulfilled = fulfilled;
          save();
          status.textContent = statusText(fulfilled);
        });
      };
      label.append(check, el('span', null, wish.body));
      const remove = el('button', 'family-text-btn', '移除愿望');
      remove.type = 'button';
      remove.onclick = () => {
        if (!confirm('从家人的愿望清单中移除这条愿望？')) return;
        updateStoredState(() => {
          const state = getState();
          state.wishes = state.wishes.filter(item => item.id !== wish.id);
          save();
          renderWishes();
          wishes.elements.wish.focus();
        });
      };
      row.append(label, status, remove);
      list.append(row);
    }
  }

  function render() {
    renderProfile();
    renderLetters();
    renderWishes();
    offerLetter();
  }
  document.addEventListener('visibilitychange', offerLetter);
  window.addEventListener('focus', offerLetter);
  document.addEventListener('focusout', () => setTimeout(offerLetter, 0));
  document.addEventListener('close', () => setTimeout(offerLetter, 0), true);
  function resetForms() {
    closePopup();
    beforeEdit = null;
    profile.reset();
    letters.reset();
    wishes.reset();
    profile.hidden = true;
    byId('profileFacts').hidden = false;
    byId('profileEdit').hidden = false;
    for (const details of document.querySelectorAll('.family-groups details')) details.open = false;
  }
  return { render, offerLetter, resetForms };
}
