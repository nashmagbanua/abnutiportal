// ============================================================
// ABN QUIZ MAKER MODULE v2
// Fixed: auth bug, nav index, public link, question editor,
//        scoring, area tags, real question/response counts
// ============================================================

// ─── AUTH HELPER ────────────────────────────────────────────
function getQuizUser() {
    return {
        code : localStorage.getItem('userCode')  || null,
        name : localStorage.getItem('userName')  || 'Unknown',
        role : localStorage.getItem('userRole')  || 'operator',
    };
}

// ─── TOAST ──────────────────────────────────────────────────
function showToast(msg, type = 'info', duration = 3500) {
    const icons = { success:'fa-check-circle', error:'fa-times-circle',
                    info:'fa-info-circle', warning:'fa-exclamation-triangle' };
    const c = document.getElementById('toast-container');
    if (!c) return;
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.innerHTML = `<i class="fas ${icons[type]}"></i><span>${msg}</span>`;
    c.appendChild(t);
    setTimeout(() => {
        t.style.animation = 'toastFadeOut 0.3s ease forwards';
        setTimeout(() => t.remove(), 300);
    }, duration);
}

// ─── QUIZ LIST ───────────────────────────────────────────────
async function loadQuizMaker() {
    updateSidebarActive(1);
    const content = document.getElementById('cont');
    const u = getQuizUser();

    if (!u.code) {
        content.innerHTML = `
          <div style="padding:40px;text-align:center;">
            <i class="fas fa-lock" style="font-size:3rem;color:#e53e3e;margin-bottom:15px;"></i>
            <p style="color:var(--text-sub);">Hindi mahanap ang session. Mag-login muna.</p>
          </div>`;
        return;
    }

    content.innerHTML = `
      <div style="padding:20px;text-align:center;color:var(--text-sub);">
        <i class="fas fa-spinner fa-spin" style="font-size:2rem;"></i>
        <p style="margin-top:10px;">Loading quizzes...</p>
      </div>`;

    try {
        const { data: quizzes, error } = await supabaseClient
            .from('quizzes')
            .select('*, quiz_questions(count), quiz_attempts(count)')
            .eq('created_by', u.code)
            .order('created_at', { ascending: false });

        if (error) throw error;
        renderQuizList(quizzes || []);
    } catch (err) {
        content.innerHTML = `
          <div style="padding:20px;color:#e53e3e;background:rgba(245,101,101,0.1);
                      border-radius:8px;margin:20px;">
            <i class="fas fa-exclamation-circle"></i> ${err.message}
          </div>`;
        console.error('Quiz Maker Error:', err);
    }
}

