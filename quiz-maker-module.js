// ============================================================
// ABN QUIZ MAKER MODULE
// Add this to your index.html <script> section
// ============================================================

// ─── QUIZ MAKER MAIN FUNCTIONS ──────────────────────────

async function loadQuizMaker() {
    updateSidebarActive(7); // Adjust index based on your nav items
    const content = document.getElementById('cont');
    
    // Show loading state
    content.innerHTML = `
        <div style="padding:20px;text-align:center;color:var(--text-sub);">
            <i class="fas fa-spinner fa-spin" style="font-size:2rem;margin-bottom:10px;"></i>
            <p>Loading quizzes...</p>
        </div>
    `;
    
    // 1. KUNIN ANG CURRENT USER MULA SA LOCALSTORAGE (Dahil internal app at walang Supabase Auth)
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        content.innerHTML = `
            <div style="padding:40px;text-align:center;color:var(--text-sub);">
                <i class="fas fa-exclamation-triangle" style="font-size:2.5rem;margin-bottom:15px;color:#e67e22;"></i>
                <p style="font-size:1.1rem;font-weight:600;">Kailangan mong mag-login muna.</p>
                <p style="font-size:0.9rem;margin-top:5px;">Hindi mahanap ang session ng iyong Supervisor account.</p>
            </div>`;
        return;
    }

    // Fetch quizzes created by current user
    const { data, error } = await supabaseClient
        .from('quizzes')
        .select('*')
        .eq('created_by', currentUser.id)
        .order('created_at', { ascending: false });
    
    if (error) {
        content.innerHTML = `<div style="padding:20px;color:red;">Error loading quizzes: ${error.message}</div>`;
        return;
    }
    
    renderQuizList(data || []);
}

function renderQuizList(quizzes) {
    const content = document.getElementById('cont');
    
    const html = `
        <div style="padding:20px;animation:slideDown 0.3s ease;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:30px;flex-wrap:wrap;gap:15px;">
                <div>
                    <h2 style="margin:0;color:var(--text-main);font-size:1.5rem;display:flex;align-items:center;gap:12px;">
                        <i class="fas fa-poll" style="color:var(--accent);"></i>Quiz Maker
                    </h2>
                    <p style="margin:5px 0 0;color:var(--text-sub);font-size:0.9rem;">Create and manage quizzes for your team</p>
                </div>
                <button onclick="showNewQuizModal()" style="
                    background:var(--accent);color:white;border:none;padding:12px 24px;
                    border-radius:8px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;
                    transition:0.2s;box-shadow:0 4px 12px rgba(56,161,105,0.2);
                ">
                    <i class="fas fa-plus"></i> New Quiz
                </button>
            </div>
            
            ${quizzes.length === 0 ? `
                <div style="
                    text-align:center;padding:60px 20px;background:var(--bg-card);
                    border:1px solid var(--border-color);border-radius:12px;
                ">
                    <i class="fas fa-inbox" style="font-size:3rem;color:var(--text-sub);opacity:0.5;margin-bottom:15px;"></i>
                    <p style="color:var(--text-sub);font-size:1rem;">No quizzes yet. Create your first quiz!</p>
                </div>
            ` : `
                <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:15px;">
                    ${quizzes.map(q => `
                        <div style="
                            background:var(--bg-card);border:1px solid var(--border-color);
                            border-radius:12px;padding:20px;transition:0.2s;
                            cursor:pointer;
                        " onclick="editQuiz('${q.id}')" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='var(--border-color)'">
                            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:10px;">
                                <div>
                                    <h3 style="margin:0;color:var(--text-main);font-size:1.1rem;">${q.title}</h3>
                                    <p style="margin:5px 0 0;color:var(--text-sub);font-size:0.85rem;">${q.description || 'No description'}</p>
                                </div>
                                <span style="
                                    padding:4px 8px;border-radius:20px;font-size:0.75rem;font-weight:600;
                                    background:${q.is_published ? 'rgba(72,187,120,0.1)' : 'rgba(160,174,192,0.1)'};
                                    color:${q.is_published ? '#48bb78' : '#718096'};
                                ">${q.is_published ? 'Published' : 'Draft'}</span>
                            </div>
                            <div style="display:flex;gap:8px;margin-top:15px;font-size:0.85rem;color:var(--text-sub);">
                                <span><i class="fas fa-question-circle" style="margin-right:4px;"></i>5 questions</span>
                                <span>•</span>
                                <span><i class="fas fa-user-check" style="margin-right:4px;"></i>12 responses</span>
                            </div>
                            <div style="display:flex;gap:8px;margin-top:12px;">
                                <button onclick="event.stopPropagation();previewQuiz('${q.id}')" style="flex:1;padding:8px;background:var(--accent);color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:500;">
                                    Preview
                                </button>
                                <button onclick="event.stopPropagation();deleteQuiz('${q.id}')" style="flex:1;padding:8px;background:rgba(245,101,101,0.1);color:#f56565;border:1px solid #f56565;border-radius:6px;cursor:pointer;font-size:0.85rem;font-weight:500;">
                                    Delete
                                </button>
                            </div>
                        </div>
                    `).join('')}
                </div>
            `}
        </div>
    `;
    
    content.innerHTML = html;
}

