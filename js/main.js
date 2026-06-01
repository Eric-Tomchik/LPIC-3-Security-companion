/* ═══════════════════════════════════════════════════
   LPIC-3 Security 303-300 — Main JS
   ═══════════════════════════════════════════════════ */

// ─── Mobile Nav Toggle ───
document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  if (toggle && links) {
    toggle.addEventListener('click', () => links.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.nav')) links.classList.remove('open');
    });
  }

  // Fade-in observer
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }});
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
});

// ─── Glossary Search ───
function initGlossary() {
  const input = document.getElementById('glossary-search');
  const items = document.querySelectorAll('.glossary-item');
  const count = document.getElementById('glossary-count');
  if (!input) return;
  input.addEventListener('input', () => {
    const q = input.value.toLowerCase();
    let visible = 0;
    items.forEach(item => {
      const term = item.querySelector('.glossary-term').textContent.toLowerCase();
      const def = item.querySelector('.glossary-def').textContent.toLowerCase();
      const show = term.includes(q) || def.includes(q);
      item.style.display = show ? '' : 'none';
      if (show) visible++;
    });
    if (count) count.textContent = `Showing ${visible} of ${items.length} terms`;
  });
}

// ─── Flashcard Engine ───
function initFlashcards(cards) {
  let deck = [...cards];
  let idx = 0;
  const container = document.getElementById('flashcard');
  const progress = document.getElementById('flashcard-progress');
  const catSelect = document.getElementById('flashcard-category');

  function render() {
    if (!container) return;
    const c = deck[idx];
    container.classList.remove('flipped');
    container.querySelector('.flashcard-front h3').textContent = c.term;
    container.querySelector('.flashcard-back p').textContent = c.def;
    if (progress) progress.textContent = `${idx + 1} / ${deck.length}`;
  }

  function filterByCategory() {
    const cat = catSelect ? catSelect.value : 'all';
    deck = cat === 'all' ? [...cards] : cards.filter(c => c.cat === cat);
    idx = 0;
    render();
  }

  window.flipCard = () => container && container.classList.toggle('flipped');
  window.nextCard = () => { idx = (idx + 1) % deck.length; render(); };
  window.prevCard = () => { idx = (idx - 1 + deck.length) % deck.length; render(); };
  window.shuffleDeck = () => {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    idx = 0; render();
  };

  if (catSelect) catSelect.addEventListener('change', filterByCategory);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' || e.key === 'f') { e.preventDefault(); flipCard(); }
    if (e.key === 'ArrowRight' || e.key === 'n') nextCard();
    if (e.key === 'ArrowLeft' || e.key === 'p') prevCard();
    if (e.key === 's') shuffleDeck();
  });

  render();
}

// ─── Quiz Engine ───
function initQuiz(questions) {
  let current = 0;
  let score = 0;
  let answered = 0;
  const container = document.getElementById('quiz-container');
  const progressFill = document.getElementById('quiz-progress-fill');
  const scoreEl = document.getElementById('quiz-score');

  function renderQuestion() {
    if (current >= questions.length) { showResults(); return; }
    const q = questions[current];
    if (progressFill) progressFill.style.width = `${(current / questions.length) * 100}%`;
    if (scoreEl) scoreEl.textContent = `Score: ${score}/${answered}`;

    let html = `<div class="quiz-question"><h3><span class="q-number">Q${current + 1}.</span> ${q.q}</h3>`;

    if (q.type === 'fill') {
      html += `<input type="text" class="quiz-fill-input" id="fill-input" placeholder="Type your answer..." autocomplete="off">`;
      html += `<br><button class="btn btn-primary" onclick="checkFill()" style="margin-top:0.5rem">Submit</button>`;
      html += `<div id="quiz-feedback"></div>`;
    } else {
      html += `<div id="quiz-options">`;
      q.options.forEach((opt, i) => {
        html += `<button class="quiz-option" onclick="checkAnswer(${i})">${opt}</button>`;
      });
      html += `</div><div id="quiz-feedback"></div>`;
    }
    html += `</div>`;
    container.innerHTML = html;

    if (q.type === 'fill') {
      const inp = document.getElementById('fill-input');
      if (inp) { inp.focus(); inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkFill(); }); }
    }
  }

  window.checkAnswer = (i) => {
    const q = questions[current];
    const options = document.querySelectorAll('.quiz-option');
    options.forEach(o => o.classList.add('disabled'));

    answered++;
    if (i === q.correct) {
      score++;
      options[i].classList.add('correct');
    } else {
      options[i].classList.add('incorrect');
      options[q.correct].classList.add('show-correct', 'correct');
    }

    const feedback = document.getElementById('quiz-feedback');
    if (feedback && q.explanation) {
      feedback.innerHTML = `<div class="quiz-explanation">${q.explanation}</div>`;
    }

    setTimeout(() => { current++; renderQuestion(); }, 2000);
  };

  window.checkFill = () => {
    const q = questions[current];
    const inp = document.getElementById('fill-input');
    if (!inp || inp.classList.contains('correct') || inp.classList.contains('incorrect')) return;

    const userAns = inp.value.trim().toLowerCase();
    const correct = Array.isArray(q.answer) ? q.answer.map(a => a.toLowerCase()) : [q.answer.toLowerCase()];

    answered++;
    if (correct.includes(userAns)) {
      score++;
      inp.classList.add('correct');
    } else {
      inp.classList.add('incorrect');
    }

    const feedback = document.getElementById('quiz-feedback');
    if (feedback) {
      const ans = Array.isArray(q.answer) ? q.answer.join(' or ') : q.answer;
      feedback.innerHTML = `<div class="quiz-explanation"><strong>Answer:</strong> <code>${ans}</code>${q.explanation ? '<br>' + q.explanation : ''}</div>`;
    }

    setTimeout(() => { current++; renderQuestion(); }, 2500);
  };

  function showResults() {
    const pct = Math.round((score / questions.length) * 100);
    const pass = pct >= 62; // ~500/800
    container.innerHTML = `
      <div class="quiz-results">
        <h2>Quiz Complete!</h2>
        <div class="score-big ${pass ? 'pass' : 'fail'}">${pct}%</div>
        <p style="font-size:1.1rem;margin-bottom:0.5rem">${score} of ${questions.length} correct</p>
        <p style="color:var(--text-muted);margin-bottom:1.5rem">${pass ? '🎉 You passed! Great job.' : '📚 Keep studying — you\'ll get there!'}</p>
        <p style="font-size:0.85rem;color:var(--text-dim)">Passing threshold: 62% (~500/800 on actual exam)</p>
        <button class="btn btn-primary mt-3" onclick="location.reload()">🔄 Retake Quiz</button>
      </div>`;
    if (progressFill) progressFill.style.width = '100%';
  }

  renderQuestion();
}

