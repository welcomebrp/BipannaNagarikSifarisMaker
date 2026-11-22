/* विपन्न नागरिक सिफारिस मेकर — सबै डाटा यही ब्राउजरको localStorage मा बस्छ */
(() => {
'use strict';

/* ---------- सानो सहायक ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NP = '०१२३४५६७८९';
const np = v => String(v ?? '').replace(/[0-9]/g, d => NP[d]);
const en = v => String(v ?? '').replace(/[०-९]/g, d => NP.indexOf(d));
const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const t = v => esc(np(v)); // escape + नेपाली अंक
const lines = s => String(s || '').split('\n').map(x => x.trim()).filter(Boolean);
const toast = msg => { const el = $('#toast'); el.textContent = msg; el.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(() => el.classList.remove('show'), 2200); };

/* ---------- वि.सं. मिति ---------- */
const MONTHS = ['बैशाख','जेठ','असार','साउन','भदौ','असोज','कार्तिक','मंसिर','पुस','माघ','फागुन','चैत'];
const BS = {
  2080:[31,32,31,32,31,30,30,30,29,29,30,30], 2081:[31,31,32,32,31,30,30,30,29,30,30,30],
  2082:[31,31,32,31,31,30,30,30,29,30,30,30], 2083:[31,31,32,31,31,30,30,30,29,30,30,30],
  2084:[31,31,32,31,31,30,30,30,29,30,30,30], 2085:[31,32,31,32,31,30,30,30,29,30,29,31],
  2086:[31,31,32,31,31,31,30,30,29,30,30,30], 2087:[31,31,32,32,31,30,30,30,29,30,30,30],
  2088:[30,31,32,32,31,30,30,30,29,30,30,30], 2089:[30,32,31,32,31,30,30,30,29,30,30,30],
  2090:[30,32,31,32,31,30,30,30,29,30,30,30]
};
const BS_BASE = Date.UTC(2023, 3, 14); // २०८०-०१-०१
function todayBS() {
  const n = new Date();
  let days = Math.floor((Date.UTC(n.getFullYear(), n.getMonth(), n.getDate()) - BS_BASE) / 864e5);
  for (let y = 2080; y <= 2090; y++) for (let m = 0; m < 12; m++) {
    if (days < BS[y][m]) return `${y}-${pad(m + 1)}-${pad(days + 1)}`;
    days -= BS[y][m];
  }
  return '';
}
const pad = n => String(n).padStart(2, '0');
/* "२०८३/८/२", "2083-08-02" → {y,m,d} */
function parseBS(s) {
  const p = en(s).trim().split(/[-/.\s]+/).map(Number);
  if (p.length !== 3 || p.some(isNaN) || p[0] < 1900) return null;
  return { y: p[0], m: p[1], d: p[2] };
}
const normBS = s => { const d = parseBS(s); return d ? `${d.y}-${pad(d.m)}-${pad(d.d)}` : String(s || '').trim(); };
const bsSlash = s => { const d = parseBS(s); return d ? np(`${d.y}/${pad(d.m)}/${pad(d.d)}`) : t(s); };
const bsLong = s => { const d = parseBS(s); return d ? `${np(d.y)} ${MONTHS[d.m - 1] || ''} ${np(d.d)}` : t(s); };
/* आर्थिक वर्ष: साउनदेखि असारसम्म */
function fiscalYear(s) {
  const d = parseBS(s); if (!d) return '';
  const y = d.m >= 4 ? d.y : d.y - 1;
  return `${y}/${String(y + 1).slice(-3)}`;
}

/* ---------- भण्डारण ---------- */
const KEY = 'bipanna-sifaris-v1';
const DEFAULTS = {
  palika: 'देवदह नगरपालिका', office: 'नगर कार्यपालिकाको कार्यालय', branch: '(स्वास्थ्य शाखा)',
  addr1: 'केरवानी, रुपन्देही', addr2: 'लुम्बिनी प्रदेश, नेपाल', palikaShort: 'देवदह', district: 'रुपन्देही',
  logo: '', startChalani: '1',
  committee: 'संयोजक | श्री ध्रुव प्रसाद खरेल | नगर प्रमुख\nसदस्य | श्री मधुकृष्ण पौडयाल | प्रमुख प्रशासकीय अधिकृत\nसदस्य-सचिव | श्री काशिनाथ बन्जाडे | जनस्वास्थ्य अधिकृत',
  signerName: 'काशिनाथ बन्जाडे', signerPost: 'जनस्वास्थ्य अधिकृत',
  guideline: 'विपन्न नागरिक औषधी उपचार कोष निर्देशिका २०७५',
  attachments: 'नागरिकताको प्रतिलिपी\nवडा कार्यालयको सिफारिस\nबिरामी उपचार रहेको तहां अस्पतालको पत्र\nयस कार्यालयको सिफारिस सम्बन्धी निर्णयको प्रतिलिपी\nयस कार्यालयको सिफारिस',
  bodharth: 'श्री स्वास्थ्य तथा खाद्य स्वच्छता मन्त्रालय, सिंहदरबार, काठमाडौं',
  hospitals: 'नेपाल क्यान्सर अस्पताल तथा अनुसन्धान केन्द्र\nबी.पी. कोइराला मेमोरियल क्यान्सर अस्पताल, भरतपुर\nभक्तपुर क्यान्सर अस्पताल\nशहीद गंगालाल राष्ट्रिय हृदय केन्द्र\nमनमोहन कार्डियोथोरासिक भास्कुलर तथा ट्रान्सप्लान्ट सेन्टर\nराष्ट्रिय मृगौला उपचार केन्द्र\nशहीद धर्मभक्त राष्ट्रिय प्रत्यारोपण केन्द्र\nवीर अस्पताल\nत्रिभुवन विश्वविद्यालय शिक्षण अस्पताल\nलुम्बिनी प्रादेशिक अस्पताल\nयुनिभर्सल कलेज अफ मेडिकल साइन्सेज, भैरहवा\nभैरहवा मेडिकल कलेज'
};
const DISEASES = ['मुटु रोग','मृगौला रोग','क्यान्सर','पार्किन्सन्स','अल्जाइमर','हेड इन्जुरी','स्पाइनल इन्जुरी','सिकलसेल एनिमिया'];
const DISTRICTS = 'रुपन्देही नवलपरासी(ब.सु.प.पश्चिम) कपिलवस्तु पाल्पा अर्घाखाँची गुल्मी दाङ बाँके बर्दिया प्युठान रोल्पा पूर्वी-रुकुम चितवन काठमाडौं ललितपुर भक्तपुर कास्की स्याङ्जा तनहुँ नवलपरासी(ब.सु.प.पूर्व) कैलाली कञ्चनपुर सुर्खेत झापा मोरङ सुनसरी पर्सा बारा रौतहट मकवानपुर'.split(' ');

let db = { settings: { ...DEFAULTS }, records: [] };
try { const raw = localStorage.getItem(KEY); if (raw) { const o = JSON.parse(raw); db = { settings: { ...DEFAULTS, ...o.settings }, records: o.records || [] }; } } catch (e) {}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); return true; }
  catch (e) { setTimeout(() => toast('⚠ स्थायी रूपमा सेभ हुन सकेन — ब्राउजर स्टोरेज बन्द/भरिएको छ। ब्याकअप डाउनलोड गर्नुहोस्।'), 2300); return false; }
}
const S = () => db.settings;
const byId = id => db.records.find(r => r.id === id);