function showNewQuizModal() {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:28px;width:400px;max-width:90vw;color:var(--text-main);">
            <h3 style="margin:0 0 16px;font-size:1.2rem;"><i class="fas fa-file-alt" style="color:var(--accent);margin-right:8px;"></i>Create New Quiz</h3>
            
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:6px;font-size:0.85rem;color:var(--text-sub);font-weight:600;">Quiz Title</label>
                <input type="text" id="quizTitle" placeholder="e.g., Safety Training Q1" style="
                    width:100%;padding:10px 12px;border:1px solid var(--border-color);
                    border-radius:8px;background:var(--bg-body);color:var(--text-main);outline:none;
                    font-size:0.875rem;
                ">
            </div>
            
            <div style="margin-bottom:12px;">
                <label style="display:block;margin-bottom:6px;font-size:0.85rem;color:var(--text-sub);font-weight:600;">Description (Optional)</label>
                <textarea id="quizDesc" placeholder="Brief description..." style="
                    width:100%;padding:10px 12px;border:1px solid var(--border-color);
                    border-radius:8px;background:var(--bg-body);color:var(--text-main);outline:none;
                    font-size:0.875rem;min-height:80px;resize:vertical;
                "></textarea>
            </div>
            
            <div style="margin-bottom:16px;">
                <label style="display:block;margin-bottom:6px;font-size:0.85rem;color:var(--text-sub);font-weight:600;">Quiz Type</label>
                <select id="quizType" style="
                    width:100%;padding:10px 12px;border:1px solid var(--border-color);
                    border-radius:8px;background:var(--bg-body);color:var(--text-main);outline:none;
                    font-size:0.875rem;
                ">
                    <option value="private">Private (Logged-in operators only)</option>
                    <option value="public">Public (Anyone with link)</option>
                </select>
            </div>
            
            <div style="display:flex;gap:10px;">
                <button onclick="this.closest('div[style*=fixed]').remove()" style="
                    flex:1;padding:10px;border:1px solid var(--border-color);
                    background:transparent;color:var(--text-sub);border-radius:8px;
                    cursor:pointer;font-weight:600;
                ">Cancel</button>
                <button onclick="createNewQuiz()" style="
                    flex:1;padding:10px;border:none;background:var(--accent);
                    color:white;border-radius:8px;cursor:pointer;font-weight:600;
                ">Create</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    document.getElementById('quizTitle').focus();
}

async function createNewQuiz() {
    const title = document.getElementById('quizTitle').value.trim();
    const desc = document.getElementById('quizDesc').value.trim();
    const type = document.getElementById('quizType').value;
    
    if (!title) return showToast('Quiz title is required', 'warning');
    
    // KUNIN ANG CURRENT USER MULA SA LOCALSTORAGE
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser || !currentUser.id) {
        return showToast('Session error: Mangyaring mag-login muna.', 'error');
    }
    
    const isPublic = type === 'public';
    const publicSlug = isPublic ? generateSlug(title) : null;
    
    const { data, error } = await supabaseClient
        .from('quizzes')
        .insert([{
            title,
            description: desc,
            created_by: currentUser.id,
            is_public: isPublic,
            public_slug: publicSlug,
            is_published: false
        }])
        .select()
        .single();
    
    if (error) {
        return showToast('Error creating quiz: ' + error.message, 'error');
    }
    
    document.querySelector('div[style*=fixed]').remove();
    showToast('Quiz created! Start adding questions.', 'success');
    editQuiz(data.id);
}