function renderQuizList(quizzes) {
    const content = document.getElementById('cont');
    const areaColors = {
        'Boiler':'#ed8936','WTP':'#4299e1','Ref':'#9f7aea',
        'CDA':'#38b2ac','WWTP':'#667eea','General':'#48bb78'
    };
    const base = window.location.href.replace(/\/[^/]*$/, '');

    content.innerHTML = `
      <div style="padding:20px;animation:slideDown 0.3s ease;">
        <div style="display:flex;justify-content:space-between;align-items:center;
                    margin-bottom:28px;flex-wrap:wrap;gap:15px;">
          <div>
            <h2 style="margin:0;color:var(--text-main);font-size:1.5rem;
                       display:flex;align-items:center;gap:12px;">
              <i class="fas fa-poll" style="color:var(--accent);"></i>Quiz Maker
            </h2>
            <p style="margin:5px 0 0;color:var(--text-sub);font-size:0.9rem;">
              Create and manage exams for your team
            </p>
          </div>
          <button onclick="showNewQuizModal()"
            style="background:var(--accent);color:white;border:none;
                   padding:12px 24px;border-radius:8px;font-weight:600;
                   cursor:pointer;display:flex;align-items:center;gap:8px;">
            <i class="fas fa-plus"></i> New Quiz
          </button>
        </div>

        ${quizzes.length === 0 ? `
          <div style="text-align:center;padding:60px 20px;
                      background:var(--bg-card);border:1px solid var(--border-color);
                      border-radius:12px;">
            <i class="fas fa-inbox" style="font-size:3rem;color:var(--text-sub);
                                           opacity:0.4;margin-bottom:15px;"></i>
            <p style="color:var(--text-sub);font-size:1rem;">
              No quizzes yet. Create your first quiz!
            </p>
          </div>
        ` : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:15px;">
            ${quizzes.map(q => {
                const qCount = q.quiz_questions?.[0]?.count ?? 0;
                const rCount = q.quiz_attempts?.[0]?.count ?? 0;
                const area   = q.quiz_area || 'General';
                const aColor = areaColors[area] || '#48bb78';
                const pubLink = `${base}/public-quiz.html?slug=${q.public_slug}`;
                return `
                  <div style="background:var(--bg-card);border:1px solid var(--border-color);
                               border-radius:12px;padding:20px;transition:0.2s;cursor:pointer;
                               position:relative;overflow:hidden;"
                       onclick="editQuiz('${q.id}')"
                       onmouseover="this.style.borderColor='var(--accent)'"
                       onmouseout="this.style.borderColor='var(--border-color)'">
                    <div style="position:absolute;top:0;left:0;width:4px;height:100%;
                                background:${aColor};"></div>
                    <div style="padding-left:8px;">
                      <div style="display:flex;justify-content:space-between;
                                  align-items:start;margin-bottom:8px;">
                        <div style="flex:1;min-width:0;">
                          <h3 style="margin:0;color:var(--text-main);font-size:1rem;
                                     white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
                            ${q.title}
                          </h3>
                          <p style="margin:4px 0 0;color:var(--text-sub);font-size:0.8rem;">
                            ${q.description || 'No description'}
                          </p>
                        </div>
                        <span style="margin-left:8px;padding:3px 8px;border-radius:20px;
                                     font-size:0.7rem;font-weight:700;flex-shrink:0;
                                     background:${q.is_published?'rgba(72,187,120,0.12)':'rgba(160,174,192,0.12)'};
                                     color:${q.is_published?'#38a169':'#718096'};">
                          ${q.is_published ? '● Published' : '○ Draft'}
                        </span>
                      </div>
                      <div style="display:flex;gap:8px;margin:10px 0;font-size:0.75rem;
                                  color:var(--text-sub);flex-wrap:wrap;">
                        <span style="background:rgba(0,0,0,0.05);padding:2px 8px;
                                     border-radius:10px;font-weight:600;color:${aColor};">
                          ${area}
                        </span>
                        <span><i class="fas fa-question-circle" style="margin-right:3px;"></i>${qCount} question${qCount!==1?'s':''}</span>
                        <span><i class="fas fa-user-check" style="margin-right:3px;"></i>${rCount} response${rCount!==1?'s':''}</span>
                        <span style="color:${q.is_public?'#4299e1':'#718096'};">
                          <i class="fas fa-${q.is_public?'globe':'lock'}" style="margin-right:3px;"></i>
                          ${q.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                      <div style="display:flex;gap:8px;margin-top:12px;">
                        ${q.is_public && q.is_published && q.public_slug ? `
                          <button onclick="event.stopPropagation();copyToClipboard('${pubLink}')"
                            style="flex:1;padding:7px;background:rgba(66,153,225,0.1);
                                   color:#4299e1;border:1px solid #4299e1;border-radius:6px;
                                   cursor:pointer;font-size:0.78rem;font-weight:600;">
                            <i class="fas fa-copy"></i> Copy Link
                          </button>
                        ` : `<div style="flex:1;"></div>`}
                        <button onclick="event.stopPropagation();deleteQuiz('${q.id}')"
                          style="padding:7px 12px;background:rgba(245,101,101,0.1);
                                 color:#f56565;border:1px solid #f56565;border-radius:6px;
                                 cursor:pointer;font-size:0.8rem;">
                          <i class="fas fa-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>`;
            }).join('')}
          </div>
        `}
      </div>`;
}