/* ---------- नेभिगेसन ---------- */
let current = { id: null, doc: 'letter' };
function show(view) {
  $$('.view').forEach(v => v.classList.toggle('active', v.id === 'view-' + view));
  $$('.tabs button').forEach(b => b.classList.toggle('active', b.dataset.view === view));
  if (view === 'records') renderRecords();
  if (view === 'settings') fillSettings();
  window.scrollTo(0, 0);
}
$$('.tabs button').forEach(b => b.onclick = () => { if (b.dataset.view === 'form' && !$('#rec-form [name=id]').value) resetForm(); show(b.dataset.view); });

/* ---------- फाराम ---------- */
const form = $('#rec-form');
$('#disease-chips').innerHTML = DISEASES.map((d, i) =>
  `<label><input type="radio" name="diseaseCat" value="${d}" ${i ? '' : 'required'}><span>${d}</span></label>`).join('');

function refreshLists() {
  $('#dl-district').innerHTML = DISTRICTS.map(d => `<option value="${esc(d)}">`).join('');
  const hs = new Set([...lines(S().hospitals), ...db.records.map(r => r.hospital).filter(Boolean)]);
  $('#dl-hospital').innerHTML = [...hs].map(h => `<option value="${esc(h)}">`).join('');
  $('#brand-sub').textContent = `${S().palika} · ${S().branch.replace(/[()]/g, '')}`;
  $('#rec-count').textContent = np(db.records.length);
}