// ─── Interactive Terminal ───
function initTerminal(termId, steps) {
  const body = document.getElementById(termId);
  if (!body) return;
  let stepIdx = 0;

  function renderStep() {
    if (stepIdx >= steps.length) {
      const line = document.createElement('div');
      line.innerHTML = '<span class="success">✓ Lab complete! All steps executed successfully.</span>';
      body.appendChild(line);
      const inputLine = body.querySelector('.terminal-input-line');
      if (inputLine) inputLine.remove();
      return;
    }
    // Show input prompt
    let inputLine = body.querySelector('.terminal-input-line');
    if (!inputLine) {
      inputLine = document.createElement('div');
      inputLine.className = 'terminal-input-line';
      inputLine.innerHTML = '<span class="prompt">root@lab:~# </span><input class="terminal-input" type="text" autocomplete="off" spellcheck="false">';
      body.appendChild(inputLine);
    }
    const input = inputLine.querySelector('.terminal-input');
    input.value = '';
    input.focus();

    input.onkeydown = (e) => {
      if (e.key === 'Enter') {
        const cmd = input.value.trim();
        const step = steps[stepIdx];

        // Remove input line
        inputLine.remove();

        // Show command
        const cmdLine = document.createElement('div');
        cmdLine.innerHTML = `<span class="prompt">root@lab:~# </span><span class="command">${escapeHtml(cmd)}</span>`;
        body.appendChild(cmdLine);

        // Check if hint requested
        if (cmd === 'hint' || cmd === 'help') {
          const hint = document.createElement('div');
          hint.innerHTML = `<span class="comment"># Hint: ${escapeHtml(step.hint || step.cmd)}</span>`;
          body.appendChild(hint);
          renderStep();
          body.scrollTop = body.scrollHeight;
          return;
        }

        // Check command
        const accepted = step.accept ? step.accept.includes(cmd) : (cmd === step.cmd);
        if (accepted) {
          // Show output
          if (step.output) {
            step.output.forEach(line => {
              const el = document.createElement('div');
              el.innerHTML = `<span class="output">${line}</span>`;
              body.appendChild(el);
            });
          }
          stepIdx++;
        } else {
          const err = document.createElement('div');
          err.innerHTML = `<span class="error">Command not recognized for this step. Type 'hint' for help.</span>`;
          body.appendChild(err);
        }

        renderStep();
        body.scrollTop = body.scrollHeight;
      }
    };
    body.scrollTop = body.scrollHeight;
  }

  // Initial comment
  if (steps.length > 0 && steps[0].intro) {
    const intro = document.createElement('div');
    intro.innerHTML = `<span class="comment">${escapeHtml(steps[0].intro)}</span>`;
    body.appendChild(intro);
  }
  renderStep();
}

function escapeHtml(text) {
  const d = document.createElement('div');
  d.textContent = text;
  return d.innerHTML;
}

// ─── Lab Toggle ───
function toggleLab(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle('open');
}
