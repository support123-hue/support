const STORE_KEY = 'jane_tool_demo_v1';
const emptyState = { contributions: [], supporters: [], volunteers: [], messages: [] };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);
function loadState(){
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || emptyState; }
  catch { return emptyState; }
}
function saveState(state){ localStorage.setItem(STORE_KEY, JSON.stringify(state)); }
function money(n){ return `KSh ${Number(n || 0).toLocaleString('en-KE')}`; }
function toast(text){
  const t = $('#toast');
  t.textContent = text;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 3400);
}
function readForm(form){
  const data = new FormData(form);
  return Object.fromEntries(data.entries());
}
function render(){
  const state = loadState();
  const total = state.contributions.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  $('#totalRaised').textContent = money(total);
  $('#supporterCount').textContent = state.supporters.length;
  $('#volunteerCount').textContent = state.volunteers.length;
  $('#messageCount').textContent = state.messages.length;
  $('#contributionTable').innerHTML = state.contributions.slice(-8).reverse().map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${money(item.amount)}</td><td>${escapeHtml(item.constituency || item.ward || '-')}</td><td>${escapeHtml(item.status)}</td></tr>`).join('') || `<tr><td colspan="4">No contributions recorded yet.</td></tr>`;
  $('#supporterTable').innerHTML = state.supporters.slice(-8).reverse().map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.phone)}</td><td>${escapeHtml(item.constituency)}</td></tr>`).join('') || `<tr><td colspan="3">No supporters registered yet.</td></tr>`;
  $('#volunteerTable').innerHTML = state.volunteers.slice(-8).reverse().map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.role)}</td><td>${escapeHtml(item.ward)}</td></tr>`).join('') || `<tr><td colspan="3">No volunteers registered yet.</td></tr>`;
  renderWords(state.messages.map(m => m.message).join(' '));
}
function escapeHtml(value){
  return String(value || '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}
function renderWords(text){
  const stop = new Set(['the','and','for','with','that','this','from','are','you','your','our','kwa','na','ya','to','of','in','a','is','we','i','it','be','as','on','or','an']);
  const counts = {};
  text.toLowerCase().replace(/[^a-zA-Z ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !stop.has(w)).forEach(w => counts[w] = (counts[w] || 0) + 1);
  const top = Object.entries(counts).sort((a,b) => b[1] - a[1]).slice(0, 16);
  $('#wordCloud').innerHTML = top.length ? top.map(([word, count]) => `<span>${escapeHtml(word)} (${count})</span>`).join('') : '<p class="note">Message themes will appear here after supporters send messages.</p>';
}
$$('.amount-grid button').forEach(btn => {
  btn.addEventListener('click', () => {
    $$('.amount-grid button').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const amount = btn.dataset.amount;
    const amountInput = $('#contributionForm input[name="amount"]');
    if (amount === 'other') { amountInput.value = ''; amountInput.focus(); }
    else amountInput.value = amount;
  });
});
$('#contributionForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = readForm(e.currentTarget);
  const state = loadState();
  state.contributions.push({ ...data, status: 'Demo recorded', createdAt: new Date().toISOString() });
  saveState(state);
  e.currentTarget.reset();
  $$('.amount-grid button').forEach(b => b.classList.remove('active'));
  render();
  toast('Contribution recorded. Live version will trigger M-Pesa STK Push.');
});
$('#supporterForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = readForm(e.currentTarget);
  const state = loadState();
  state.supporters.push({ ...data, createdAt: new Date().toISOString() });
  saveState(state);
  e.currentTarget.reset();
  render();
  toast('Supporter registered successfully.');
});
$('#volunteerForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = readForm(e.currentTarget);
  const state = loadState();
  state.volunteers.push({ ...data, createdAt: new Date().toISOString() });
  saveState(state);
  e.currentTarget.reset();
  render();
  toast('Volunteer added to Jane Team.');
});
$('#messageForm').addEventListener('submit', e => {
  e.preventDefault();
  const data = readForm(e.currentTarget);
  const state = loadState();
  state.messages.push({ ...data, createdAt: new Date().toISOString() });
  saveState(state);
  e.currentTarget.reset();
  render();
  toast('Message received and added to analysis.');
});
$('#exportBtn').addEventListener('click', () => {
  const state = loadState();
  const rows = [['type','name','phone','amount','constituency','ward','role','message','status','createdAt']];
  state.contributions.forEach(i => rows.push(['contribution', i.name, i.phone, i.amount, i.constituency, i.ward, '', '', i.status, i.createdAt]));
  state.supporters.forEach(i => rows.push(['supporter', i.name, i.phone, '', i.constituency, i.ward, '', '', '', i.createdAt]));
  state.volunteers.forEach(i => rows.push(['volunteer', i.name, i.phone, '', '', i.ward, i.role, '', '', i.createdAt]));
  state.messages.forEach(i => rows.push(['message', i.name, i.phone, '', '', '', '', i.message, '', i.createdAt]));
  const csv = rows.map(row => row.map(cell => `"${String(cell || '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'jane-tool-demo-export.csv';
  a.click();
  URL.revokeObjectURL(url);
});
$('#clearBtn').addEventListener('click', () => {
  if (confirm('Clear all demo data from this browser?')) {
    saveState(emptyState);
    render();
    toast('Demo data cleared.');
  }
});
$('.menu-toggle').addEventListener('click', () => $('.nav-links').classList.toggle('open'));
$$('.nav-links a').forEach(a => a.addEventListener('click', () => $('.nav-links').classList.remove('open')));
render();