function resetForm() {
  form.reset();
  form.elements.id.value = '';
  const today = todayBS();
  form.perDistrict.value = S().district; form.perPalika.value = S().palika;
  form.citDistrict.value = S().district; form.recPost.value = 'वडा अध्यक्ष';
  ['appDate', 'recDate', 'meetingDate', 'letterDate'].forEach(n => form[n].value = np(today));
  $('#form-title').textContent = 'नयाँ निवेदन दर्ता';
  updateFy();
}
function loadForm(r) {
  form.reset();
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'radio') el.checked = r[el.name] === el.value;
    else el.value = el.classList.contains('bsdate') ? np(r[el.name] || '') : (r[el.name] ?? '');
  }
  $('#form-title').textContent = `सम्पादन: ${r.name}`;
  updateFy();
}
function readForm() {
  const r = {};
  for (const el of form.elements) {
    if (!el.name) continue;
    if (el.type === 'radio') { if (el.checked) r[el.name] = el.value; else r[el.name] ??= ''; }
    else r[el.name] = el.classList.contains('bsdate') ? normBS(el.value) : el.value.trim();
  }
  return r;
}
function nextChalani(fy, exceptId) {
  const used = db.records.filter(r => r.id !== exceptId && fiscalYear(r.letterDate) === fy).map(r => +en(r.chalani) || 0);
  return Math.max(+en(S().startChalani) - 1 || 0, ...used) + 1;
}
function updateFy() {
  const fy = fiscalYear(form.letterDate.value);
  $('#fy-preview').textContent = fy ? np(fy) : '—';
  form.chalani.placeholder = fy ? `स्वतः: ${np(nextChalani(fy, form.elements.id.value))}` : 'स्वतः';
}
form.letterDate.addEventListener('input', updateFy);
$('#btn-clear').onclick = () => { if (confirm('फाराम खाली गर्ने?')) resetForm(); };

/* नमुना डाटा — अभ्यास/परीक्षणका लागि (हरेक क्लिकमा फरक नमुना) */
const SAMPLES = [
  { name: 'ज्ञान कुमारी के.सी.', age: '६३', gender: 'महिला', caste: 'क्षेत्री', perWard: '७', family: '५',
    citNo: '३५०६', citDate: '२०४१-०१-२८', occupation: 'परम्परागत कृषि', houses: '१', houseType: 'कच्ची',
    diseaseCat: 'क्यान्सर', diseaseDetail: 'Carcinoma of liver', hospital: 'नेपाल क्यान्सर अस्पताल तथा अनुसन्धान केन्द्र',
    hospitalDept: 'रिसर्च सेन्टर', applicant: 'युवराज के.सी.', phone: '९८०००००००१', recName: 'कृष्ण प्र. अधिकारी' },
  { name: 'राम बहादुर थापा', age: '५८', gender: 'पुरुष', caste: 'जनजाती', perWard: '३', family: '६',
    citNo: '१२/४४७', citDate: '२०४५-०६-१२', occupation: 'ज्याला मजदुरी', income: '१०,०००', houses: '१', houseType: 'कच्ची',
    diseaseCat: 'मृगौला रोग', diseaseDetail: 'Chronic Kidney Disease (Stage V)', hospital: 'राष्ट्रिय मृगौला उपचार केन्द्र',
    applicant: 'सीता थापा', phone: '९८०००००००२', recName: 'हरि प्रसाद शर्मा' },
  { name: 'सुनिता बि.क.', age: '४२', gender: 'महिला', caste: 'दलित', perWard: '११', family: '४',
    citNo: '४८/२०१', citDate: '२०६२-१०-०५', occupation: 'गृहिणी', houses: '१', houseType: 'कच्ची',
    diseaseCat: 'मुटु रोग', diseaseDetail: 'Rheumatic Heart Disease', hospital: 'शहीद गंगालाल राष्ट्रिय हृदय केन्द्र',
    applicant: 'सुनिता बि.क.', phone: '९८०००००००३', recName: 'गोपाल पाण्डे' }
];
let sampleIdx = 0;
$('#btn-sample').onclick = () => {
  const s = SAMPLES[sampleIdx++ % SAMPLES.length];
  resetForm();
  for (const [k, val] of Object.entries(s)) {
    const els = form.querySelectorAll(`[name="${k}"]`);
    els.forEach(el => { if (el.type === 'radio') el.checked = el.value === val; else el.value = val; });
  }
  form.applicantAddr.value = `${S().palikaShort || ''}-${s.perWard}`;
  updateFy();
  toast(`नमुना भरियो: ${s.name} — सेभ गरी कागजात हेर्नुहोस्`);
};