async function editQuiz(quizId) {
    const { data, error } = await supabaseClient
        .from('quizzes')
        .select('*')
        .eq('id', quizId)
        .single();
    
    if (error) return showToast('Error loading quiz', 'error');
    
    const { data: questions } = await supabaseClient
        .from('quiz_questions')
        .select('*')
        .eq('quiz_id', quizId)
        .order('question_order', { ascending: true });
    
    renderQuizBuilder(data, questions || []);
}

function renderQuizBuilder(quiz, questions) {
    const content = document.getElementById('cont');
    
    const html = `
        <div style="padding:20px;animation:slideDown 0.3s ease;">
            <div style="display:flex;align-items:center;gap:12px;margin-bottom:25px;">
                <button onclick="loadQuizMaker()" style="background:none;border:none;color:var(--text-sub);cursor:pointer;font-size:1.2rem;padding:0;">
                    <i class="fas fa-chevron-left"></i>
                </button>
                <div style="flex:1;">
                    <h2 style="margin:0;color:var(--text-main);font-size:1.3rem;">${quiz.title}</h2>
                    <p style="margin:5px 0 0;color:var(--text-sub);font-size:0.85rem;">${questions.length} question${questions.length !== 1 ? 's' : ''}</p>
                </div>
                <button onclick="publishQuiz('${quiz.id}')" style="
                    background:var(--accent);color:white;border:none;padding:10px 20px;
                    border-radius:8px;cursor:pointer;font-weight:600;
                ">${quiz.is_published ? 'Unpublish' : 'Publish'}</button>
            </div>
            
            <div style="display:grid;grid-template-columns:1fr 300px;gap:20px;">
                <!-- Main Questions Area -->
                <div>
                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:20px;">
                        <h3 style="margin:0 0 15px;color:var(--text-main);">Questions</h3>
                        
                        ${questions.length === 0 ? `
                            <div style="text-align:center;padding:40px 20px;color:var(--text-sub);">
                                <i class="fas fa-inbox" style="font-size:2rem;opacity:0.5;margin-bottom:10px;"></i>
                                <p>No questions yet. Add one to get started!</p>
                            </div>
                        ` : `
                            <div style="display:flex;flex-direction:column;gap:10px;">
                                ${questions.map((q, i) => `
                                    <div style="
                                        background:var(--bg-body);border:1px solid var(--border-color);
                                        padding:15px;border-radius:8px;cursor:pointer;transition:0.2s;
                                    " onclick="editQuestion('${quiz.id}', '${q.id}')">
                                        <div style="display:flex;gap:10px;align-items:start;">
                                            <span style="
                                                width:28px;height:28px;border-radius:50%;
                                                background:var(--accent);color:white;
                                                display:flex;align-items:center;justify-content:center;
                                                font-size:0.8rem;font-weight:600;flex-shrink:0;
                                            ">${i + 1}</span>
                                            <div style="flex:1;min-width:0;">
                                                <p style="margin:0;color:var(--text-main);font-weight:500;font-size:0.95rem;word-break:break-word;">${q.question_text.substring(0, 60)}${q.question_text.length > 60 ? '...' : ''}</p>
                                                <p style="margin:5px 0 0;color:var(--text-sub);font-size:0.8rem;">${q.question_type.replace(/_/g, ' ')}</p>
                                            </div>
                                            <button onclick="event.stopPropagation();deleteQuestion('${q.id}')" style="
                                                background:rgba(245,101,101,0.1);color:#f56565;
                                                border:none;padding:6px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;
                                            "><i class="fas fa-trash"></i></button>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        `}
                        
                        <button onclick="addQuestion('${quiz.id}')" style="
                            width:100%;margin-top:15px;padding:12px;background:var(--accent);
                            color:white;border:none;border-radius:8px;cursor:pointer;
                            font-weight:600;display:flex;align-items:center;justify-content:center;gap:8px;
                        ">
                            <i class="fas fa-plus"></i> Add Question
                        </button>
                    </div>
                </div>
                
                <!-- Right Sidebar Settings -->
                <div>
                    <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:15px;">
                        <h4 style="margin:0 0 12px;color:var(--text-main);font-size:0.95rem;">Settings</h4>
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;color:var(--text-sub);">
                                <input type="checkbox" ${quiz.shuffle_questions ? 'checked' : ''} 
                                    onchange="updateQuizSetting('${quiz.id}', 'shuffle_questions', this.checked)"
                                    style="cursor:pointer;">
                                Shuffle questions
                            </label>
                        </div>
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;color:var(--text-sub);">
                                <input type="checkbox" ${quiz.shuffle_choices ? 'checked' : ''} 
                                    onchange="updateQuizSetting('${quiz.id}', 'shuffle_choices', this.checked)"
                                    style="cursor:pointer;">
                                Shuffle choices
                            </label>
                        </div>
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;color:var(--text-sub);">
                                <input type="checkbox" ${quiz.show_score_after_submit ? 'checked' : ''} 
                                    onchange="updateQuizSetting('${quiz.id}', 'show_score_after_submit', this.checked)"
                                    style="cursor:pointer;">
                                Show score after
                            </label>
                        </div>
                        
                        <div style="margin-bottom:12px;">
                            <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:0.85rem;color:var(--text-sub);">
                                <input type="checkbox" ${quiz.one_attempt_only ? 'checked' : ''} 
                                    onchange="updateQuizSetting('${quiz.id}', 'one_attempt_only', this.checked)"
                                    style="cursor:pointer;">
                                One attempt only
                            </label>
                        </div>
                        
                        <div style="padding-top:12px;border-top:1px solid var(--border-color);">
                            <label style="display:block;margin-bottom:6px;font-size:0.8rem;color:var(--text-sub);font-weight:600;">Pass Score (%)</label>
                            <input type="number" value="${quiz.pass_score}" min="0" max="100"
                                onchange="updateQuizSetting('${quiz.id}', 'pass_score', parseInt(this.value))"
                                style="width:100%;padding:8px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-body);color:var(--text-main);outline:none;">
                        </div>
                    </div>
                    
                    ${quiz.is_public ? `
                        <div style="margin-top:15px;background:var(--bg-card);border:1px solid var(--border-color);border-radius:12px;padding:15px;">
                            <h4 style="margin:0 0 8px;color:var(--text-main);font-size:0.9rem;">Public Link</h4>
                            <input type="text" value="${window.location.origin}/quiz/${quiz.public_slug}" readonly style="
                                width:100%;padding:8px;border:1px solid var(--border-color);
                                border-radius:6px;background:var(--bg-body);color:var(--text-main);
                                font-size:0.75rem;font-family:monospace;
                            ">
                            <button onclick="copyToClipboard('${window.location.origin}/quiz/${quiz.public_slug}')" style="
                                width:100%;margin-top:8px;padding:8px;background:var(--accent);
                                color:white;border:none;border-radius:6px;cursor:pointer;font-size:0.85rem;
                                font-weight:500;
                            "><i class="fas fa-copy"></i> Copy Link</button>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
    `;
    
    content.innerHTML = html;
}

function addQuestion(quizId) {
    showModal('Add Question', `
        <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:6px;font-size:0.85rem;font-weight:600;color:var(--text-sub);">Question Text</label>
            <textarea id="questionText" placeholder="Enter your question..." style="
                width:100%;padding:10px;border:1px solid var(--border-color);
                border-radius:6px;background:var(--bg-body);color:var(--text-main);
                min-height:80px;resize:vertical;outline:none;
            "></textarea>
        </div>
        <div style="margin-bottom:12px;">
            <label style="display:block;margin-bottom:6px;font-size:0.85rem;font-weight:600;color:var(--text-sub);">Question Type</label>
            <select id="questionType" style="width:100%;padding:10px;border:1px solid var(--border-color);border-radius:6px;background:var(--bg-body);color:var(--text-main);outline:none;">
                <option value="multiple_choice">Multiple Choice</option>
                <option value="checkbox">Checkbox (Multi-Select)</option>
                <option value="true_false">True / False</option>
            </select>
        </div>
    `, async () => {
        const text = document.getElementById('questionText').value.trim();
        const type = document.getElementById('questionType').value;
        
        if (!text) return showToast('Question text is required', 'warning');
        
        // Get next question order
        const { data: existingQ } = await supabaseClient
            .from('quiz_questions')
            .select('question_order')
            .eq('quiz_id', quizId)
            .order('question_order', { ascending: false })
            .limit(1);
        
        const nextOrder = (existingQ && existingQ.length > 0) ? existingQ[0].question_order + 1 : 1;
        
        const { error } = await supabaseClient
            .from('quiz_questions')
            .insert([{
                quiz_id: quizId,
                question_text: text,
                question_type: type,
                question_order: nextOrder,
                options: type === 'true_false' ? [
                    { id: '1', text: 'True', is_correct: false },
                    { id: '2', text: 'False', is_correct: false }
                ] : []
            }]);
        
        if (error) return showToast('Error creating question', 'error');
        
        showToast('Question added! Now configure the options.', 'success');
        editQuiz(quizId);
    });
}

function editQuestion(quizId, questionId) {
    showToast('Question editor coming in Sprint 2!', 'info', 2000);
    // This will be expanded in Sprint 2
}

async function deleteQuestion(questionId) {
    if (!confirm('Delete this question?')) return;
    
    const { error } = await supabaseClient
        .from('quiz_questions')
        .delete()
        .eq('id', questionId);
    
    if (error) return showToast('Error deleting question', 'error');
    showToast('Question deleted', 'success');
    // Reload current quiz
    const quizId = await getCurrentQuizId();
    if (quizId) editQuiz(quizId);
}

async function publishQuiz(quizId) {
    const { data } = await supabaseClient
        .from('quizzes')
        .select('is_published')
        .eq('id', quizId)
        .single();
    
    const { error } = await supabaseClient
        .from('quizzes')
        .update({ is_published: !data.is_published })
        .eq('id', quizId);
    
    if (error) return showToast('Error updating quiz', 'error');
    showToast(data.is_published ? 'Quiz unpublished' : 'Quiz published!', 'success');
    loadQuizMaker();
}

async function deleteQuiz(quizId) {
    if (!confirm('Delete this quiz? This cannot be undone.')) return;
    
    const { error } = await supabaseClient
        .from('quizzes')
        .delete()
        .eq('id', quizId);
    
    if (error) return showToast('Error deleting quiz', 'error');
    showToast('Quiz deleted', 'success');
    loadQuizMaker();
}

async function updateQuizSetting(quizId, setting, value) {
    const { error } = await supabaseClient
        .from('quizzes')
        .update({ [setting]: value })
        .eq('id', quizId);
    
    if (error) showToast('Error updating setting', 'error');
}

function previewQuiz(quizId) {
    showToast('Preview mode coming in Sprint 2!', 'info', 2000);
}

// ─── HELPER FUNCTIONS ──────────────────────────────────

function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Math.random().toString(36).substr(2, 9);
}

function showModal(title, content, onConfirm) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);z-index:9998;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
    overlay.innerHTML = `
        <div style="background:var(--bg-card);border:1px solid var(--border-color);border-radius:16px;padding:28px;width:500px;max-width:90vw;color:var(--text-main);">
            <h3 style="margin:0 0 16px;font-size:1.2rem;">${title}</h3>
            <div>${content}</div>
            <div style="display:flex;gap:10px;margin-top:20px;">
                <button onclick="this.closest('div[style*=fixed]').remove()" style="flex:1;padding:10px;border:1px solid var(--border-color);background:transparent;color:var(--text-sub);border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>
                <button onclick="onConfirm();this.closest('div[style*=fixed]').remove();" style="flex:1;padding:10px;border:none;background:var(--accent);color:white;border-radius:8px;cursor:pointer;font-weight:600;">Confirm</button>
            </div>
        </div>
    `;
    document.body.appendChild(overlay);
    window.onConfirm = onConfirm;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast('Link copied to clipboard!', 'success', 2000);
    });
}

async function getCurrentQuizId() {
    // Get from quiz builder context - you may need to track this differently
    return null;
}
