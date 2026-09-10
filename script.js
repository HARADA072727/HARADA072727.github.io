(() => {
  'use strict';
  const CONFIG_KEY = 'matome-kobo-config-v2', WORKS_KEY = 'matome-kobo-works-v2', NAME_KEY = 'matome-kobo-current-name-v2', TEACHER_KEY = 'matome-kobo-teacher-unlocked-v2';
  const TEACHER_PASSWORD = '1234'; 
  const defaults = { title: '説明文を 要約しよう', target: 100, passage: '伝統工芸品は、長い年月をかけて受け継がれてきた品物です。作る人は、昔からの技術を大切にしながら、今のくらしに合うように工夫しています。形や使い方は変化しても、手仕事ならではの美しさや温かさが魅力です。', cards: '伝統工芸品, 昔からの技術, 受け継ぐ, 今のくらし, 工夫する, 変化する, 手仕事, 魅力' };
  const app = document.getElementById('app'), toast = document.getElementById('toast');
  let config = readConfig(), view = 'student', studentName = sessionStorage.getItem(NAME_KEY) || '', teacherUnlocked = sessionStorage.getItem(TEACHER_KEY) === 'yes', activeMode = null, modeState = {}, toastTimer;

  function readConfig() { try { return { ...defaults, ...JSON.parse(localStorage.getItem(CONFIG_KEY) || '{}') }; } catch { return { ...defaults }; } }
  function readWorks() { try { const works = JSON.parse(localStorage.getItem(WORKS_KEY) || '[]'); return Array.isArray(works) ? works : []; } catch { return []; } }
  function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char])); }
  function notify(message) { toast.textContent = message; toast.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('show'), 2600); }
  function countCharacters(value) { return [...String(value).replace(/\s/g, '')].length; }
  function counter(value) { const amount = countCharacters(value); return `<span class="counter ${amount > Number(config.target) ? 'over' : ''}">目標 ${config.target}文字 ／ いま ${amount}文字</span>`; }

  function changeView(next, options = {}) { 
    view = next; 
    if (options.mode) activeMode = options.mode; 
    const hash = next === 'learn' ? `learn-${activeMode}` : next; 
    if (location.hash.slice(1) !== hash) history.replaceState(null, '', `#${hash}`); 
    render(); 
    window.scrollTo({ top: 0, behavior: 'smooth' }); 
  }

  function updateNav() { 
    const navView = view === 'learn' ? 'student' : view; 
    document.querySelectorAll('[data-nav]').forEach(button => button.classList.toggle('active', button.dataset.nav === navView)); 
  }

  function renderTeacherGate() {
    app.innerHTML = `<section class="screen panel password-card"><div class="lock-illustration">⌘</div><p class="eyebrow">先生のページ</p><h1>合言葉を<br>入れてください</h1><p class="lead">児童のみなさんは「学習する」から始めましょう。</p><label for="teacher-password">先生用の合言葉</label><input id="teacher-password" type="password" inputmode="numeric" autocomplete="current-password" placeholder="4けたの数字" /><p id="password-error" class="password-error" aria-live="assertive"></p><button class="button" id="unlock-teacher">設定画面をひらく</button></section>`;
    const password = document.getElementById('teacher-password'); 
    const unlock = () => { 
      if (password.value === TEACHER_PASSWORD) { 
        teacherUnlocked = true; 
        sessionStorage.setItem(TEACHER_KEY, 'yes'); 
        render(); 
        notify('先生の設定画面をひらきました'); 
      } else { 
        document.getElementById('password-error').textContent = '合言葉がちがいます。もう一度ためしてね。'; 
        password.select(); 
      } 
    };
    document.getElementById('unlock-teacher').addEventListener('click', unlock); 
    password.addEventListener('keydown', event => { if (event.key === 'Enter') unlock(); }); 
    password.focus();
  }

  function renderTeacher() {
    if (!teacherUnlocked) { renderTeacherGate(); return; }
    app.innerHTML = `<section class="screen"><div class="intro"><p class="eyebrow">先生のじゅんび</p><h1>授業の材料を<br>入れましょう</h1><p class="lead">保存すると、児童の画面にすぐ反映されます。</p></div><form class="panel" id="teacher-form"><div class="settings-grid"><label>授業のタイトル<input id="lesson-title" type="text" maxlength="60" value="${escapeHtml(config.title)}" placeholder="例：説明文を要約しよう" /></label><label>目標文字数<input id="target-count" class="compact-input" type="number" min="1" max="1000" value="${Number(config.target)}" /> <span class="field-help">文字</span></label><label>要約する本文<p class="field-help">児童が削り取りモードで使う文章です。</p><textarea id="passage" placeholder="ここに本文を入力します。">${escapeHtml(config.passage)}</textarea></label><label>ならべかえ用のことばカード<p class="field-help">カードにしたいことばを、カンマ（, または 、）で区切ります。</p><input id="cards" type="text" value="${escapeHtml(config.cards)}" placeholder="例：伝統工芸品, 受け継ぐ, 魅力" /></label></div><div class="settings-actions"><span class="save-note" id="save-note">保存しました ✓</span><button class="button secondary" type="button" id="lock-teacher">設定をとじる</button><button class="button" type="submit">設定を保存する</button></div></form></section>`;
    document.getElementById('teacher-form').addEventListener('submit', event => { 
      event.preventDefault(); 
      config = { 
        title: document.getElementById('lesson-title').value.trim() || defaults.title, 
        target: Math.max(1, Number(document.getElementById('target-count').value) || defaults.target), 
        passage: document.getElementById('passage').value.trim(), 
        cards: document.getElementById('cards').value.trim() 
      }; 
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config)); 
      document.getElementById('save-note').classList.add('show'); 
      notify('設定を保存しました'); 
    });
    document.getElementById('lock-teacher').addEventListener('click', () => { 
      teacherUnlocked = false; 
      sessionStorage.removeItem(TEACHER_KEY); 
      changeView('student'); 
    });
  }

  function renderStudent() {
    app.innerHTML = `<section class="screen student-welcome"><p class="eyebrow">要約にチャレンジ</p><h1>${escapeHtml(config.title)}</h1><p class="subtitle">自分に合ったやり方をえらんで、文章の大事なところをまとめよう。</p><div class="name-row"><label for="student-name">なまえ</label><input id="student-name" type="text" maxlength="20" value="${escapeHtml(studentName)}" placeholder="なまえを入力してね" autocomplete="name" /></div><div class="mode-grid"><button class="mode-choice" data-mode="cards"><span class="mode-icon">▥</span><h3>カードならべかえ</h3><p>大事なことばを、すきなじゅんばんに並べてみよう。</p></button><button class="mode-choice" data-mode="trim"><span class="mode-icon">✂</span><h3>いらない言葉をけす</h3><p>本文からいらないところをけして、文を整えよう。</p></button><button class="mode-choice" data-mode="write"><span class="mode-icon">✎</span><h3>げんこう用紙に書く</h3><p>自分のことばで、はじめから要約を書いてみよう。</p></button></div></section>`;
    const nameInput = document.getElementById('student-name'), retainName = () => { studentName = nameInput.value.trim(); sessionStorage.setItem(NAME_KEY, studentName); };
    nameInput.addEventListener('input', retainName); 
    document.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => { 
      retainName(); 
      if (!studentName) { nameInput.focus(); notify('なまえを入れてから、えらぼう'); return; } 
      startNewMode(button.dataset.mode); 
      changeView('learn', { mode: button.dataset.mode }); 
    }));
  }

  function parseCards() { return config.cards.split(/[,、\n]/).map(value => value.trim()).filter(Boolean); }

  function startNewMode(mode) { 
    activeMode = mode; 
    if (mode === 'cards') modeState = { choices: parseCards().map((text, index) => ({ id: `choice-${Date.now()}-${index}`, text })), selected: [], addText: '' }; 
    if (mode === 'trim') modeState = { removed: new Set(), history: [], step: 1, editorText: '' }; 
    if (mode === 'write') modeState = { editorText: '' }; 
  }

  function learningShell(title, subtitle, content) { 
    return `<section class="screen"><div class="learning-head"><div><p class="eyebrow">${escapeHtml(config.title)}</p><h1>${title}</h1><p class="lead">${subtitle}</p></div><div class="person-chip">${escapeHtml(studentName)} さん</div></div><section class="panel learning-panel">${content}</section></section>`; 
  }

  function renderCards() {
    const choices = modeState.choices || [], selected = modeState.selected || [];
    const cardMarkup = (cards, zone) => cards.map(card => `<article class="word-card" data-card-id="${card.id}" data-card-zone="${zone}" aria-label="${escapeHtml(card.text)}。長くおして動かせます。">${escapeHtml(card.text)}</article>`).join('');
    const content = `<div class="panel-title"><h2>ことばをえらんで、ならべよう</h2>${counter(selected.map(card => card.text).join(''))}</div><p class="instruction">必要なカードだけを右の作成エリアへ動かそう。作成エリアの中でも順番をかえられます。</p><div id="card-workspace" class="card-workspace"><section class="card-zone"><h3 class="zone-title">選択肢カード置き場 <small>いらない言葉もあるよ</small></h3><div class="card-list ${choices.length ? '' : 'empty'}" id="choice-list" data-card-zone="choices" aria-label="選択肢カード置き場">${cardMarkup(choices, 'choices')}</div></section><section class="card-zone canvas-zone"><h3 class="zone-title">作成エリア <small>ここに要約を組み立てよう</small></h3><div class="card-list canvas-list ${selected.length ? '' : 'empty'}" id="canvas-list" data-card-zone="selected" aria-label="要約を作るエリア">${cardMarkup(selected, 'selected')}</div></section></div><div class="add-card"><label>つなぎのことばを足す<input id="add-card-input" type="text" maxlength="35" placeholder="例：だから、しかし" value="${escapeHtml(modeState.addText || '')}" /></label><button class="button warm" id="add-card-button">作成エリアに足す</button></div><div class="submit-area"><button class="button secondary change-mode" data-change-mode>やり方をかえる</button><button class="button" id="submit-work">提出する</button></div>`;
    app.innerHTML = learningShell('カードならべかえ', '大事なことばをえらび、伝わりやすい順番にしてみよう。', content); 
    setupCardInteractions(); 
    bindLearningActions();
  }

  function addCard() { 
    const field = document.getElementById('add-card-input'), text = field.value.trim(); 
    if (!text) { field.focus(); notify('足したいことばを書いてね'); return; } 
    modeState.selected.push({ id: `added-${Date.now()}-${Math.random()}`, text }); 
    modeState.addText = ''; 
    renderCards(); 
    notify('作成エリアに新しいカードを足しました'); 
  }

  function setupCardInteractions() {
    const workspace = document.getElementById('card-workspace'); 
    if (!workspace) return;
    document.getElementById('add-card-input').addEventListener('input', event => { modeState.addText = event.target.value; }); 
    document.getElementById('add-card-input').addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); addCard(); } }); 
    document.getElementById('add-card-button').addEventListener('click', addCard);

    workspace.addEventListener('pointerdown', event => {
      const card = event.target.closest('.word-card'); 
      if (!card) return; 
      const originZone = card.dataset.cardZone, cardId = card.dataset.cardId, originCards = modeState[originZone], cardData = originCards?.find(item => item.id === cardId); 
      if (!cardData) return;

      event.preventDefault(); 
      const ghost = document.createElement('div'); 
      ghost.className = 'drag-ghost'; 
      ghost.textContent = cardData.text; 
      document.body.appendChild(ghost); 
      card.classList.add('drag-origin'); 

      const moveGhost = pointerEvent => { ghost.style.left = `${pointerEvent.clientX}px`; ghost.style.top = `${pointerEvent.clientY}px`; }; 
      moveGhost(event);

      const finish = finishEvent => { 
        window.removeEventListener('pointermove', move); 
        window.removeEventListener('pointerup', finish); 
        window.removeEventListener('pointercancel', finish); 
        ghost.remove(); 
        card.classList.remove('drag-origin'); 
        const hit = document.elementFromPoint(finishEvent.clientX, finishEvent.clientY), target = hit?.closest('.word-card'), destinationZone = target?.dataset.cardZone || hit?.closest('[data-card-zone]')?.dataset.cardZone; 
        if (!destinationZone || !modeState[destinationZone]) return; 
        if (target?.dataset.cardId === cardId && destinationZone === originZone) return; 
        const sourceIndex = modeState[originZone].findIndex(item => item.id === cardId); 
        if (sourceIndex < 0) return; 
        let insertAt; 
        if (target) { 
          const targetIndex = modeState[destinationZone].findIndex(item => item.id === target.dataset.cardId); 
          if (targetIndex < 0) return; 
          const box = target.getBoundingClientRect(); 
          insertAt = targetIndex + (finishEvent.clientX > box.left + box.width / 2 ? 1 : 0); 
        } else { 
          insertAt = modeState[destinationZone].length; 
        } 
        const [moved] = modeState[originZone].splice(sourceIndex, 1); 
        if (originZone === destinationZone && sourceIndex < insertAt) insertAt -= 1; 
        modeState[destinationZone].splice(insertAt, 0, moved); 
        renderCards(); 
      };

      const move = moveEvent => { if (moveEvent.pointerId === event.pointerId) { moveEvent.preventDefault(); moveGhost(moveEvent); } }; 
      window.addEventListener('pointermove', move, { passive: false }); 
      window.addEventListener('pointerup', finish, { once: true }); 
      window.addEventListener('pointercancel', finish, { once: true });
    });
  }

  function textCharacters() { return [...config.passage]; }

  function renderTrim() {
    const removed = modeState.removed || new Set(); 
    let content;
    if (modeState.step === 1) { 
      const original = textCharacters(), remains = original.filter((_, index) => !removed.has(index)).join(''), visible = original.map((character, index) => { const shown = character === '\n' ? '↵' : character === ' ' ? ' ' : escapeHtml(character); return `<span class="trim-char ${removed.has(index) ? 'removed' : ''}${/\s/.test(character) ? 'is-space' : ''}" data-char-index="${index}">${shown}</span>`; }).join(''); 
      content = `<div class="trim-toolbar"><span class="step-badge">ステップ 1 ／ 2 けずる</span>${counter(remains)}<button class="button secondary" id="undo-trim" ${modeState.history.length ? '' : 'disabled'}>1つ もどす</button><button class="button warm trim-next" id="make-summary">これで まとめる →</button></div><p class="instruction">いらない文字を、指でタップしたり なぞったりしてけそう。赤い線がついたところは、まとめると消えます。</p><div id="trim-paper" class="trim-paper" aria-label="けずる本文">${visible || '<span>先生が本文を設定していません。</span>'}</div><div class="submit-area"><button class="button secondary change-mode" data-change-mode>やり方をかえる</button><button class="button" id="submit-work">提出する</button></div>`; 
    } else { 
      content = `<div class="trim-toolbar"><span class="step-badge">ステップ 2 ／ 2 整える</span>${counter(modeState.editorText \vert{}\vert{} '')}</div><p class="instruction">残った文を、読みやすく整えよう。つなぎのことばや、文の終わりを足してもいいよ。</p><textarea id="summary-editor" class="manuscript" aria-label="要約を書く原稿用紙" placeholder="ここにまとめを書こう">${escapeHtml(modeState.editorText || '')}</textarea><p class="editor-help">マス目は、1文字ずつの場所です。言いたいことが短く分かりやすく伝わるように書いてみよう。</p><div class="submit-area"><button class="button secondary back-step" id="back-to-trim">← けずる画面にもどる</button><button class="button" id="submit-work">提出する</button></div>`; 
    }
    app.innerHTML = learningShell('いらない言葉を けす', 'けずってから、つなぎのことばを足して読みやすくしよう。', content); 
    setupTrimInteractions(); 
    bindLearningActions();
  }

  function setupTrimInteractions() {
    if (modeState.step === 1) {
      const paper = document.getElementById('trim-paper');
      if (!paper) return;
      let activeAction = null, currentIndices = [];
      
      const toggleChar = (index, targetState) => {
        const isRemoved = modeState.removed.has(index);
        if ((targetState === 'remove' && !isRemoved) || (targetState === 'restore' && isRemoved)) {
          if (targetState === 'remove') modeState.removed.add(index); else modeState.removed.delete(index);
          currentIndices.push(index);
        }
      };

      paper.addEventListener('pointerdown', event => {
        const charSpan = event.target.closest('.trim-char');
        if (!charSpan) return;
        event.preventDefault();
        const index = Number(charSpan.dataset.charIndex);
        activeAction = modeState.removed.has(index) ? 'restore' : 'remove';
        currentIndices = [];
        toggleChar(index, activeAction);
        renderTrim();
      });

      document.getElementById('undo-trim')?.addEventListener('click', () => {
        if (!modeState.history.length) return;
        modeState.removed = modeState.history.pop();
        renderTrim();
      });

      document.getElementById('make-summary')?.addEventListener('click', () => {
        const original = textCharacters();
        modeState.editorText = original.filter((_, index) => !modeState.removed.has(index)).join('');
        modeState.step = 2;
        renderTrim();
      });
    } else {
      const editor = document.getElementById('summary-editor');
      editor?.addEventListener('input', () => {
        modeState.editorText = editor.value;
        const counterEl = document.querySelector('.counter');
        if (counterEl) {
          counterEl.outerHTML = counter(editor.value);
        }
      });
      document.getElementById('back-to-trim')?.addEventListener('click', () => {
        modeState.step = 1;
        renderTrim();
      });
    }
  }

  function renderWrite() {
    const content = `<div class="panel-title"><h2>自分の言葉で 書いてみよう</h2>${counter(modeState.editorText \vert{}\vert{} '')}</div><p class="instruction">本文の大事なところを思い出して、自分の言葉で要約を書いてみよう。</p><textarea id="write-editor" class="manuscript" aria-label="要約を書く原稿用紙" placeholder="ここにまとめを書こう">${escapeHtml(modeState.editorText || '')}</textarea><p class="editor-help">マス目は、1文字ずつの場所です。</p><div class="submit-area"><button class="button secondary change-mode" data-change-mode>やり方をかえる</button><button class="button" id="submit-work">提出する</button></div>`;
    app.innerHTML = learningShell('げんこう用紙に書く', 'はじめから自分の手で文章を組み立ててみよう。', content);
    const editor = document.getElementById('write-editor');
    editor?.addEventListener('input', () => {
      modeState.editorText = editor.value;
      const counterEl = document.querySelector('.counter');
      if (counterEl) counterEl.outerHTML = counter(editor.value);
    });
    bindLearningActions();
  }

  function bindLearningActions() {
    document.querySelectorAll('[data-change-mode]').forEach(btn => btn.addEventListener('click', () => changeView('student')));
    document.getElementById('submit-work')?.addEventListener('click', submitWork);
  }

  function getSummaryText() {
    if (activeMode === 'cards') return (modeState.selected || []).map(card => card.text).join(' ');
    if (activeMode === 'trim') return modeState.step === 2 ? modeState.editorText : textCharacters().filter((_, i) => !modeState.removed.has(i)).join('');
    if (activeMode === 'write') return modeState.editorText || '';
    return '';
  }

  function submitWork() {
    const text = getSummaryText().trim();
    if (!text) { notify('文章を作成してから提出してね'); return; }
    const works = readWorks();
    const modeLabel = { cards: 'カードならべかえ', trim: 'いらない言葉をけす', write: 'げんこう用紙に書く' }[activeMode];
    works.unshift({ id: `work-${Date.now()}`, name: studentName, mode: modeLabel, text, timestamp: new Date().toLocaleDateString('ja-JP') });
    localStorage.setItem(WORKS_KEY, JSON.stringify(works));
    notify('作品を提出しました！');
    changeView('board');
  }

  function renderBoard() {
    const works = readWorks();
    const gallery = works.length ? works.map(work => `<article class="submission-card" tabindex="0" data-work-id="${work.id}"><div class="submission-meta"><span>${escapeHtml(work.name)} さん</span><span class="submission-mode">${escapeHtml(work.mode)}</span></div><div class="submission-text">${escapeHtml(work.text)}</div></article>`).join('') : '<div class="empty-board">まだ提出された作品はありません。</div>';
    app.innerHTML = `<section class="screen"><div class="board-head"><div><p class="eyebrow">${escapeHtml(config.title)}</p><h1>みんなの作品</h1><p>友達が作ったまとめを読んでみよう。</p></div></div><div class="work-gallery">${gallery}</div></section>`;
    
    document.querySelectorAll('.submission-card').forEach(card => card.addEventListener('click', () => {
      const item = works.find(w => w.id === card.dataset.workId);
      if (item) showWorkModal(item);
    }));
  }

  function showWorkModal(item) {
    const modal = document.createElement('div');
    modal.className = 'modal-backdrop';
    modal.innerHTML = `<div class="work-modal"><div class="modal-head"><h2>${escapeHtml(item.name)} さんの作品</h2><button class="close-modal" id="close-modal">&times;</button></div><div class="modal-work">${escapeHtml(item.text)}</div><div class="modal-actions"><button class="button secondary" id="close-modal-btn">とじる</button></div></div>`;
    document.body.appendChild(modal);
    const close = () => modal.remove();
    modal.querySelector('#close-modal').addEventListener('click', close);
    modal.querySelector('#close-modal-btn').addEventListener('click', close);
  }

  function render() {
    updateNav();
    if (view === 'teacher') renderTeacher();
    else if (view === 'student') renderStudent();
    else if (view === 'board') renderBoard();
    else if (view === 'learn') {
      if (activeMode === 'cards') renderCards();
      else if (activeMode === 'trim') renderTrim();
      else if (activeMode === 'write') renderWrite();
    }
  }

  document.querySelectorAll('[data-nav]').forEach(button => button.addEventListener('click', () => changeView(button.dataset.nav)));
  
  const initialHash = location.hash.slice(1);
  if (initialHash.startsWith('learn-')) {
    const mode = initialHash.replace('learn-', '');
    if (['cards', 'trim', 'write'].includes(mode)) { startNewMode(mode); changeView('learn', { mode }); }
    else changeView('student');
  } else if (['teacher', 'student', 'board'].includes(initialHash)) {
    changeView(initialHash);
  } else {
    changeView('student');
  }
})();