let submitNext = 'docs';
$$('#rec-form [type=submit]').forEach(b => b.addEventListener('click', () => submitNext = b.dataset.next));
form.addEventListener('submit', e => {
  e.preventDefault();
  const r = readForm();
  for (const k of ['age', 'perWard', 'tmpWard', 'family', 'houses', 'chalani']) r[k] = en(r[k]);
  for (const k of ['appDate', 'recDate', 'meetingDate', 'letterDate', 'citDate'])
    if (r[k] && !parseBS(r[k])) { toast('मिति मिलेन — वर्ष-महिना-गते (जस्तै २०८३-०८-०२) लेख्नुहोस्'); form[k].focus(); return; }
  const fy = fiscalYear(r.letterDate);
  if (!r.chalani && fy) r.chalani = String(nextChalani(fy, r.id));
  const dup = r.chalani && db.records.find(x => x.id !== r.id && x.chalani === r.chalani && fiscalYear(x.letterDate) === fy);
  if (dup && !confirm(`चलानी नं. ${np(r.chalani)} पहिले नै "${dup.name}" लाई दिइएको छ। फेरि पनि सेभ गर्ने?`)) return;
  if (r.id) { Object.assign(byId(r.id), r, { updatedAt: Date.now() }); }
  else { r.id = 'r' + Date.now().toString(36); r.createdAt = Date.now(); db.records.unshift(r); }
  persist();
  refreshLists();
  toast(`✓ सेभ भयो — चलानी नं. ${np(r.chalani || '—')}`);
  if (submitNext === 'docs') openDocs(r.id, 'letter'); else loadForm(byId(r.id));
});
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's' && $('#view-form').classList.contains('active')) {
    e.preventDefault(); submitNext = 'stay'; form.requestSubmit();
  }
});