// ─── NEW QUIZ MODAL ──────────────────────────────────────────
function showNewQuizModal() {
    const overlay = document.createElement('div');
    overlay.id = 'quizOverlay';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:20px;';
    overlay.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);
                  border-radius:16px;padding:28px;width:420px;max-width:100%;
                  color:var(--text-main);max-height:90vh;overflow-y:auto;">
        <h3 style="margin:0 0 18px;font-size:1.15rem;">
          <i class="fas fa-file-alt" style="color:var(--accent);margin-right:8px;"></i>
          Create New Quiz
        </h3>
        <div style="margin-bottom:12px;">
          <label class="qm-label">Quiz Title *</label>
          <input id="quizTitle" type="text" placeholder="e.g., Boiler Safety Q1" class="qm-input">
        </div>
        <div style="margin-bottom:12px;">
          <label class="qm-label">Description (Optional)</label>
          <textarea id="quizDesc" placeholder="Brief description..." class="qm-input" style="min-height:70px;resize:vertical;"></textarea>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
          <div>
            <label class="qm-label">Area / Department</label>
            <select id="quizArea" class="qm-input">
              <option value="">General (All Areas)</option>
              <option value="Boiler">🔥 Boiler</option>
              <option value="WTP">💧 WTP</option>
              <option value="Ref">❄️ Refrigeration</option>
              <option value="CDA">💨 CDA</option>
              <option value="WWTP">♻️ WWTP</option>
            </select>
          </div>
          <div>
            <label class="qm-label">Access</label>
            <select id="quizType" class="qm-input">
              <option value="private">🔒 Private (operators only)</option>
              <option value="public">🌐 Public (anyone with link)</option>
            </select>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px;">
          <div>
            <label class="qm-label">Pass Score (%)</label>
            <input id="quizPassScore" type="number" value="70" min="0" max="100" class="qm-input">
          </div>
          <div>
            <label class="qm-label">Time Limit (mins)</label>
            <input id="quizTimeLimit" type="number" placeholder="No limit" min="1" class="qm-input">
          </div>
        </div>
        <div style="display:flex;gap:10px;">
          <button onclick="document.getElementById('quizOverlay').remove()"
            style="flex:1;padding:11px;border:1px solid var(--border-color);
                   background:transparent;color:var(--text-sub);border-radius:8px;
                   cursor:pointer;font-weight:600;">Cancel</button>
          <button onclick="createNewQuiz()"
            style="flex:1;padding:11px;border:none;background:var(--accent);
                   color:white;border-radius:8px;cursor:pointer;font-weight:600;">
            Create Quiz
          </button>
        </div>
      </div>
      <style>
        .qm-label{display:block;margin-bottom:5px;font-size:0.82rem;color:var(--text-sub);font-weight:600;}
        .qm-input{width:100%;padding:9px 11px;border:1px solid var(--border-color);border-radius:7px;background:var(--bg-body);color:var(--text-main);outline:none;font-size:0.875rem;font-family:inherit;box-sizing:border-box;}
        .qm-input:focus{border-color:var(--accent);}
      </style>`;
    document.body.appendChild(overlay);
    document.getElementById('quizTitle').focus();
}

async function createNewQuiz() {
    const u = getQuizUser();
    if (!u.code) return showToast('Not logged in', 'error');

    const title     = document.getElementById('quizTitle').value.trim();
    const desc      = document.getElementById('quizDesc').value.trim();
    const area      = document.getElementById('quizArea').value;
    const type      = document.getElementById('quizType').value;
    const passScore = parseInt(document.getElementById('quizPassScore').value) || 70;
    const timeMins  = parseInt(document.getElementById('quizTimeLimit').value) || null;

    if (!title) return showToast('Quiz title is required', 'warning');

    const isPublic = type === 'public';
    const rand     = Math.random().toString(36).substring(2, 9);
    const slug     = isPublic
        ? title.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'') + '-' + rand
        : null;

    try {
        const { data, error } = await supabaseClient
            .from('quizzes')
            .insert([{
                title,
                description    : desc || null,
                quiz_area      : area || null,
                created_by     : u.code,
                created_by_name: u.name,
                is_public      : isPublic,
                public_slug    : slug,
                is_published   : false,
                pass_score     : passScore,
                time_limit_seconds: timeMins ? timeMins * 60 : null,
            }])
            .select().single();

        if (error) throw error;
        document.getElementById('quizOverlay')?.remove();
        showToast('Quiz created! Now add your questions.', 'success');
        editQuiz(data.id);
    } catch (err) {
        showToast('Error: ' + err.message, 'error');
    }
}

// ─── QUIZ BUILDER ────────────────────────────────────────────
async function editQuiz(quizId) {
    try {
        const [{ data: quiz, error: qErr }, { data: questions }] = await Promise.all([
            supabaseClient.from('quizzes').select('*').eq('id', quizId).single(),
            supabaseClient.from('quiz_questions').select('*')
                .eq('quiz_id', quizId).order('question_order', { ascending: true })
        ]);
        if (qErr) throw qErr;
        renderQuizBuilder(quiz, questions || []);
    } catch (err) {
        showToast('Error loading quiz: ' + err.message, 'error');
    }
}

function renderQuizBuilder(quiz, questions) {
    const content  = document.getElementById('cont');
    const base     = window.location.href.replace(/\/[^/]*$/, '');
    const pubLink  = `${base}/public-quiz.html?slug=${quiz.public_slug}`;
    const totalPts = questions.reduce((s,q) => s + (q.points || 10), 0);

    content.innerHTML = `
      <div style="padding:20px;animation:slideDown 0.3s ease;">
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:22px;flex-wrap:wrap;">
          <button onclick="loadQuizMaker()"
            style="background:none;border:none;color:var(--text-sub);cursor:pointer;font-size:1.2rem;padding:4px;">
            <i class="fas fa-chevron-left"></i>
          </button>
          <div style="flex:1;min-width:0;">
            <h2 style="margin:0;color:var(--text-main);font-size:1.25rem;
                       white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
              ${quiz.title}
            </h2>
            <p style="margin:3px 0 0;color:var(--text-sub);font-size:0.82rem;">
              ${questions.length} question${questions.length!==1?'s':''} &nbsp;•&nbsp; ${totalPts} total pts
              &nbsp;•&nbsp;
              <span style="color:${quiz.is_public?'#4299e1':'#718096'};">
                <i class="fas fa-${quiz.is_public?'globe':'lock'}"></i>
                ${quiz.is_public?'Public':'Private'}
              </span>
            </p>
          </div>
          <button onclick="publishQuiz('${quiz.id}')"
            style="background:${quiz.is_published?'rgba(245,101,101,0.1)':'var(--accent)'};
                   color:${quiz.is_published?'#f56565':'white'};
                   border:${quiz.is_published?'1px solid #f56565':'none'};
                   padding:9px 20px;border-radius:8px;cursor:pointer;font-weight:600;">
            ${quiz.is_published
                ? '<i class="fas fa-eye-slash"></i> Unpublish'
                : '<i class="fas fa-paper-plane"></i> Publish'}
          </button>
        </div>

        <div id="builderGrid" style="display:grid;grid-template-columns:1fr 280px;gap:18px;">
          <div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:15px;">
                <h3 style="margin:0;color:var(--text-main);font-size:1rem;">Questions</h3>
                <button onclick="addQuestion('${quiz.id}')"
                  style="background:var(--accent);color:white;border:none;
                         padding:7px 16px;border-radius:7px;cursor:pointer;
                         font-size:0.85rem;font-weight:600;">
                  <i class="fas fa-plus"></i> Add Question
                </button>
              </div>
              ${questions.length === 0 ? `
                <div style="text-align:center;padding:40px 20px;color:var(--text-sub);">
                  <i class="fas fa-inbox" style="font-size:2.5rem;opacity:0.4;"></i>
                  <p style="margin-top:10px;">No questions yet.<br>Click Add Question to start!</p>
                </div>
              ` : questions.map((q,i) => `
                <div style="background:var(--bg-body);border:1px solid var(--border-color);
                             padding:14px;border-radius:8px;margin-bottom:9px;cursor:pointer;transition:0.15s;"
                     onclick="editQuestion('${quiz.id}','${q.id}')"
                     onmouseover="this.style.borderColor='var(--accent)'"
                     onmouseout="this.style.borderColor='var(--border-color)'">
                  <div style="display:flex;gap:10px;align-items:start;">
                    <span style="width:26px;height:26px;border-radius:50%;
                                 background:var(--accent);color:white;
                                 display:flex;align-items:center;justify-content:center;
                                 font-size:0.78rem;font-weight:700;flex-shrink:0;">${i+1}</span>
                    <div style="flex:1;min-width:0;">
                      <p style="margin:0;color:var(--text-main);font-weight:500;font-size:0.9rem;word-break:break-word;">
                        ${q.question_text.length>72?q.question_text.substring(0,72)+'…':q.question_text}
                      </p>
                      <div style="display:flex;gap:7px;margin-top:5px;flex-wrap:wrap;">
                        <span style="font-size:0.7rem;color:var(--text-sub);background:rgba(0,0,0,0.05);padding:1px 7px;border-radius:10px;">
                          ${q.question_type.replace(/_/g,' ')}
                        </span>
                        <span style="font-size:0.7rem;color:#48bb78;background:rgba(72,187,120,0.08);padding:1px 7px;border-radius:10px;">
                          ${q.points||10} pts
                        </span>
                        ${(q.options||[]).filter(o=>o.is_correct).length > 0
                          ? `<span style="font-size:0.7rem;color:#4299e1;background:rgba(66,153,225,0.08);padding:1px 7px;border-radius:10px;">
                               <i class="fas fa-check-circle"></i> Answer set
                             </span>`
                          : `<span style="font-size:0.7rem;color:#f56565;background:rgba(245,101,101,0.08);padding:1px 7px;border-radius:10px;">
                               <i class="fas fa-exclamation-circle"></i> No answer set
                             </span>`}
                      </div>
                    </div>
                    <button onclick="event.stopPropagation();deleteQuestion('${q.id}','${quiz.id}')"
                      style="background:rgba(245,101,101,0.08);color:#f56565;border:none;
                             padding:5px 9px;border-radius:6px;cursor:pointer;flex-shrink:0;">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <div>
            <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:15px;margin-bottom:15px;">
              <h4 style="margin:0 0 14px;color:var(--text-main);font-size:0.9rem;font-weight:700;">Settings</h4>
              ${[
                ['shuffle_questions','Shuffle questions',quiz.shuffle_questions],
                ['shuffle_choices','Shuffle choices',quiz.shuffle_choices],
                ['show_score_after_submit','Show score after submit',quiz.show_score_after_submit],
                ['show_correct_answers','Show correct answers',quiz.show_correct_answers],
                ['one_attempt_only','One attempt only',quiz.one_attempt_only],
              ].map(([key,label,val])=>`
                <label style="display:flex;align-items:center;gap:8px;cursor:pointer;
                              font-size:0.83rem;color:var(--text-sub);margin-bottom:10px;">
                  <input type="checkbox" ${val?'checked':''} style="cursor:pointer;accent-color:var(--accent);"
                    onchange="updateQuizSetting('${quiz.id}','${key}',this.checked)">
                  ${label}
                </label>
              `).join('')}
              <div style="padding-top:12px;border-top:1px solid var(--border-color);">
                <label style="display:block;margin-bottom:5px;font-size:0.8rem;color:var(--text-sub);font-weight:600;">Pass Score (%)</label>
                <input type="number" value="${quiz.pass_score||70}" min="0" max="100"
                  onchange="updateQuizSetting('${quiz.id}','pass_score',parseInt(this.value))"
                  style="width:100%;padding:7px;border:1px solid var(--border-color);
                         border-radius:6px;background:var(--bg-body);color:var(--text-main);
                         outline:none;font-size:0.85rem;">
              </div>
            </div>

            ${quiz.is_public && quiz.public_slug ? `
              <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:15px;">
                <h4 style="margin:0 0 10px;color:var(--text-main);font-size:0.9rem;font-weight:700;">
                  <i class="fas fa-link" style="color:#4299e1;margin-right:6px;"></i>Public Link
                </h4>
                <input type="text" value="${pubLink}" readonly
                  style="width:100%;padding:7px;border:1px solid var(--border-color);
                         border-radius:6px;background:var(--bg-body);color:var(--text-main);
                         font-size:0.7rem;font-family:monospace;box-sizing:border-box;">
                <button onclick="copyToClipboard('${pubLink}')"
                  style="width:100%;margin-top:8px;padding:8px;background:var(--accent);
                         color:white;border:none;border-radius:6px;cursor:pointer;
                         font-size:0.85rem;font-weight:600;">
                  <i class="fas fa-copy"></i> Copy Link
                </button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
      <style>
        @media(max-width:700px){
          #builderGrid{grid-template-columns:1fr!important;}
        }
      </style>`;
}

// ─── ADD QUESTION ────────────────────────────────────────────
function addQuestion(quizId) {
    const overlay = buildOverlay(`
      <h3 style="margin:0 0 16px;font-size:1.1rem;">
        <i class="fas fa-plus-circle" style="color:var(--accent);margin-right:8px;"></i>Add Question
      </h3>
      <div style="margin-bottom:12px;">
        <label class="qm-label">Question Text *</label>
        <textarea id="qText" placeholder="Enter your question..." class="qm-input" style="min-height:80px;resize:vertical;"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px;">
        <div>
          <label class="qm-label">Question Type</label>
          <select id="qType" class="qm-input" onchange="renderOptionBuilder()">
            <option value="multiple_choice">Multiple Choice</option>
            <option value="checkbox">Checkbox (Multi)</option>
            <option value="true_false">True / False</option>
          </select>
        </div>
        <div>
          <label class="qm-label">Points</label>
          <input id="qPoints" type="number" value="10" min="0" class="qm-input">
        </div>
      </div>
      <div id="optionBuilder"></div>
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button onclick="document.getElementById('qOverlay').remove()"
          style="flex:1;padding:10px;border:1px solid var(--border-color);
                 background:transparent;color:var(--text-sub);border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
        <button onclick="saveNewQuestion('${quizId}')"
          style="flex:1;padding:10px;border:none;background:var(--accent);
                 color:white;border-radius:8px;cursor:pointer;font-weight:600;">Save Question</button>
      </div>
    `, 'qOverlay');
    document.body.appendChild(overlay);
    renderOptionBuilder();
}

function renderOptionBuilder() {
    const type = document.getElementById('qType')?.value;
    const container = document.getElementById('optionBuilder');
    if (!container) return;
    if (type === 'true_false') {
        container.innerHTML = `
          <label class="qm-label">Correct Answer *</label>
          <div style="display:flex;gap:10px;">
            ${['true','false'].map(v=>`
              <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px;
                            border:2px solid var(--border-color);border-radius:8px;
                            cursor:pointer;font-size:0.9rem;color:var(--text-main);">
                <input type="radio" name="tfCorrect" value="${v}" style="accent-color:var(--accent);">
                ${v==='true'?'✅ True':'❌ False'}
              </label>
            `).join('')}
          </div>`;
    } else {
        container.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="qm-label" style="margin:0;">Options *
              <span style="font-weight:400;color:var(--text-sub);font-size:0.75rem;">
                — ${type==='checkbox'?'check all correct answers':'check the one correct answer'}
              </span>
            </label>
            <button onclick="addOptionRow()" type="button"
              style="background:none;border:none;color:var(--accent);cursor:pointer;
                     font-size:0.8rem;font-weight:600;padding:0;">+ Add option</button>
          </div>
          <div id="optionRows" style="display:flex;flex-direction:column;gap:7px;">
            ${[0,1,2,3].map(i=>buildOptionRow(i,type)).join('')}
          </div>`;
    }
}