/* ---------- अभिलेख ---------- */
function renderRecords() {
  const fys = [...new Set(db.records.map(r => fiscalYear(r.letterDate)).filter(Boolean))].sort().reverse();
  const sel = $('#flt-fy'), keep = sel.value;
  sel.innerHTML = `<option value="">सबै आ.व.</option>` + fys.map(f => `<option value="${f}">आ.व. ${np(f)}</option>`).join('');
  sel.value = fys.includes(keep) ? keep : '';
  const q = en($('#search').value.trim().toLowerCase());
  const rows = db.records.filter(r => (!sel.value || fiscalYear(r.letterDate) === sel.value) &&
    (!q || en([r.name, r.perWard, r.chalani, r.hospital, r.diseaseCat, r.diseaseDetail, r.citNo].join(' ')).toLowerCase().includes(q)));
  $('#rec-body').innerHTML = rows.map(r => `<tr>
    <td><b>${t(r.chalani || '—')}</b></td>
    <td>${esc(r.name)}<br><small class="muted">${t(r.age)} वर्ष · ${esc(r.gender)}</small></td>
    <td>${t(r.perWard)}</td>
    <td>${esc(r.diseaseCat)}${r.diseaseDetail ? `<br><small class="muted">${esc(r.diseaseDetail)}</small>` : ''}</td>
    <td>${esc(r.hospital)}</td>
    <td>${r.meetingDate ? bsSlash(r.meetingDate) : '<span class="pill warn">बाँकी</span>'}</td>
    <td class="acts">
      <button class="btn sm" data-act="annex" data-id="${r.id}">फाराम</button>
      <button class="btn sm" data-act="decision" data-id="${r.id}">निर्णय</button>
      <button class="btn sm primary" data-act="letter" data-id="${r.id}">पत्र</button>
      <button class="btn sm ghost" data-act="edit" data-id="${r.id}" title="सम्पादन">✎</button>
      <button class="btn sm ghost danger" data-act="del" data-id="${r.id}" title="हटाउनुहोस्">✕</button>
    </td></tr>`).join('');
  $('#rec-empty').style.display = rows.length ? 'none' : 'block';
  $('#rec-empty').textContent = db.records.length ? 'खोजसँग मिल्ने अभिलेख भेटिएन।' : 'अहिलेसम्म कुनै अभिलेख छैन। “नयाँ निवेदन” बाट सुरु गर्नुहोस्।';
}
$('#search').oninput = renderRecords; $('#flt-fy').onchange = renderRecords;
$('#rec-body').onclick = e => {
  const b = e.target.closest('button[data-act]'); if (!b) return;
  const r = byId(b.dataset.id);
  if (b.dataset.act === 'edit') { loadForm(r); show('form'); }
  else if (b.dataset.act === 'del') {
    if (confirm(`"${r.name}" को अभिलेख हटाउने? यो फिर्ता आउँदैन।`)) {
      db.records = db.records.filter(x => x !== r); persist(); refreshLists(); renderRecords(); toast('हटाइयो');
    }
  } else openDocs(r.id, b.dataset.act);
};

/* ---------- कागजात ---------- */
function openDocs(id, doc) { current = { id, doc }; show('docs'); renderDoc(); }
$$('#doc-seg button').forEach(b => b.onclick = () => { current.doc = b.dataset.doc; renderDoc(); });
$('#btn-back').onclick = () => show('records');
$('#btn-edit').onclick = () => { loadForm(byId(current.id)); show('form'); };
$('#btn-print').onclick = () => window.print();

function renderDoc() {
  const r = byId(current.id); if (!r) return show('records');
  $$('#doc-seg button').forEach(b => b.classList.toggle('active', b.dataset.doc === current.doc));
  const hint = {
    annex: 'वडा कार्यालयले भर्ने फाराम — प्रिन्ट गरी निवेदक र वडा अध्यक्षको दस्तखत तथा छाप लगाउनुहोस्।',
    decision: `बैठक मिति ${bsSlash(r.meetingDate)} का सबै बिरामीहरू यही निर्णयमा समावेश छन्।`,
    letter: `चलानी नं. ${np(r.chalani || '—')} · प.सं. ${np(fiscalYear(r.letterDate) || '—')}`
  };
  $('#doc-hint').innerHTML = hint[current.doc];
  $('#sheet').innerHTML = { annex: docAnnex, decision: docDecision, letter: docLetter }[current.doc](r);
  document.title = `${{ annex: 'अनुसूची-२', decision: 'निर्णय', letter: 'सिफारिस पत्र' }[current.doc]} - ${r.name}`;
}

const committee = () => lines(S().committee).map(l => { const [role = '', name = '', post = ''] = l.split('|').map(x => x.trim()); return { role, name, post }; });
const plain = n => String(n || '').replace(/^श्री\s*/, '');

function letterhead(refs) {
  const s = S();
  return `<div class="lh">
    <div>${s.logo ? `<img src="${s.logo}" alt="">` : ''}</div>
    <div><div class="l1">${esc(s.palika)}</div><div class="l2">${esc(s.office)}</div>
      <div class="l3">${esc(s.branch)}</div><div class="l3">${esc(s.addr1)}</div><div class="l3">${esc(s.addr2)}</div></div>
    <div></div></div>${refs || ''}<hr class="rule">`;
}

function docLetter(r) {
  const s = S();
  const fy = fiscalYear(r.letterDate);
  const refs = `<div class="refrow"><div>प.सं. ${np(fy || '……')}<br>च.नं. ${t(r.chalani || '……')}</div><div>मिति: ${r.letterDate ? bsSlash(r.letterDate) : '……'}</div></div>`;
  const ward = r.perWard;
  const att = lines(s.attachments);
  const bod = [...lines(s.bodharth), `श्री ${plain(r.name)}, ${s.palikaShort || s.palika}-${ward}`];
  return `${letterhead(refs)}
  <p class="to">श्री <b>${esc(r.hospital)}</b>${r.hospitalDept ? `<br>${esc(r.hospitalDept)}` : ''}</p>
  <p class="subject">विषय: <u>सिफारिस गरिएको बारे ।</u></p>
  <div class="body">
    <p>उपरोक्त सम्बन्धमा यस नगरपालिका अन्तरगत वडा नं. ${t(ward)} मा स्थायी बसोबास भएका <b>${esc(r.name)}</b> ${esc(r.diseaseCat)} रोगबाट पीडित भई तहाँ अस्पतालमा उपचार गराई रहेकोमा सहुलियतको माग गर्दै यस कार्यालयमा निवेदन पेश गर्नु भएकोले निजलाई विपन्न नागरिक औषधी उपचार कोष मार्फत सहुलियत उपचार गराई दिनु हुन विपन्न नागरिक उपचार सिफारिस समितिको मिति ${bsLong(r.meetingDate)} गते बसेको बैठकको निर्णयानुसार अनुरोध छ ।</p>
    ${att.length ? `<p style="text-indent:0">निजका तपसिल बमोजिमका कागजातहरु यसै पत्र साथ संलग्न छन् ।</p>
    <ol class="att">${att.map(a => `<li>${t(a)}</li>`).join('')}</ol>` : ''}
  </div>
  <div class="sigblock"><div class="sig"><div class="line"></div>${esc(s.signerName)}<br>${esc(s.signerPost)}</div></div>
  <div class="bodharth"><b>बोधार्थ:</b><ol>${bod.map(b => `<li>${t(b)}</li>`).join('')}</ol></div>`;
}

function docDecision(r) {
  const s = S();
  const group = db.records.filter(x => x.meetingDate && x.meetingDate === r.meetingDate)
    .sort((a, b) => (+a.chalani || 0) - (+b.chalani || 0) || a.createdAt - b.createdAt);
  const list = group.length ? group : [r];
  const d = parseBS(r.meetingDate);
  const when = d ? `${np(d.y)} साल ${MONTHS[d.m - 1]} ${np(d.d)}` : '……';
  const c = committee();
  const chair = c[0] ? plain(c[0].name) : '……';
  return `${letterhead()}
  <div class="body"><p>आज मिति ${when} गतेका दिन विपन्न नागरिक औषधी उपचार सिफारिस समितिका संयोजक श्री ${esc(chair)} ज्यूको अध्यक्षतामा बसेको बैठकले यस कार्यालयमा पर्न आएका निवेदन अनुसारका विपन्न बिरामीलाई निम्न अनुसारको अस्पतालमा सहुलियत उपचार खर्चको लागि ${t(s.guideline)} बमोजिम सिफारिस गर्ने निर्णय गरियो ।</p></div>
  <b>उपस्थिति</b>
  <table class="att-table">${c.map(m => `<tr><td>${esc(m.role)}</td><td>${esc(m.name)}</td><td>${esc(m.post)}</td><td class="s"></td></tr>`).join('')}</table>
  <table class="doc-table">
    <thead><tr><th>सि.नं.</th><th>बिरामीको नाम</th><th>उमेर / लिङ्ग</th><th>ठेगाना</th><th>ना.प्र.नं., जारी मिति, जिल्ला</th><th>रोगको किसिम</th><th>सिफारिस गरिएको अस्पताल</th></tr></thead>
    <tbody>${list.map((x, i) => `<tr>
      <td class="c">${np(i + 1)}.</td><td>${esc(x.name)}</td>
      <td class="c">${t(x.age)} वर्ष / ${esc((x.gender || '').slice(0, 1))}.</td>
      <td>${esc(x.perPalika ? x.perPalika.replace(/\s*(नगरपालिका|गाउँपालिका|उपमहानगरपालिका|महानगरपालिका)$/, '') : '')}-${t(x.perWard)}</td>
      <td>${t(x.citNo)}<br>${x.citDate ? bsSlash(x.citDate) : ''}<br>${esc(x.citDistrict)}</td>
      <td>${esc(x.diseaseDetail || x.diseaseCat)}</td>
      <td>${esc(x.hospital)}</td></tr>`).join('')}</tbody>
  </table>
  <div class="sigrow">${c.slice().reverse().map(m => `<div class="sig"><div class="line"></div>${esc(plain(m.name))}<br>${esc(m.post)}</div>`).join('')}</div>`;
}