let _optCount = 4;
function addOptionRow() {
    const container = document.getElementById('optionRows');
    const type = document.getElementById('qType')?.value;
    if (!container) return;
    const div = document.createElement('div');
    div.innerHTML = buildOptionRow(_optCount++, type);
    container.appendChild(div.firstElementChild);
}

function buildOptionRow(idx, type) {
    const inputType = type === 'checkbox' ? 'checkbox' : 'radio';
    return `
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="${inputType}" name="optCorrect" value="${idx}"
               style="accent-color:var(--accent);flex-shrink:0;width:16px;height:16px;">
        <input type="text" class="qm-input optText" placeholder="Option ${idx+1}" style="flex:1;">
      </div>`;
}

async function saveNewQuestion(quizId) {
    const text   = document.getElementById('qText').value.trim();
    const type   = document.getElementById('qType').value;
    const points = parseInt(document.getElementById('qPoints').value) || 10;
    if (!text) return showToast('Question text is required', 'warning');

    let options = [];
    if (type === 'true_false') {
        const selected = document.querySelector('input[name="tfCorrect"]:checked');
        if (!selected) return showToast('Please select the correct answer (True/False)', 'warning');
        const correct = selected.value === 'true';
        options = [
            { id: 'tf_true',  text: 'True',  is_correct:  correct },
            { id: 'tf_false', text: 'False', is_correct: !correct },
        ];
    } else {
        const textInputs  = document.querySelectorAll('.optText');
        const correctIdxs = new Set([...document.querySelectorAll('input[name="optCorrect"]:checked')].map(c=>parseInt(c.value)));
        textInputs.forEach((inp, idx) => {
            const v = inp.value.trim();
            if (v) options.push({ id: 'opt_' + idx, text: v, is_correct: correctIdxs.has(idx) });
        });
        if (options.length < 2) return showToast('Please add at least 2 options','warning');
        if (correctIdxs.size === 0) return showToast('Please mark at least one correct answer','warning');
    }

    try {
        const { data: last } = await supabaseClient
            .from('quiz_questions').select('question_order')
            .eq('quiz_id', quizId).order('question_order', { ascending: false }).limit(1);
        const nextOrder = (last && last.length>0) ? last[0].question_order + 1 : 1;

        const { error } = await supabaseClient
            .from('quiz_questions')
            .insert([{ quiz_id:quizId, question_text:text, question_type:type,
                       question_order:nextOrder, options, points, is_required:true }]);
        if (error) throw error;
        document.getElementById('qOverlay')?.remove();
        showToast('Question added!', 'success');
        editQuiz(quizId);
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

// ─── EDIT QUESTION ───────────────────────────────────────────
async function editQuestion(quizId, questionId) {
    const { data: q, error } = await supabaseClient
        .from('quiz_questions').select('*').eq('id', questionId).single();
    if (error) return showToast('Error loading question', 'error');

    const options = q.options || [];
    let optionsHtml = '';

    if (q.question_type === 'true_false') {
        const correctVal = options.find(o=>o.is_correct)?.text?.toLowerCase() === 'true' ? 'true' : 'false';
        optionsHtml = `
          <label class="qm-label">Correct Answer *</label>
          <div style="display:flex;gap:10px;">
            ${['true','false'].map(v=>`
              <label style="flex:1;display:flex;align-items:center;gap:8px;padding:10px;
                            border:2px solid var(--border-color);border-radius:8px;
                            cursor:pointer;font-size:0.9rem;color:var(--text-main);">
                <input type="radio" name="tfCorrect" value="${v}" ${correctVal===v?'checked':''}
                       style="accent-color:var(--accent);">
                ${v==='true'?'✅ True':'❌ False'}
              </label>
            `).join('')}
          </div>`;
    } else {
        optionsHtml = `
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
            <label class="qm-label" style="margin:0;">Options</label>
            <button onclick="addEditOptionRow('${q.question_type}')" type="button"
              style="background:none;border:none;color:var(--accent);cursor:pointer;font-size:0.8rem;font-weight:600;padding:0;">+ Add option</button>
          </div>
          <div id="editOptRows" style="display:flex;flex-direction:column;gap:7px;">
            ${options.map((opt,i)=>`
              <div style="display:flex;align-items:center;gap:8px;">
                <input type="${q.question_type==='checkbox'?'checkbox':'radio'}"
                  name="optCorrect" value="${i}" ${opt.is_correct?'checked':''}
                  style="accent-color:var(--accent);flex-shrink:0;width:16px;height:16px;">
                <input type="text" class="qm-input editOptText"
                  value="${opt.text.replace(/"/g,'&quot;').replace(/'/g,'&#39;')}"
                  placeholder="Option ${i+1}" style="flex:1;">
              </div>
            `).join('')}
          </div>`;
    }

    const overlay = buildOverlay(`
      <h3 style="margin:0 0 16px;font-size:1.1rem;">
        <i class="fas fa-edit" style="color:var(--accent);margin-right:8px;"></i>Edit Question
      </h3>
      <div style="margin-bottom:12px;">
        <label class="qm-label">Question Text *</label>
        <textarea id="eqText" class="qm-input" style="min-height:80px;resize:vertical;">${q.question_text}</textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px;">
        <div>
          <label class="qm-label">Type</label>
          <input type="text" value="${q.question_type.replace(/_/g,' ')}" readonly
            class="qm-input" style="opacity:0.6;">
        </div>
        <div>
          <label class="qm-label">Points</label>
          <input id="eqPoints" type="number" value="${q.points||10}" min="0" class="qm-input">
        </div>
      </div>
      ${optionsHtml}
      <div style="display:flex;gap:10px;margin-top:16px;">
        <button onclick="document.getElementById('eqOverlay').remove()"
          style="flex:1;padding:10px;border:1px solid var(--border-color);
                 background:transparent;color:var(--text-sub);border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
        <button onclick="saveEditedQuestion('${q.id}','${quizId}','${q.question_type}')"
          style="flex:1;padding:10px;border:none;background:var(--accent);
                 color:white;border-radius:8px;cursor:pointer;font-weight:600;">Save Changes</button>
      </div>
    `, 'eqOverlay');
    document.body.appendChild(overlay);
}

function addEditOptionRow(type) {
    const container = document.getElementById('editOptRows');
    if (!container) return;
    const count = container.children.length;
    const div   = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px;">
        <input type="${type==='checkbox'?'checkbox':'radio'}" name="optCorrect" value="${count}"
               style="accent-color:var(--accent);flex-shrink:0;width:16px;height:16px;">
        <input type="text" class="qm-input editOptText"
               placeholder="Option ${count+1}" style="flex:1;">
      </div>`;
    container.appendChild(div.firstElementChild);
}

async function saveEditedQuestion(questionId, quizId, qType) {
    const text   = document.getElementById('eqText').value.trim();
    const points = parseInt(document.getElementById('eqPoints').value) || 10;
    if (!text) return showToast('Question text is required', 'warning');

    let options = [];
    if (qType === 'true_false') {
        const selected = document.querySelector('input[name="tfCorrect"]:checked');
        if (!selected) return showToast('Please select the correct answer', 'warning');
        const correct = selected.value === 'true';
        options = [
            { id:'tf_true',  text:'True',  is_correct:  correct },
            { id:'tf_false', text:'False', is_correct: !correct },
        ];
    } else {
        const textInputs  = document.querySelectorAll('.editOptText');
        const correctIdxs = new Set([...document.querySelectorAll('input[name="optCorrect"]:checked')].map(c=>parseInt(c.value)));
        textInputs.forEach((inp,idx) => {
            const v = inp.value.trim();
            if (v) options.push({ id:'opt_'+idx, text:v, is_correct: correctIdxs.has(idx) });
        });
        if (options.length < 2) return showToast('Please add at least 2 options','warning');
        if (correctIdxs.size === 0) return showToast('Please mark a correct answer','warning');
    }

    try {
        const { error } = await supabaseClient
            .from('quiz_questions')
            .update({ question_text:text, options, points })
            .eq('id', questionId);
        if (error) throw error;
        document.getElementById('eqOverlay')?.remove();
        showToast('Question updated!', 'success');
        editQuiz(quizId);
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
}

async function deleteQuestion(questionId, quizId) {
    if (!confirm('Delete this question?')) return;
    const { error } = await supabaseClient
        .from('quiz_questions').delete().eq('id', questionId);
    if (error) return showToast('Error deleting question', 'error');
    showToast('Question deleted', 'success');
    editQuiz(quizId);
}

async function publishQuiz(quizId) {
    const { data: qs } = await supabaseClient
        .from('quiz_questions').select('id').eq('quiz_id', quizId);
    if (!qs || qs.length === 0)
        return showToast('Add at least 1 question before publishing', 'warning');
    const { data: quiz } = await supabaseClient
        .from('quizzes').select('is_published').eq('id', quizId).single();
    const { error } = await supabaseClient
        .from('quizzes').update({ is_published: !quiz.is_published }).eq('id', quizId);
    if (error) return showToast('Error updating quiz', 'error');
    showToast(quiz.is_published ? 'Quiz unpublished' : 'Quiz published! 🎉', 'success');
    editQuiz(quizId);
}

async function deleteQuiz(quizId) {
    if (!confirm('Delete this quiz and ALL its data?\nThis cannot be undone.')) return;
    const { error } = await supabaseClient.from('quizzes').delete().eq('id', quizId);
    if (error) return showToast('Error deleting quiz', 'error');
    showToast('Quiz deleted', 'success');
    loadQuizMaker();
}

async function updateQuizSetting(quizId, setting, value) {
    const { error } = await supabaseClient
        .from('quizzes').update({ [setting]: value }).eq('id', quizId);
    if (error) showToast('Error saving setting', 'error');
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() =>
        showToast('Link copied! 📋', 'success', 2000));
}

function buildOverlay(html, id) {
    const overlay = document.createElement('div');
    overlay.id = id;
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);padding:16px;';
    overlay.innerHTML = `
      <div style="background:var(--bg-card);border:1px solid var(--border-color);
                  border-radius:16px;padding:24px;width:480px;max-width:100%;
                  color:var(--text-main);max-height:90vh;overflow-y:auto;">
        ${html}
      </div>
      <style>
        .qm-label{display:block;margin-bottom:5px;font-size:0.82rem;color:var(--text-sub);font-weight:600;}
        .qm-input{width:100%;padding:9px 11px;border:1px solid var(--border-color);border-radius:7px;background:var(--bg-body);color:var(--text-main);outline:none;font-size:0.875rem;font-family:inherit;box-sizing:border-box;}
        .qm-input:focus{border-color:var(--accent);}
      </style>`;
    return overlay;
}