function docAnnex(r) {
  const s = S();
  const v = (x, w) => `<span class="v" ${w ? `style="min-width:${w}px"` : ''}>${t(x) || '&nbsp;'}</span>`;
  const opts = (arr, val, sep = '/') => arr.map(o => `<span class="opt ${o === val ? 'on' : ''}">${o}</span>`).join(sep);
  const tmpD = r.tmpDistrict || r.perDistrict, tmpP = r.tmpPalika || r.perPalika, tmpW = r.tmpWard || r.perWard;
  return `<div class="annex-head">
    <div class="t1">अनुसूची २</div><div>(दफा ४ उप दफा (१) संग सम्बन्धित)</div>
    <div class="t3">विपन्न नागरिक आवेदन तथा सिफारिस फाराम</div></div>
  <p style="margin:10px 0 0">श्रीमान् अध्यक्ष ज्यू,<br>वडा नं. ${v(r.perWard, 30)} ${esc(r.perPalika || s.palika)}, ${esc(r.perDistrict || s.district)} ।<br>
  देहाय बमोजिम विवरण भरी नागरिक औषधि उपचार सहुलियतका लागि अनुरोध गर्दछु ।</p>
  <table class="annex">
   <tr><td class="n">१.</td><td><b>वैयक्तिक विवरण:</b><br>
     बिरामीको नाम: ${v(r.name, 220)} उमेर: ${v(r.age, 40)} लिङ्ग: ${v(r.gender, 60)}<br>
     स्थायी ठेगाना: जिल्ला: ${v(r.perDistrict)} पालिका: ${v(r.perPalika)} वडा: ${v(r.perWard, 30)}<br>
     अस्थायी ठेगाना: जिल्ला: ${v(tmpD)} पालिका: ${v(tmpP)} वडा: ${v(tmpW, 30)}<br>
     जातीगत विवरण: ${opts(['ब्राम्हण','क्षेत्री','आदिवासी','जनजाती','दलित','अल्पसंख्यक','अन्य'], r.caste)}<br>
     परिवार संख्या: ${v(r.family, 40)}</td></tr>
   <tr><td class="n">२.</td><td><b>आय स्रोत:</b><br>पेशा र व्यवसाय: ${v(r.occupation, 200)}<br>
     रोजगारी (स्वदेशी/विदेशी): ${v(r.employment, 200)}<br>
     उद्यम / व्यवसाय: ${v(r.business, 140)} &nbsp; अनुमानित मासिक आय: ${v(r.income, 100)}</td></tr>
   <tr><td class="n">३.</td><td><b>जग्गा जमिन (क्षेत्रफल र स्थान समेत)</b><br>
     भौतिक संरचना: (घर/टहरा आदिको संख्या: ${v(r.houses, 30)} ${opts(['कच्ची','पक्की'], r.houseType)})<br>
     सवारी साधन: ${v(r.vehicle, 200)}<br>बैंक मौज्दात: ${v(r.bank, 200)}<br>सुन चाँदी: ${v(r.gold, 200)}<br>नगद: ${v(r.cash, 200)}</td></tr>
   <tr><td class="n">४.</td><td>बिरामीको रोगको किसिम: ${opts(DISEASES, r.diseaseCat, ', ')} ।
     ${r.diseaseDetail ? `<br>निदान: ${v(r.diseaseDetail, 200)}` : ''}</td></tr>
   <tr><td class="n">५.</td><td>संलग्न कागजातहरु: क. बिरामीको नागरिकताको प्रतिलिपी (बालकको हकमा जन्म दर्ताको प्रमाणपत्रको प्रतिलिपी) ख. रोग निदान भएको प्रेस्क्रिप्सन</td></tr>
   <tr><td class="n">६.</td><td>उपचार सहुलियतका लागि सिफारिस माग गरेको अस्पताल: ${v(r.hospital, 220)}</td></tr>
   <tr><td class="n">७.</td><td>उपर्युक्त बमोजिमको व्यहोरा साँचो हो झुठा ठहरे सहुँला बुझाउँला ।<br>
     निवेदकको नाम: ${v(r.applicant || r.name, 220)}<br>ठेगाना: ${v(r.applicantAddr || `${r.perPalika ? r.perPalika.split(' ')[0] : ''}-${r.perWard}`, 160)}<br>
     दस्तखत: ${v('', 120)} मिति: ${v(r.appDate ? bsSlash(r.appDate) : '', 90)} सम्पर्क नं.: ${v(r.phone, 100)}</td></tr>
   <tr><td class="n">८.</td><td><b>सिफारिसको व्यहोरा:</b><br>सिफारिस गर्ने:<br>
     नाम: ${v(r.recName, 200)} &nbsp; पद: ${v(r.recPost, 110)}<br>
     मिति: ${v(r.recDate ? bsSlash(r.recDate) : '', 110)} &nbsp; दस्तखत: ${v('', 110)} &nbsp; कार्यालयको छाप: <span class="stamp"></span></td></tr>
  </table>`;
}

/* ---------- सेटिङ ---------- */
const setForm = $('#set-form');
function fillSettings() {
  for (const el of setForm.elements) if (el.name) el.value = el.name === 'startChalani' ? np(S()[el.name]) : (S()[el.name] ?? '');
  $('#logo-prev').src = S().logo || '';
}
setForm.addEventListener('submit', e => {
  e.preventDefault();
  for (const el of setForm.elements) if (el.name) S()[el.name] = el.name === 'startChalani' ? en(el.value) || '1' : el.value.trim();
  persist(); refreshLists(); toast('✓ सेटिङ सेभ भयो');
});
$('#logo-file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  const img = new Image(), rd = new FileReader();
  rd.onload = () => { img.src = rd.result; };
  img.onload = () => { // सानो बनाएर राख्ने
    const c = document.createElement('canvas'), k = Math.min(1, 240 / Math.max(img.width, img.height));
    c.width = img.width * k; c.height = img.height * k;
    c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
    S().logo = c.toDataURL('image/png'); $('#logo-prev').src = S().logo;
    if (persist()) toast('✓ लोगो राखियो');
  };
  rd.readAsDataURL(f);
};
$('#logo-clear').onclick = () => { S().logo = ''; $('#logo-prev').removeAttribute('src'); persist(); toast('लोगो हटाइयो'); };
$('#btn-export').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 1)], { type: 'application/json' }));
  a.download = `bipanna-sifaris-backup-${en(todayBS())}.json`; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
};
$('#import-file').onchange = e => {
  const f = e.target.files[0]; if (!f) return;
  f.text().then(txt => {
    const o = JSON.parse(txt);
    if (!Array.isArray(o.records)) throw 0;
    if (!confirm(`ब्याकअपमा ${np(o.records.length)} वटा अभिलेख छन्। हालको डाटा यसले बदल्छ। अघि बढ्ने?`)) return;
    db = { settings: { ...DEFAULTS, ...o.settings }, records: o.records };
    persist(); refreshLists(); fillSettings(); toast('✓ ब्याकअप फिर्ता ल्याइयो');
  }).catch(() => toast('⚠ यो ब्याकअप फाइल मिलेन')).finally(() => e.target.value = '');
};

/* ---------- सुरु ---------- */
refreshLists();
resetForm();
})();
