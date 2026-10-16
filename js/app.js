/* Folio: standalone, local-first personal finance. No libraries, accounts or server required. */
(() => {
  'use strict';
  const KEY = 'folio-finance-v1';
  // Presentation colors only. Finance calculations and saved category colors are unchanged.
  const GRAPH_COLORS = ['#577A55','#94505C','#C4A16C','#91AB87','#632D3B','#CBD5B3','#304D3B'];
  const $ = (selector, root=document) => (typeof root==='string'?document.querySelector(root):root).querySelector(selector);
  const $$ = (selector, root=document) => Array.from((typeof root==='string'?document.querySelector(root):root).querySelectorAll(selector));
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const uid = () => (crypto?.randomUUID?.() || `id_${Date.now()}_${Math.random().toString(36).slice(2,9)}`);
  const today = () => localYmd(new Date());
  const localYmd = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  const parseDate = s => {const [y,m,d] = String(s).split('-').map(Number);return new Date(y,m-1,d||1);};
  const shiftDays = (s,n) => {const d=parseDate(s);d.setDate(d.getDate()+n);return localYmd(d);};
  const firstDay = s => `${s.slice(0,7)}-01`;
  const lastDay = s => {const d=parseDate(firstDay(s));d.setMonth(d.getMonth()+1);d.setDate(0);return localYmd(d)};
  const monthName = s => parseDate(firstDay(s)).toLocaleDateString('en-US',{month:'long',year:'numeric'});
  const formatDate = s => parseDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  const shortDate = s => parseDate(s).toLocaleDateString('en-US',{month:'short',day:'numeric'});
  const cap = (n,min,max) => Math.max(min,Math.min(max,n));
  const currency = n => {const x=Number(n)||0;try{return new Intl.NumberFormat('en-US',{style:'currency',currency:state.settings.currency,minimumFractionDigits:2,maximumFractionDigits:2}).format(x)}catch{return `$${x.toFixed(2)}`}};
  const amountShort = n => {const a=Math.abs(n);return a>=1000000 ? `${(n/1000000).toFixed(1)}m` : a>=1000?`${(n/1000).toFixed(a>=10000?0:1)}k`:Math.round(n).toString()};
  const sum = ar => ar.reduce((n,v)=>n+(Number(v)||0),0);
  const sumAmounts = ar => sum(ar.map(v=>v.amount));
  const iconPaths = {
    dashboard:'<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
    transactions:'<path d="M7 7h14m-4-4 4 4-4 4M17 17H3m4-4-4 4 4 4"/>',
    budgets:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 10h18M16 15h2"/>',
    scheduled:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18m-11 4 2 2 4-4"/>',
    insights:'<path d="M3 3v18h18M7 16l4-5 4 2 5-8"/>',
    settings:'<path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06-1.75 1.75-.06-.06a1.65 1.65 0 0 0-1.82-.33l-.1.04a1.65 1.65 0 0 0-.99 1.51V20h-2.5v-.1a1.65 1.65 0 0 0-.98-1.51l-.1-.04a1.65 1.65 0 0 0-1.83.33l-.06.06-1.75-1.75.06-.06a1.65 1.65 0 0 0 .33-1.82l-.04-.1a1.65 1.65 0 0 0-1.51-.99H6v-2.5h.1a1.65 1.65 0 0 0 1.51-.98l.04-.1a1.65 1.65 0 0 0-.33-1.83l-.06-.06 1.75-1.75.06.06a1.65 1.65 0 0 0 1.82.33l.1-.04a1.65 1.65 0 0 0 .99-1.51V4h2.5v.1a1.65 1.65 0 0 0 .98 1.51l.1.04a1.65 1.65 0 0 0 1.83-.33l.06-.06 1.75 1.75-.06.06a1.65 1.65 0 0 0-.33 1.82l.04.1a1.65 1.65 0 0 0 1.51.99H21v2.5h-.1a1.65 1.65 0 0 0-1.51.98Z"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',chevronLeft:'<path d="m15 18-6-6 6-6"/>',chevronRight:'<path d="m9 18 6-6-6-6"/>',arrowRight:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
    expense:'<path d="M12 4v16m-7-7 7 7 7-7"/>',income:'<path d="M12 20V4m-7 7 7-7 7 7"/>',flow:'<path d="M3 12h18m-5-5 5 5-5 5M8 7 3 12l5 5"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/>',edit:'<path d="M12 19h9M4 16l12-12a2 2 0 0 1 3 3L7 19H4v-3Z"/>',trash:'<path d="M4 7h16M9 4h6m-9 3 1 14h10l1-14M10 11v6m4-6v6"/>',
    x:'<path d="M18 6 6 18M6 6l12 12"/>',shield:'<path d="m12 22 7-4V6l-7-4-7 4v12l7 4Z"/><path d="m9 12 2 2 4-4"/>',receipt:'<path d="M4 3h16v18l-4-2-4 2-4-2-4 2V3Zm4 6h8M8 13h8"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 10h18"/>',spark:'<path d="m12 2 2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4L12 2Z"/>',
    download:'<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',upload:'<path d="M12 17V5m-5 5 5-5 5 5M4 17v4h16v-4"/>',
    alert:'<path d="M12 3 2 21h20L12 3Zm0 6v5m0 3v.1"/>',dots:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',check:'<path d="m5 12 4 4L19 6"/>',wallet:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18m-5 6h2"/>',repeat:'<path d="M20 7h-9a5 5 0 0 0-5 5m-2-4 2 4 4-2M4 17h9a5 5 0 0 0 5-5m2 4-2-4-4 2"/>'
  };
  const icon = (name) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.9" aria-hidden="true">${iconPaths[name] || iconPaths.spark}</svg>`;
  const initialState = () => ({
    version:1,
    settings:{currency:'USD',autoPost:false},
    wallets:[{id:'cash',name:'Cash',openingBalance:0,color:'#6658de'},{id:'bank',name:'Bank account',openingBalance:0,color:'#36b497'}],
    categories:[
      {id:'groceries',name:'Groceries',kind:'expense',emoji:'🛒',color:'#8b7bed'},
      {id:'cat',name:'Cat care',kind:'expense',emoji:'🐈',color:'#e89b64'},
      {id:'skincare',name:'Skincare',kind:'expense',emoji:'🧴',color:'#dc91b9'},
      {id:'beauty',name:'Personal care',kind:'expense',emoji:'✨',color:'#ae88e3'},
      {id:'health',name:'Health',kind:'expense',emoji:'💊',color:'#4ebcaf'},
      {id:'transport',name:'Transport',kind:'expense',emoji:'🚗',color:'#7797dc'},
      {id:'eating',name:'Eating out',kind:'expense',emoji:'🍽️',color:'#e4ad50'},
      {id:'shopping',name:'Shopping',kind:'expense',emoji:'🛍️',color:'#d785a8'},
      {id:'bills',name:'Bills',kind:'expense',emoji:'🧾',color:'#8994a8'},
      {id:'entertainment',name:'Entertainment',kind:'expense',emoji:'🎬',color:'#8d94e0'},
      {id:'other-expense',name:'Other expenses',kind:'expense',emoji:'📦',color:'#adb3c7'},
      {id:'salary',name:'Salary',kind:'income',emoji:'💼',color:'#46ac88'},
      {id:'gift',name:'Gifts',kind:'income',emoji:'🎁',color:'#cf83d0'},
      {id:'refund',name:'Refunds',kind:'income',emoji:'↩️',color:'#4fa6b0'},
      {id:'other-income',name:'Other income',kind:'income',emoji:'💰',color:'#93b466'}
    ],
    transactions:[],budgets:[],schedules:[]
  });
  // The original Oct 2026 Cashew export stores category caps as percentages
  // (is_absolute_spending_limit = 0). v1.1 incorrectly treated them as USD.
  // Migrate only this verified original export, without guessing for other backups.
  function normalizeCashewBudgets(s){
    const verified='cashew-budget-01f3b5c8-de37-4cb4-9835-67fee6e99e37';
    for(const b of s.budgets){
      if(b.parentBudgetId===verified && b.importedFromCashew && !b.limitMode) b.limitMode='percent';
      if(b.parentBudgetId && !b.limitMode) b.limitMode='amount';
    }
    return s;
  }
  function loadState(){
    try{
      const s=JSON.parse(localStorage.getItem(KEY) || 'null');
      if(s && s.version===1 && Array.isArray(s.transactions) && Array.isArray(s.wallets) && Array.isArray(s.categories) && Array.isArray(s.budgets) && Array.isArray(s.schedules) && s.settings) { normalizeCashewBudgets(s); return s; }
    }catch(e){console.warn('Could not load stored data',e)}
    return initialState();
  }
  // GitHub settings and access token are deliberately kept OUT of state/JSON exports.
  const SYNC_CONFIG_KEY='folio-github-sync-v1';
  const SYNC_TOKEN_KEY='folio-github-token-v1';
  const syncDefaults={owner:'',repo:'folio-private-data',branch:'main',lastSha:null,lastSyncedAt:null,localRevision:0,syncedRevision:-1,rememberToken:false};
  function readSyncSettings(){try{return {...syncDefaults,...JSON.parse(localStorage.getItem(SYNC_CONFIG_KEY)||'{}')}}catch{return {...syncDefaults}}}
  let syncConfig=readSyncSettings();
  let syncToken=syncConfig.rememberToken?(localStorage.getItem(SYNC_TOKEN_KEY)||''):'';
  let syncPassphrase=''; // Session-only; never stored, exported, logged, or sent to GitHub.
  let syncBusy=false, syncMessage='', syncMessageError=false;
  function saveSyncConfig(){localStorage.setItem(SYNC_CONFIG_KEY,JSON.stringify(syncConfig));}
  let state=loadState();
  let route='dashboard', selectedMonth=firstDay(today());
  let selectedBudgetId=null, selectedBudgetCategory=null, budgetDateOverride=null;
  const filters={type:'all',category:'all',wallet:'all',tag:'all',status:'all',search:''};
  const TAG_OPTIONS=['Essential','Optional','Restock','Subscription','Monthly','One-off','Planned','Emergency','Gift'];
  let toastTimeout=0;
  function notify(message,bad=false){
    const region=$('#toastRegion');const element=document.createElement('div');element.className=`toast ${bad?'error':''}`;element.textContent=message;region.appendChild(element);setTimeout(()=>element.remove(),3600);clearTimeout(toastTimeout);
  }
  function save(dirty=true){
    try{
      localStorage.setItem(KEY,JSON.stringify(state));
      if(dirty){syncConfig.localRevision++;saveSyncConfig();}
      return true;
    }catch(e){notify('Could not save locally. Export a backup and free up browser storage.',true);return false}
  }
  const hasPendingSync=()=>syncConfig.localRevision!==syncConfig.syncedRevision;
  function renderSyncIndicator(){
    const element=$('#syncSidebarStatus');if(!element)return;
    element.textContent=!syncConfig.owner?'○ GitHub not connected':syncBusy?'↻ Sync in progress':hasPendingSync()?'● Local changes not pushed':`✓ Last sync: ${syncConfig.lastSyncedAt?new Date(syncConfig.lastSyncedAt).toLocaleString():'Not yet synced'}`;
    element.classList.toggle('sync-dirty',Boolean(syncConfig.owner && hasPendingSync()));
  }

  const walletById = id => state.wallets.find(w=>w.id===id);
  const categoryById = id => state.categories.find(c=>c.id===id);
  // Imported Cashew categories may have nested parent/child relationships.
  function categoryAncestors(id){const chain=[];const seen=new Set();let current=categoryById(id);
    while(current && !seen.has(current.id) && chain.length<15){chain.unshift(current);seen.add(current.id);current=categoryById(current.parentId)}
    return chain;
  }
  const categoryFullName = id => categoryAncestors(id).map(c=>c.name).join(' › ');
  const topCategory = id => categoryAncestors(id)[0] || categoryById(id);
  const includesCategory = (budgetIds,categoryId) => !budgetIds?.length || categoryAncestors(categoryId).some(c=>budgetIds.includes(c.id));
  const displayCategory = tx => {
    if(tx.type==='transfer')return {name:'Transfer',emoji:'↔️',color:'#968be8'};
    const category=categoryById(tx.categoryId);
    return category ? {...category,name:categoryFullName(category.id)} : {name:'Uncategorized',emoji:'📦',color:'#a0a3b3'};
  };
  const transactionLabel = tx => tx.payee?.trim() || (tx.type==='transfer'?`${walletById(tx.walletId)?.name||'Wallet'} → ${walletById(tx.toWalletId)?.name||'Wallet'}`:displayCategory(tx).name);
  function walletBalance(walletId){const w=walletById(walletId);if(!w)return 0;let n=Number(w.openingBalance)||0;for(const tx of state.transactions){if(tx.type==='transfer'){if(tx.walletId===walletId)n-=tx.amount;if(tx.toWalletId===walletId)n+=tx.amount}else if(tx.walletId===walletId){n+=tx.type==='income'?tx.amount:-tx.amount}}return n}
  const inRange = (tx,start,end) => tx.date>=start && tx.date<=end;
  const txOfType = (type,start,end) => state.transactions.filter(tx=>tx.type===type && inRange(tx,start,end) && !tx.excluded);
  const monthTotals = ym => {const a=firstDay(ym),b=lastDay(ym);return {expense:sumAmounts(txOfType('expense',a,b)),income:sumAmounts(txOfType('income',a,b))}};
  const sortedTransactions = arr => [...arr].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||'').localeCompare(a.createdAt||''));
  function dateForAnchor(anchor,frequency,n){
    if(frequency==='daily') return shiftDays(anchor,n);
    if(frequency==='weekly') return shiftDays(anchor,n*7);
    const a=parseDate(anchor),months=(frequency==='yearly'?12:1)*n;
    const start=new Date(a.getFullYear(),a.getMonth()+months,1);
    const last=new Date(start.getFullYear(),start.getMonth()+1,0).getDate();
    start.setDate(Math.min(a.getDate(),last));return localYmd(start);
  }
  function occurrences(schedule,until,limit=1200){const dates=[];if(!schedule.startDate || schedule.startDate>until)return dates;for(let n=0;n<(schedule.oneTime?1:limit);n++){
    const date=dateForAnchor(schedule.startDate,schedule.frequency,n);
    if(date>until || (schedule.endDate && date>schedule.endDate)) break;
    if(!schedule.skipDates?.includes(date)) dates.push(date);
  }return dates}
  const occurrenceExists = (s,date) => state.transactions.some(tx=>tx.scheduleId===s.id && tx.occurrenceDate===date);
  function generatedFromSchedule(s,occurrenceDate,paidDate=occurrenceDate){return {id:uid(),type:s.type,amount:s.amount,date:paidDate,categoryId:s.type==='transfer'?'':s.categoryId,walletId:s.walletId,toWalletId:s.type==='transfer'?s.toWalletId:'',payee:s.payee||'',note:s.note||'',tags:[...(s.tags||[])],excluded:false,scheduleId:s.id,occurrenceDate,createdAt:new Date().toISOString()}}
  function plannedOccurrences(start,end){
    const rows=[];
    for(const schedule of state.schedules){
      if(!schedule.active)continue;
      for(const date of occurrences(schedule,end)){
        if(date<start || occurrenceExists(schedule,date))continue;
        rows.push({id:`${schedule.id}::${date}`,date,type:schedule.type,amount:schedule.amount,categoryId:schedule.categoryId,walletId:schedule.walletId,toWalletId:schedule.toWalletId,payee:schedule.payee||'',note:schedule.note||'',tags:schedule.tags||[],scheduleId:schedule.id,occurrenceDate:date,planned:true});
      }
    }
    return rows;
  }
  function postingLabel(s){return s?.type==='income'?'Receive':s?.type==='transfer'?'Complete':'Pay'}
  function postOccurrence(scheduleId,occurrenceDate){
    const s=state.schedules.find(s=>s.id===scheduleId);
    if(!s||!s.active){notify('This schedule is not active.',true);return}
    if(!/^\d{4}-\d{2}-\d{2}$/.test(occurrenceDate)||!occurrences(s,occurrenceDate).includes(occurrenceDate)){
      notify('This scheduled date is not valid.',true);return;
    }
    if(occurrenceExists(s,occurrenceDate)){notify('This payment is already recorded.');render();return}
    // Record the date money actually moved, not the original due date.
    state.transactions.push(generatedFromSchedule(s,occurrenceDate,today()));
    if(!save())return;
    if(route==='transactions'){selectedMonth=firstDay(today());filters.status='all';}
    render();notify(`${s.type==='income'?'Income received':s.type==='transfer'?'Transfer completed':'Payment recorded'} as a transaction for today`);
  }
  function skipOccurrence(scheduleId,occurrenceDate){
    const s=state.schedules.find(s=>s.id===scheduleId);if(!s||!s.active||occurrenceExists(s,occurrenceDate))return;
    if(!window.confirm(`Skip ${s.payee||'this payment'} scheduled for ${formatDate(occurrenceDate)}?`))return;
    s.skipDates=s.skipDates||[];
    if(!s.skipDates.includes(occurrenceDate))s.skipDates.push(occurrenceDate);
    save();render();notify('Scheduled occurrence skipped');
  }
  function processSchedules(){let count=0;for(const s of state.schedules){if(!s.active || !s.autoPost)continue;for(const date of occurrences(s,today())){if(!occurrenceExists(s,date)){state.transactions.push(generatedFromSchedule(s,date));count++}}}if(count)save();return count}
  function pendingSchedule(s){return s.active?occurrences(s,today()).filter(date=>!occurrenceExists(s,date)):[]}
  function nextSchedule(s){if(!s.active)return null;for(let n=0;n<(s.oneTime?1:1200);n++){const date=dateForAnchor(s.startDate,s.frequency,n);if(s.endDate && date>s.endDate)return null;if(date>=today() && !s.skipDates?.includes(date) && !occurrenceExists(s,date))return date;}return null}
  function periodRange(period, reference=today()){
    const d=parseDate(reference);
    if(period==='daily')return {start:reference,end:reference};
    if(period==='weekly'){const monday=(d.getDay()+6)%7;return {start:shiftDays(reference,-monday),end:shiftDays(reference,6-monday)}}
    if(period==='yearly')return {start:`${d.getFullYear()}-01-01`,end:`${d.getFullYear()}-12-31`};
    return {start:firstDay(reference),end:lastDay(reference)};
  }
  function budgetRange(b,reference=today()){
    if(b.period==='custom')return {start:b.startDate||today(),end:b.endDate||today()};
    return periodRange(b.period,reference);
  }
  function budgetTransactions(b,reference=today()){
    const {start,end}=budgetRange(b,reference);
    return txOfType('expense',start,end).filter(tx=>includesCategory(b.categoryIds,tx.categoryId));
  }
  function budgetSpent(b,reference=today()){return sumAmounts(budgetTransactions(b,reference))}
  function parentBudgets(){return state.budgets.filter(b=>!b.parentBudgetId)}
  function categoryCaps(parent){return state.budgets.filter(b=>b.parentBudgetId===parent.id && b.active!==false)}
  function capValue(capBudget,parent){return capBudget.limitMode==='percent'?parent.amount*(Number(capBudget.amount)||0)/100:(Number(capBudget.amount)||0)}
  function budgetStats(reference=today()){
    const budgets=parentBudgets().filter(b=>b.active!==false);
    return {budget:sum(budgets.map(b=>b.amount)),spent:sum(budgets.map(b=>budgetSpent(b,reference)))};
  }
  function budgetNamePeriod(b,r){
    if(b.period==='custom')return 'One-time · '+shortDate(r.start)+' – '+shortDate(r.end);
    if(b.period==='daily')return formatDate(r.start);
    if(b.period==='monthly')return monthName(r.start);
    if(b.period==='yearly')return String(parseDate(r.start).getFullYear());
    return shortDate(r.start)+' – '+shortDate(r.end);
  }
  function budgetPeriodOffset(period,start,n){
    if(period==='yearly'){const d=parseDate(start);return localYmd(new Date(d.getFullYear()+n,d.getMonth(),1))}
    if(period==='weekly')return shiftDays(start,n*7);
    if(period==='daily')return shiftDays(start,n);
    const d=parseDate(start);return localYmd(new Date(d.getFullYear(),d.getMonth()+n,1));
  }
  function budgetRef(b){
    // The overview follows the month chosen elsewhere, while weekly/daily views
    // stay aligned to today's week/day when the selected month is the current one.
    if(budgetDateOverride)return budgetDateOverride;
    const selected=selectedMonth.slice(0,7),current=today().slice(0,7);
    return selected===current?today():selectedMonth;
  }
  function budgetPlan(b,reference=budgetRef(b)){
    const r=budgetRange(b,reference),spent=budgetSpent(b,reference);
    const planned=plannedOccurrences(r.start,r.end).filter(tx=>tx.type==='expense'&&includesCategory(b.categoryIds,tx.categoryId));
    const upcoming=sumAmounts(planned);
    const caps=categoryCaps(b);
    const allocated=sum(caps.map(c=>capValue(c,b)));
    const balance=b.amount-spent;
    const days=Math.max(1,Math.round((parseDate(r.end)-parseDate(r.start))/86400000)+1);
    const elapsed=reference<r.start?0:reference>r.end?days:Math.min(days,Math.floor((parseDate(reference)-parseDate(r.start))/86400000)+1);
    return {r,spent,planned,upcoming,caps,allocated,unallocated:b.amount-allocated,balance,days,elapsed};
  }

  const periodReference = () => selectedMonth.slice(0,7)===today().slice(0,7) ? today() : selectedMonth;
  const navItems=[['dashboard','Dashboard'],['transactions','Transactions'],['budgets','Budgets'],['scheduled','Scheduled'],['insights','Insights'],['settings','Settings']];
  function setRoute(view){if(!navItems.some(([id])=>id===view))view='dashboard';route=view;window.location.hash=view;render();window.scrollTo({top:0,behavior:'instant'});}
  function monthPicker(){return `<div class="month-pick" aria-label="Selected month"><button data-action="prev-month" title="Previous month" aria-label="Previous month">${icon('chevronLeft')}</button><strong>${esc(monthName(selectedMonth))}</strong><button data-action="next-month" title="Next month" aria-label="Next month">${icon('chevronRight')}</button></div>`}
  function pageHead(title,desc,action='',eyebrow='YOUR FINANCES'){return `<div class="page-head"><div><p class="eyebrow">${eyebrow}</p><h1>${esc(title)}</h1><p class="subtitle">${esc(desc)}</p></div>${action?`<div class="head-actions">${action}</div>`:''}</div>`}
  const empty = (ico,title,description,button='') => `<div class="empty-state"><div class="empty-icon">${icon(ico)}</div><strong>${esc(title)}</strong><p>${esc(description)}</p>${button}</div>`;
  function renderNav(){
    $('#sideNav').innerHTML=navItems.map(([id,label])=>`<a class="nav-item ${route===id?'active':''}" href="#${id}" data-route="${id}">${icon(id)}<span>${label}</span></a>`).join('');
    const mobile=[...navItems.slice(0,5),navItems[5]];
    $('#mobileNav').innerHTML=mobile.map(([id,label])=>`<a href="#${id}" data-route="${id}" class="${route===id?'active':''}">${icon(id)}<span>${label}</span></a>`).join('');
    $('#crumbCurrent').textContent=navItems.find(([id])=>id===route)?.[1]||'Dashboard';
    $('#privacyIcon').innerHTML=icon('shield');$('#addIcon').innerHTML=icon('plus');renderSyncIndicator();
  }
  function render(){renderNav();const pages={dashboard:renderDashboard,transactions:renderTransactions,budgets:renderBudgets,scheduled:renderScheduled,insights:renderInsights,settings:renderSettings};$('#mainContent').innerHTML=`<div class="main-content">${(pages[route]||renderDashboard)()}</div>`}
  const categorySpend = (start,end) => {
    const map=new Map();for(const tx of txOfType('expense',start,end)){const group=topCategory(tx.categoryId)?.id || tx.categoryId;map.set(group,(map.get(group)||0)+tx.amount)}
    return [...map].map(([id,amount])=>({category:categoryById(id)||{name:'Uncategorized',emoji:'📦',color:'#a3a8bb'},amount})).sort((a,b)=>b.amount-a.amount);
  };
  function donutGraph(segments,total){if(!total)return `<div class="donut" style="background:#E0E6D5"><div class="donut-center"><strong>${esc(currency(0))}</strong><span>Total spent</span></div></div>`;
    let used=0;const conic=segments.map((g,i)=>{const lo=used;used+=g.amount/total*100;return `${GRAPH_COLORS[i % GRAPH_COLORS.length]} ${lo.toFixed(3)}% ${used.toFixed(3)}%`}).join(',');
    return `<div class="donut" role="img" aria-label="Expense category distribution" style="background:conic-gradient(${conic})"><div class="donut-center"><strong>${esc(currency(total))}</strong><span>Total spent</span></div></div>`;
  }
  function monthlyBars(){const months=[];const d=parseDate(selectedMonth);for(let n=5;n>=0;n--){const m=new Date(d.getFullYear(),d.getMonth()-n,1),ym=localYmd(m);months.push({month:ym,...monthTotals(ym)})}
    const max=Math.max(...months.flatMap(m=>[m.expense,m.income]),1);
    return `<div class="chart-columns">${months.map(m=>`<div class="bar-cluster ${m.month===selectedMonth?'current':''}"><div class="bar-pair"><div class="bar expense" title="${esc(currency(m.expense))} expenses" style="height:${m.expense?Math.max(3,m.expense/max*100):0}%"></div><div class="bar income" title="${esc(currency(m.income))} income" style="height:${m.income?Math.max(3,m.income/max*100):0}%"></div></div><span class="bar-label">${parseDate(m.month).toLocaleDateString('en-US',{month:'short'})}</span></div>`).join('')}</div><div class="legend"><span><i class="legend-dot" style="background:#94505C"></i>Expenses</span><span><i class="legend-dot" style="background:#91AB87"></i>Income</span></div>`;
  }
  function labelStatus(date){return date<today()?'Overdue':date===today()?'Due today':'Upcoming'}
  const amountClass = type => type==='income'?'amount-income':type==='expense'?'amount-expense':'amount-transfer';
  function rowTransaction(tx,editable=false){
    const cat=displayCategory(tx),val=tx.type==='income'?'+':tx.type==='transfer'?'':'−';
    const tags=(tx.tags||[]).length?`<div class="row-tags">${tx.tags.slice(0,3).map(t=>`<span class="inline-tag">${esc(t)}</span>`).join('')}</div>`:'';
    const actions=editable?`<div class="tx-actions"><button title="Edit transaction" aria-label="Edit transaction" data-action="edit-transaction" data-id="${esc(tx.id)}">${icon('edit')}</button><button title="Delete transaction" aria-label="Delete transaction" data-action="delete-transaction" data-id="${esc(tx.id)}">${icon('trash')}</button></div>`:'';
    return `<div class="${editable?'table-row':'transaction-row'} activity-row"><div class="trans-icon" style="background:${cat.color}19">${esc(cat.emoji)}</div><div class="trans-details"><div class="row-title"><strong>${esc(transactionLabel(tx))}</strong>${editable?`<span class="status-badge status-paid">${tx.type==='income'?'Received':tx.type==='transfer'?'Transferred':'Paid'}</span>`:''}</div><span>${esc(cat.name)} · ${esc(walletById(tx.walletId)?.name||'Deleted wallet')}${tx.scheduleId?' · Recurring':''}</span>${tags}</div><div class="trans-right"><strong class="${amountClass(tx.type)}">${val}${esc(currency(tx.amount))}</strong><span>${esc(shortDate(tx.date))}</span></div>${actions}</div>`;
  }
  function rowPlanned(tx){
    const cat=displayCategory(tx),label=labelStatus(tx.date),cl=tx.date<today()?'status-overdue':tx.date===today()?'status-due':'status-upcoming';
    const sched=state.schedules.find(s=>s.id===tx.scheduleId);
    return `<div class="table-row activity-row planned-row"><div class="trans-icon" style="background:${cat.color}18">${esc(cat.emoji)}</div><div class="trans-details"><div class="row-title"><strong>${esc(transactionLabel(tx))}</strong><span class="status-badge ${cl}">${esc(label)}</span></div><span>${esc(cat.name)} · ${esc(walletById(tx.walletId)?.name||'Wallet')} · ${esc(sched?.oneTime?'One-time':sched?.frequency||'Scheduled')}</span>${tx.tags?.length?`<div class="row-tags">${tx.tags.slice(0,3).map(t=>`<span class="inline-tag">${esc(t)}</span>`).join('')}</div>`:''}</div><div class="trans-right"><strong class="${amountClass(tx.type)}">${tx.type==='income'?'+':tx.type==='transfer'?'':'−'}${esc(currency(tx.amount))}</strong><span>${esc(shortDate(tx.date))}</span></div><div class="tx-actions planned-actions"><button class="pay-action" type="button" data-action="pay-occurrence" data-id="${esc(tx.scheduleId)}" data-date="${esc(tx.date)}" title="Record this payment today">${icon('check')} ${postingLabel(tx)}</button><button type="button" title="Skip this occurrence" aria-label="Skip this occurrence" data-action="skip-occurrence" data-id="${esc(tx.scheduleId)}" data-date="${esc(tx.date)}">${icon('x')}</button></div></div>`;
  }
  const scheduleIcon = s => s.type==='transfer'?'↔️':(categoryById(s.categoryId)?.emoji || (s.type==='income'?'💵':'📦'));
  function renderDashboard(){
    const month=monthTotals(selectedMonth),prev=localYmd(new Date(parseDate(selectedMonth).getFullYear(),parseDate(selectedMonth).getMonth()-1,1));const prevTotal=monthTotals(prev).expense;
    const change=prevTotal?`${Math.abs((month.expense-prevTotal)/prevTotal*100).toFixed(0)}% ${month.expense>prevTotal?'more':'less'} than last month`:(month.expense?'Spending recorded this month':'No spending recorded yet');
    const stats=budgetStats(periodReference());const budgetRemaining=stats.budget-stats.spent;
    const categories=categorySpend(firstDay(selectedMonth),lastDay(selectedMonth)),recent=sortedTransactions(state.transactions.filter(tx=>inRange(tx,firstDay(selectedMonth),lastDay(selectedMonth)))).slice(0,5);
    const upcoming=state.schedules.filter(s=>s.active).map(s=>({...s,next:nextSchedule(s)})).filter(s=>s.next).sort((a,b)=>a.next.localeCompare(b.next)).slice(0,4);
    return `${pageHead('Your money, at a glance','A clearer view of where your money goes.',monthPicker(),'OVERVIEW')}
      <div class="grid kpi-grid">
        <div class="card kpi"><div class="kpi-head"><span>Total expenses</span><span class="kpi-icon red">${icon('expense')}</span></div><div class="kpi-value">${esc(currency(month.expense))}</div><p class="kpi-sub">${esc(change)}</p></div>
        <div class="card kpi"><div class="kpi-head"><span>Total income</span><span class="kpi-icon green">${icon('income')}</span></div><div class="kpi-value">${esc(currency(month.income))}</div><p class="kpi-sub">Money received this month</p></div>
        <div class="card kpi"><div class="kpi-head"><span>Net cash flow</span><span class="kpi-icon">${icon('flow')}</span></div><div class="kpi-value ${month.income-month.expense<0?'negative':'positive'}">${esc(currency(month.income-month.expense))}</div><p class="kpi-sub">Income minus expenses</p></div>
        <div class="card kpi"><div class="kpi-head"><span>Budget remaining</span><span class="kpi-icon amber">${icon('budgets')}</span></div><div class="kpi-value ${budgetRemaining<0?'negative':''}">${stats.budget?esc(currency(budgetRemaining)):'—'}</div><p class="kpi-sub">${stats.budget?`${esc(currency(stats.spent))} of ${esc(currency(stats.budget))} allocated`:'Set a budget to get started'}</p></div>
      </div>
      <div class="grid dashboard-grid">
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Cash flow</h2><p class="card-subtitle">Expenses versus income · Last 6 months</p></div><span class="mini-tag">Monthly</span></div>${monthlyBars()}</section>
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Spending breakdown</h2><p class="card-subtitle">See which categories take the most</p></div><a class="section-link" href="#insights" data-route="insights">Details ${icon('arrowRight')}</a></div><div class="donut-layout">${donutGraph(categories,month.expense)}<div class="category-list">${categories.length?categories.slice(0,5).map((g,i)=>`<div class="category-key"><i class="legend-dot" style="background:${GRAPH_COLORS[i % GRAPH_COLORS.length]}"></i><span class="name">${esc(g.category.name)}</span><strong>${Math.round(g.amount/month.expense*100)}%</strong></div>`).join(''):'<p class="muted" style="font-size:12px">Start adding expenses to see your breakdown.</p>'}</div></div></section>
      </div>
      <div class="grid two-col">
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Recent transactions</h2><p class="card-subtitle">Latest activity for ${esc(monthName(selectedMonth))}</p></div><a class="section-link" href="#transactions" data-route="transactions">View all ${icon('arrowRight')}</a></div><div class="transaction-list">${recent.length?recent.map(tx=>rowTransaction(tx)).join(''):empty('receipt','No transactions yet','Your expenses and income will appear here.',`<button class="button button-light" data-action="add-transaction">${icon('plus')} Add your first</button>`)}</div></section>
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Coming up</h2><p class="card-subtitle">Your next scheduled transactions</p></div><a class="section-link" href="#transactions" data-route="transactions">View activity ${icon('arrowRight')}</a></div>${upcoming.length?upcoming.map(s=>`<div class="upcoming-row"><div class="calendar-chip"><b>${parseDate(s.next).getDate()}</b><span>${parseDate(s.next).toLocaleDateString('en-US',{month:'short'}).toUpperCase()}</span></div><div class="trans-details"><strong>${esc(s.payee||categoryById(s.categoryId)?.name||'Transfer')}</strong><span>${esc(s.oneTime?'One-time':s.frequency[0].toUpperCase()+s.frequency.slice(1))} · ${esc(walletById(s.walletId)?.name||'Wallet')}</span></div><div class="trans-right"><strong class="${amountClass(s.type)}">${s.type==='income'?'+':s.type==='transfer'?'':'−'}${esc(currency(s.amount))}</strong><span>${esc(shortDate(s.next))}</span></div><button type="button" class="dashboard-pay" data-action="pay-occurrence" data-id="${esc(s.id)}" data-date="${esc(s.next)}" aria-label="${postingLabel(s)} ${esc(s.payee||'scheduled item')}">${icon('check')}</button></div>`).join(''):empty('calendar','Nothing scheduled','Create recurring bills, subscriptions, or regular purchases.',`<button class="button button-light" data-action="add-schedule">${icon('plus')} Schedule one</button>`)}</section>
      </div>`;
  }
  function renderTransactions(){
    const from=firstDay(selectedMonth),to=lastDay(selectedMonth);
    const paid=state.transactions.filter(tx=>inRange(tx,from,to)).map(tx=>({...tx,planned:false}));
    const planned=plannedOccurrences(from,to);
    const all=[...paid,...planned];
    const visible=all.filter(tx=>{
      if(filters.status==='paid'&&tx.planned)return false;
      if(filters.status==='planned'&&!tx.planned)return false;
      if(filters.type!=='all'&&tx.type!==filters.type)return false;
      if(filters.category!=='all'&&!categoryAncestors(tx.categoryId).some(c=>c.id===filters.category))return false;
      if(filters.wallet!=='all'&&tx.walletId!==filters.wallet&&tx.toWalletId!==filters.wallet)return false;
      if(filters.tag!=='all'&&!(tx.tags||[]).includes(filters.tag))return false;
      if(filters.search&& !(`${transactionLabel(tx)} ${displayCategory(tx).name} ${tx.note||''} ${(tx.tags||[]).join(' ')}`).toLowerCase().includes(filters.search.toLowerCase()))return false;
      return true;
    }).sort((a,b)=>b.date.localeCompare(a.date) || (a.planned===b.planned?0:a.planned?1:-1));
    const groups=new Map();for(const tx of visible){if(!groups.has(tx.date))groups.set(tx.date,[]);groups.get(tx.date).push(tx)}
    const overdue=planned.filter(p=>p.date<today()),upcoming=planned.filter(p=>p.date>=today());
    return `${pageHead('Transactions','Completed payments and planned expenses, together.',`${monthPicker()}<button class="button button-primary" data-action="add-transaction">${icon('plus')} Add transaction</button>`,'ALL ACTIVITY')}
      <div class="activity-toolbar"><div class="status-tabs" role="group" aria-label="Transaction status">${[['all','All activity'],['paid','Paid'],['planned','Scheduled']].map(([v,l])=>`<button type="button" data-tx-status="${v}" class="${filters.status===v?'active':''}" aria-pressed="${filters.status===v}">${l}<span>${v==='all'?all.length:v==='paid'?paid.length:planned.length}</span></button>`).join('')}</div><button class="button button-light button-small" data-action="add-schedule">${icon('calendar')} New schedule</button></div>
      ${planned.length?`<div class="pending-summary"><div class="pending-summary-text"><strong>${planned.length} scheduled ${planned.length===1?'item':'items'} in ${esc(monthName(selectedMonth))}</strong><span>${esc(currency(sumAmounts(planned.filter(t=>t.type==='expense'))))} in planned expenses${overdue.length?` · ${overdue.length} overdue`:''}. Planned items do not affect your wallet or budget until paid.</span></div><span class="pending-count">${upcoming.length} upcoming</span></div>`:''}
      <div class="filters">
        <div class="search-wrap">${icon('search')}<input id="txSearch" aria-label="Search transactions" placeholder="Search descriptions, notes, tags…" value="${esc(filters.search)}"></div>
        <select id="txTypeFilter" class="select-filter" aria-label="Filter type">${[['all','All types'],['expense','Expenses'],['income','Income'],['transfer','Transfers']].map(([v,l])=>`<option value="${v}" ${filters.type===v?'selected':''}>${l}</option>`).join('')}</select>
        <select id="txCategoryFilter" class="select-filter" aria-label="Filter category"><option value="all">All categories</option>${state.categories.map(c=>`<option value="${esc(c.id)}" ${filters.category===c.id?'selected':''}>${esc(c.emoji+' '+categoryFullName(c.id))}</option>`).join('')}</select>
        <select id="txWalletFilter" class="select-filter" aria-label="Filter wallet"><option value="all">All wallets</option>${state.wallets.map(w=>`<option value="${esc(w.id)}" ${filters.wallet===w.id?'selected':''}>${esc(w.name)}</option>`).join('')}</select>
        <select id="txTagFilter" class="select-filter" aria-label="Filter tag"><option value="all">All tags</option>${[...new Set([...TAG_OPTIONS,...all.flatMap(t=>t.tags||[])])].map(t=>`<option value="${esc(t)}" ${filters.tag===t?'selected':''}>${esc(t)}</option>`).join('')}</select>
      </div>
      <section class="card table-card"><div class="table-heading"><h2>Activity <span class="muted">(${visible.length})</span></h2><span class="muted">${esc(monthName(selectedMonth))}</span></div>${visible.length?[...groups].map(([date,items])=>`<div class="tx-group-title">${esc(formatDate(date))}</div>${items.map(tx=>tx.planned?rowPlanned(tx):rowTransaction(tx,true)).join('')}`).join(''):empty('receipt','Nothing here yet',all.length?'Try another filter or month.':'Record a transaction or schedule a future payment.',`<button class="button button-primary" data-action="add-transaction">${icon('plus')} Add transaction</button>`)}</section>
      <div class="section-space"><p class="subtitle">Tap <strong>Pay</strong> to turn a scheduled item into a completed transaction dated today. Only completed transactions affect balances and budgets. Data stays on this device.</p></div>`;
  }
  // Cashew-inspired overview -> one detailed budget with category caps,
  // history and transactions. Never count the same caps as extra budgets.
  function budgetProgress(spent,limit,extra=0){
    const pct=limit>0?spent/limit*100:0,projected=limit>0?extra/limit*100:0;
    const used=cap(pct,0,100),planned=cap(projected,0,100-used);
    return `<div class="budget-meter" role="img" aria-label="${esc(Math.round(pct))} percent of budget spent"><span class="budget-meter-spent ${pct>100?'is-over':pct>=85?'is-warn':''}" style="width:${used}%"></span><span class="budget-meter-planned" style="width:${planned}%"></span></div>`;
  }
  function budgetCapsPanel(b,plan){
    const txs=budgetTransactions(b,budgetRef(b));
    const limitRows=plan.caps.map(c=>{
      const budgeted=capValue(c,b);
      const categoryId=c.categoryIds?.[0]||'',cat=categoryById(categoryId);
      const spent=sumAmounts(txs.filter(tx=>includesCategory(c.categoryIds,tx.categoryId)));
      const remaining=budgeted-spent;
      const isSelected=selectedBudgetCategory===categoryId;
      return `<div class="cap-row ${isSelected?'cap-selected':''}">
        <button type="button" class="cap-details" data-action="filter-budget-category" data-id="${esc(categoryId)}" title="Show category transactions">
          <span class="cap-icon" style="background:${esc(cat?.color||'#6658de')}1e">${esc(cat?.emoji||'🎯')}</span>
          <span class="cap-label"><strong>${esc(categoryFullName(categoryId)||'Unknown category')}</strong><small>${c.limitMode==='percent'?esc(c.amount+'% of this budget'):'Fixed limit'}</small></span>
          <span class="cap-numbers"><strong>${esc(currency(spent))} <span>/ ${esc(currency(budgeted))}</span></strong><small class="${remaining<0?'negative':''}">${remaining<0?esc(currency(-remaining))+' over':esc(currency(remaining))+' left'}</small></span>
          <span class="cap-progress">${budgetProgress(spent,budgeted)}</span>
        </button>
        <button class="button-icon" type="button" data-action="edit-cap" data-id="${esc(c.id)}" title="Edit category limit" aria-label="Edit ${esc(cat?.name||'category')} limit">${icon('edit')}</button>
      </div>`;
    }).join('');
    const unmatched=txs.filter(tx=>!plan.caps.some(c=>includesCategory(c.categoryIds,tx.categoryId)));
    return `<section class="card budget-panel">
      <div class="budget-section-head"><div><span class="section-kicker">HOW YOUR LIMITS ARE DOING</span><h2>Category limits</h2><p>Limits divide this budget. They don't add to your total.</p></div>
        <button class="button button-light" type="button" data-action="add-cap" data-id="${esc(b.id)}">${icon('plus')} Add category limit</button></div>
      ${plan.caps.length?`<div class="cap-rows">${limitRows}</div>`:`<div class="budget-blank">No category limits yet. Add a limit for Pets, Skincare, Transport, or any expense category.</div>`}
      <div class="cap-foot">
        <div><span>Reserved for category limits</span><strong>${esc(currency(plan.allocated))}</strong></div>
        <div><span>${plan.unallocated<0?'Overallocated':'Not assigned to a limit'}</span><strong class="${plan.unallocated<0?'negative':'positive'}">${esc(currency(Math.abs(plan.unallocated)))}</strong></div>
        <div><span>Spent without a category limit</span><strong>${esc(currency(sumAmounts(unmatched)))}</strong></div>
      </div>
      ${plan.unallocated<0?`<div class="budget-note warning">Your category limits total more than the main budget. Adjust their amounts or percentages.</div>`:''}
    </section>`;
  }
  function budgetPeriodHistory(b,ref){
    const rows=[];
    const base=budgetRange(b,ref).start;
    for(let i=5;i>=0;i--){
      const offset=b.period==='custom'?base:budgetPeriodOffset(b.period,base,-i);
      if(b.period==='custom'&&i!==0)continue;
      const r=budgetRange(b,offset),spent=budgetSpent(b,offset);
      const active=budgetRange(b,ref).start===r.start;
      rows.push(`<button type="button" class="budget-history-item ${active?'active':''}" data-action="set-budget-period" data-date="${esc(offset)}">
        <span>${esc(budgetNamePeriod(b,r))}</span><strong>${esc(currency(spent))}</strong>${budgetProgress(spent,b.amount)}<small>${Math.round(spent/b.amount*100)}% used</small></button>`);
    }
    return `<section class="card budget-panel"><div class="budget-section-head"><div><span class="section-kicker">COMPARE PERIODS</span><h2>Budget history</h2><p>Past periods use your saved transactions, never scheduled estimates.</p></div></div><div class="budget-history-grid">${rows.join('')}</div></section>`;
  }
  function renderBudgets(){
    const parents=parentBudgets(),active=parents.filter(b=>b.active!==false);
    if(!parents.length)return `${pageHead('Budgets','Plan your spending, not just record it.',`<button class="button button-primary" data-action="add-budget">${icon('plus')} New budget</button>`,'SPENDING PLANS')}<section class="card budget-intro">${empty('budgets','Start with your first budget','Set a monthly budget and then choose optional category limits. No income is required.',`<button class="button button-primary" data-action="add-budget">${icon('plus')} Create budget</button>`)}</section>`;
    if(!selectedBudgetId||!parents.some(b=>b.id===selectedBudgetId))selectedBudgetId=active[0]?.id||parents[0].id;
    const b=parents.find(b=>b.id===selectedBudgetId);
    const ref=budgetRef(b),plan=budgetPlan(b,ref),percent=b.amount?plan.spent/b.amount*100:0;
    const txs=sortedTransactions(budgetTransactions(b,ref).filter(tx=>!selectedBudgetCategory||includesCategory([selectedBudgetCategory],tx.categoryId)));
    return `${pageHead('Budgets','Track real spending and plan what is still to come.',`<button class="button button-primary" data-action="add-budget">${icon('plus')} New budget</button>`,'SPENDING PLANS')}
      <div class="budget-toolbar">
        <div class="budget-tabs" role="group" aria-label="Select a budget">${parents.map(item=>`<button class="budget-tab ${item.id===b.id?'active':''}" data-action="select-budget" data-id="${esc(item.id)}"><span class="budget-tab-dot"></span>${esc(item.name)}${item.active===false?' · Paused':''}</button>`).join('')}</div>
        <div class="budget-navigator" role="group" aria-label="Budget period">
          <button type="button" data-action="budget-prev-period" ${b.period==='custom'?'disabled':''} aria-label="Previous period">${icon('chevronLeft')}</button><strong>${esc(budgetNamePeriod(b,plan.r))}</strong><button type="button" data-action="budget-next-period" ${b.period==='custom'?'disabled':''} aria-label="Next period">${icon('chevronRight')}</button>
        </div>
      </div>
      <div class="budget-layout">
        <section class="card budget-main">
          <div class="budget-main-top"><div><span class="section-kicker">${esc(b.period==='custom'?'ONE-TIME':b.period.toUpperCase()+' BUDGET')}</span><h2>${esc(b.name)}</h2><span class="budget-daterange">${esc(formatDate(plan.r.start))} – ${esc(formatDate(plan.r.end))}</span></div><button class="button button-light" data-action="edit-budget" data-id="${esc(b.id)}">${icon('edit')} Edit budget</button></div>
          ${b.active===false?'<div class="budget-note warning">This budget is paused. Its history is still visible.</div>':''}
          <div class="budget-big-label">Left to spend</div>
          <div class="budget-remaining ${plan.balance<0?'negative':''}">${esc(currency(Math.abs(plan.balance)))} ${plan.balance<0?'<small>over budget</small>':''}</div>
          <div class="budget-metrics"><div><span>Budget limit</span><strong>${esc(currency(b.amount))}</strong></div><div><span>Spent</span><strong>${esc(currency(plan.spent))}</strong></div><div><span>Scheduled · not paid</span><strong>${esc(currency(plan.upcoming))}</strong></div></div>
          ${budgetProgress(plan.spent,b.amount,plan.upcoming)}
          <div class="budget-meter-legend"><span><i class="dot spent"></i> ${Math.round(percent)}% spent</span><span><i class="dot planned"></i> Upcoming payments</span></div>
          <div class="budget-main-summary"><div><span>After scheduled payments</span><strong class="${plan.balance-plan.upcoming<0?'negative':''}">${esc(currency(plan.balance-plan.upcoming))}</strong></div><div><span>Time elapsed</span><strong>${esc(Math.round(plan.elapsed/plan.days*100))}%</strong></div></div>
        </section>
        <aside class="card budget-quick"><div class="budget-section-head"><div><span class="section-kicker">AT A GLANCE</span><h2>Spending plan</h2></div></div>
          <div class="budget-ring" style="--ring-pct:${cap(percent,0,100)}"><div><b>${esc(Math.round(percent))}%</b><span>used</span></div></div>
          <div class="budget-breakdown-line"><span>Paid expenses</span><b>${esc(currency(plan.spent))}</b></div>
          <div class="budget-breakdown-line"><span>Planned, not paid</span><b>${esc(currency(plan.upcoming))}</b></div>
          <div class="budget-breakdown-line"><span>Category allocations</span><b>${esc(currency(plan.allocated))}</b></div>
          <div class="budget-mini-note">Unpaid schedules are previews only. They do not change your balance until you tap <b>Pay</b>.</div>
        </aside>
      </div>
      ${budgetCapsPanel(b,plan)}
      ${budgetPeriodHistory(b,ref)}
      <section class="card budget-panel"><div class="budget-section-head"><div><span class="section-kicker">ACTUAL PURCHASES</span><h2>${selectedBudgetCategory?esc(categoryFullName(selectedBudgetCategory)):'Transactions in this budget'}</h2><p>${txs.length} paid expense${txs.length===1?'':'s'} in this period</p></div>${selectedBudgetCategory?`<button class="button button-light" data-action="clear-budget-category">Show all</button>`:''}</div>
        ${txs.length?`<div class="budget-transactions">${txs.slice(0,20).map(tx=>rowTransaction(tx,true)).join('')}</div>`:empty('receipt','No expenses here yet','Your completed transactions will appear here.')}
      </section>`;
  }

  function renderScheduled(){const schedules=[...state.schedules].sort((a,b)=>(nextSchedule(a)||'9999').localeCompare(nextSchedule(b)||'9999'));
    return `${pageHead('Manage schedules','Create and edit recurring payments. See each pending occurrence under Transactions.',`<button class="button button-primary" data-action="add-schedule">${icon('plus')} Schedule transaction</button>`,'RECURRING ACTIVITY')}
      <div class="alert-strip">Schedules are plans, not completed transactions. Use Pay under Transactions or on a due schedule to record one payment. Automatic schedules (if enabled) post only when Folio opens.</div>
      ${schedules.length?`<div class="grid schedule-grid">${schedules.map(s=>{const due=pendingSchedule(s),next=due[0]||nextSchedule(s),cat=categoryById(s.categoryId);
        return `<section class="card schedule-card"><div class="budget-top"><span class="budget-symbol">${esc(scheduleIcon(s))}</span><div style="flex:1;min-width:0"><h3>${esc(s.payee||cat?.name||'Transfer')}</h3><p class="muted">${esc(walletById(s.walletId)?.name||'Wallet')} · <span class="${s.active?'positive':''}">${s.active?'Active':'Paused'}</span></p></div><div class="schedule-tools"><button class="button-icon" title="Edit" data-action="edit-schedule" data-id="${esc(s.id)}">${icon('edit')}</button><button class="button-icon" title="${s.active?'Pause':'Resume'}" data-action="toggle-schedule" data-id="${esc(s.id)}">${s.active?'Ⅱ':'▶'}</button></div></div><div class="schedule-amount ${amountClass(s.type)}">${s.type==='income'?'+':s.type==='expense'?'−':''}${esc(currency(s.amount))}</div><div class="schedule-frequency">${esc(s.oneTime?'One-time':s.frequency[0].toUpperCase()+s.frequency.slice(1))} · ${s.autoPost?'Auto add when due':'Manual posting'}</div><div class="schedule-footer"><div class="schedule-next">Next occurrence<strong>${next?esc(formatDate(next)):(s.active?'Completed':'Paused')}</strong></div>${due.length?`<button class="button button-small button-primary" data-action="pay-occurrence" data-id="${esc(s.id)}" data-date="${esc(due[0])}">${postingLabel(s)} now${due.length>1?' · '+due.length+' due':''}</button>`:`<span class="tag ${s.autoPost?'green':'purple'}">${s.autoPost?'Automatic':'Manual'}</span>`}</div></section>`}).join('')}</div>`: `<section class="card">${empty('calendar','No scheduled transactions yet','Add monthly laser appointments, pet supplies, bills, or subscriptions.',`<button class="button button-primary" data-action="add-schedule">${icon('plus')} Add a schedule</button>`)}</section>`}
      <div class="budget-tip">${icon('calendar')}<span>Recurring dates stay anchored to the original day. For example, a monthly payment on January 31 will occur on February 28 (or 29 in leap years), then March 31.</span></div>`;
  }
  function renderInsights(){const totals=monthTotals(selectedMonth),categories=categorySpend(firstDay(selectedMonth),lastDay(selectedMonth)),months=Array.from({length:6},(_,i)=>{const d=parseDate(selectedMonth);return localYmd(new Date(d.getFullYear(),d.getMonth()-(5-i),1))});
    const maxMonth=Math.max(...months.map(m=>monthTotals(m).expense),1);
    const prevMonth=localYmd(new Date(parseDate(selectedMonth).getFullYear(),parseDate(selectedMonth).getMonth()-1,1));const prevExpense=monthTotals(prevMonth).expense;
    const delta=prevExpense?((totals.expense-prevExpense)/prevExpense*100):null;
    const count=txOfType('expense',firstDay(selectedMonth),lastDay(selectedMonth)).length;
    return `${pageHead('Spending insights','Understand your habits with a little more clarity.',monthPicker(),'ANALYTICS')}
      <div class="grid insights-grid">
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Where your money went</h2><p class="card-subtitle">Your expense categories this month</p></div><span class="mini-tag">${esc(monthName(selectedMonth))}</span></div><div class="insight-total">${esc(currency(totals.expense))}</div><div class="insight-compare"><span>${count} expense transactions</span><span>${delta===null?'No previous month comparison':`${Math.abs(delta).toFixed(0)}% ${delta>=0?'more':'less'} than last month`}</span></div><div class="insight-bars">${categories.length?categories.map((g,i)=>`<div class="insight-bar-row"><span title="${esc(g.category.name)}">${esc(g.category.emoji+' '+g.category.name)}</span><div class="progress-track"><div class="progress-fill" style="background:${GRAPH_COLORS[i % GRAPH_COLORS.length]};width:${cap(g.amount/totals.expense*100,0,100)}%"></div></div><strong>${esc(currency(g.amount))}</strong></div>`).join(''):empty('insights','No spending data','Add some expenses to see category trends.')}</div></section>
        <section class="card card-body"><div class="card-head"><div><h2 class="card-title">Monthly trend</h2><p class="card-subtitle">Your expenses over the last six months</p></div></div><div class="insight-bars" style="margin-top:36px">${months.map(m=>{const v=monthTotals(m).expense;return `<div class="insight-bar-row"><span>${esc(parseDate(m).toLocaleDateString('en-US',{month:'short',year:'numeric'}))}</span><div class="progress-track"><div class="progress-fill" style="width:${v?Math.max(2,v/maxMonth*100):0}%;background:${m===selectedMonth?'#632D3B':'#91AB87'}"></div></div><strong>${esc(currency(v))}</strong></div>`}).join('')}</div><div class="callout">${categories.length?`Your largest spending category is <strong>${esc(categories[0].category.name)}</strong> at ${esc(currency(categories[0].amount))} (${Math.round(categories[0].amount/totals.expense*100)}% of expenses).`:'Spend data will appear here automatically as you track transactions.'}</div></section>
      </div>
      <div class="grid kpi-grid three-kpi section-space">
        <div class="card kpi"><div class="kpi-head">Average expense ${icon('receipt')}</div><div class="kpi-value">${esc(currency(count?totals.expense/count:0))}</div><p class="kpi-sub">Per expense transaction</p></div>
        <div class="card kpi"><div class="kpi-head">Expense categories ${icon('budgets')}</div><div class="kpi-value">${categories.length}</div><p class="kpi-sub">Used this month</p></div>
        <div class="card kpi"><div class="kpi-head">Cash flow ${icon('flow')}</div><div class="kpi-value ${totals.income-totals.expense<0?'negative':'positive'}">${esc(currency(totals.income-totals.expense))}</div><p class="kpi-sub">Income after expenses</p></div>
      </div>`;
  }
  function renderSettings(){return `${pageHead('Settings','Make Folio yours. Financial data stays local unless you explicitly push an encrypted backup.','','PREFERENCES')}
    <div class="settings-grid">
      <section class="card settings-card"><h2>Wallets</h2><p class="subtitle">Where your money lives, with opening balances.</p>${state.wallets.map(w=>`<div class="settings-row"><div class="settings-row-left"><span class="category-setting-icon" style="background:${w.color}18">💳</span><div><span>${esc(w.name)}</span><small>Balance: ${esc(currency(walletBalance(w.id)))}</small></div></div><div class="actions"><button class="button-icon" title="Edit wallet" data-action="edit-wallet" data-id="${esc(w.id)}">${icon('edit')}</button></div></div>`).join('')}<button style="margin-top:16px" class="button button-light button-small" data-action="add-wallet">${icon('plus')} Add wallet</button></section>
      <section class="card settings-card"><h2>Preferences</h2><p class="subtitle">Choose how your data is displayed.</p><div class="settings-row"><div><span>Display currency</span><small>Amounts are not converted between currencies</small></div><select class="setting-select" id="currencySelect">${['USD','LBP','EUR','GBP','CAD','AUD','AED','SAR'].map(c=>`<option value="${c}" ${state.settings.currency===c?'selected':''}>${c}</option>`).join('')}</select></div><div class="settings-row"><div><span>Offline first</span><small>Works offline; optional encrypted manual GitHub backup</small></div><span class="tag green">Enabled</span></div><div class="settings-row"><div><span>Subscription cost</span><small>No paid features or ongoing charges</small></div><span class="tag green">${esc(currency(0))}</span></div></section>
      <section class="card settings-card"><h2>Categories</h2><p class="subtitle">Customize labels, emojis, and colors.</p><div style="max-height:310px;overflow:auto;padding-right:3px">${state.categories.map(c=>`<div class="settings-row"><div class="settings-row-left"><span class="category-setting-icon">${esc(c.emoji)}</span><div><span>${esc(c.name)}</span><small>${esc((c.kind==='expense'?'Expense':'Income')+(c.parentId?' · Subcategory of '+(categoryById(c.parentId)?.name||'Other') :''))}</small></div></div><button class="button-icon" data-action="edit-category" title="Edit category" data-id="${esc(c.id)}">${icon('edit')}</button></div>`).join('')}</div><button style="margin-top:16px" class="button button-light button-small" data-action="add-category">${icon('plus')} Add category</button></section>
      <section class="card settings-card"><h2>Cashew migration</h2><p class="subtitle">Restore the Folio JSON file converted from your Cashew CSV + SQLite exports. A CSV-only import transfers transactions but not your complete budgets.</p><div class="settings-row"><div><span>Import Cashew CSV</span><small>Transactions only · keeps your existing Folio budgets and schedules</small></div><button data-action="import-cashew-csv" class="button button-small button-light">${icon('upload')} CSV</button></div>${state.migration?.source?`<div class="alert-strip" style="margin-top:12px">Imported from Cashew. Wallet opening balances could not be recovered, so verify your Bank balance in Settings. Future unpaid payments were imported as manual schedules.</div>`:''}</section>
      ${renderGitHubSettings()}
      <section class="card settings-card"><h2>Backup & export</h2><p class="subtitle">Back up regularly. Browser data can be lost if you clear storage.</p><div class="settings-row"><div><span>Download full backup</span><small>JSON includes all transactions, budgets, and settings</small></div><button data-action="export-json" class="button button-small button-light">${icon('download')} JSON</button></div><div class="settings-row"><div><span>Export transactions</span><small>CSV opens in Excel or Google Sheets</small></div><button data-action="export-csv" class="button button-small button-light">${icon('download')} CSV</button></div><div class="settings-row"><div><span>Restore a backup</span><small>Import one of your Folio JSON files</small></div><button data-action="import-json" class="button button-small button-light">${icon('upload')} Import</button></div><div style="margin-top:20px;border-top:1px solid #f0f0f5;padding-top:20px"><div style="font-weight:750;font-size:12px;margin-bottom:6px">Danger zone</div><p class="subtitle">Deletes all transactions, budgets, schedules, and customizations on this browser.</p><button class="button button-small button-danger" data-action="clear-data">${icon('trash')} Reset all data</button></div></section>
    </div>`;
  }
  // GitHub sync UI. A private repository is required; the server sees only ciphertext.
  function renderGitHubSettings(){
    const last=syncConfig.lastSyncedAt?new Date(syncConfig.lastSyncedAt).toLocaleString():'Never';
    const remote=syncConfig.owner?`${syncConfig.owner}/${syncConfig.repo} · ${syncConfig.branch}`:'Not configured';
    return `<section class="card settings-card github-sync-card" id="githubSyncCard">
      <div class="github-head"><div><p class="eyebrow">MANUAL BACKUP</p><h2>GitHub Push & Pull</h2><p class="subtitle">Save an encrypted copy to a private repository, then restore it from your other device. Nothing syncs automatically.</p></div><span class="github-private-badge">${icon('shield')} Encrypted</span></div>
      <div class="github-sync-status"><div><small>Repository</small><strong>${esc(remote)}</strong></div><div><small>Last successful sync</small><strong>${esc(last)}</strong></div><div><small>Local status</small><strong>${hasPendingSync()?'Changes waiting to be pushed':'Up to date with last sync'}</strong></div></div>
      <div class="github-form-grid">
        <label class="form-field"><span>GitHub username</span><input id="githubOwner" type="text" autocomplete="off" spellcheck="false" placeholder="your-username" value="${esc(syncConfig.owner)}"></label>
        <label class="form-field"><span>Private repository</span><input id="githubRepo" type="text" autocomplete="off" spellcheck="false" placeholder="folio-private-data" value="${esc(syncConfig.repo)}"></label>
        <label class="form-field"><span>Branch</span><input id="githubBranch" type="text" autocomplete="off" spellcheck="false" value="${esc(syncConfig.branch)}" placeholder="main"></label>
        <label class="form-field"><span>Fine-grained GitHub token</span><input id="githubToken" type="password" autocomplete="off" placeholder="${syncToken?'Token loaded (leave blank to keep)':'Paste token (Contents: read/write)'}" value=""><small>Restricted to this repository. Never included in a Folio backup.</small></label>
        <label class="form-field full"><span>Encryption password</span><input id="githubPassphrase" type="password" autocomplete="off" placeholder="${syncPassphrase?'Unlocked for this session':'At least 12 characters · same password on both devices'}" value=""><small>Remember this password yourself. We never upload or store it. Losing it means losing access to the encrypted GitHub backup.</small></label>
      </div>
      <label class="github-remember"><input id="githubRemember" type="checkbox" ${syncConfig.rememberToken?'checked':''}><span>Remember the GitHub token on this device <small>Convenient, but less secure on a shared browser. Uncheck to keep it only until the app closes.</small></span></label>
      <div class="github-actions"><button class="button button-light" data-action="github-save" type="button" ${syncBusy?'disabled':''}>${icon('check')} Save connection</button><button class="button button-outline" data-action="github-check" type="button" ${syncBusy?'disabled':''}>Test connection</button></div>
      <div class="github-main-actions"><button class="button button-primary" data-action="github-push" type="button" ${syncBusy?'disabled':''}>${icon('upload')} Push to GitHub</button><button class="button button-light" data-action="github-pull" type="button" ${syncBusy?'disabled':''}>${icon('download')} Pull from GitHub</button></div>
      ${syncMessage?`<p class="github-message ${syncMessageError?'github-message-error':''}" role="status">${esc(syncMessage)}</p>`:''}
      <p class="github-hint">Push uploads <strong>${window.FolioGitHub.filename}</strong> encrypted. Pull replaces all data on this device after confirmation. If another device changed the remote copy, Folio blocks your push instead of overwriting it.</p>
    </section>`;
  }
  function readSyncForm(){
    const owner=$('#githubOwner')?.value.trim()||'';
    const repo=$('#githubRepo')?.value.trim()||'';
    const branch=$('#githubBranch')?.value.trim()||'';
    if(!/^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?$/i.test(owner))throw Error('Enter a valid GitHub username.');
    if(!/^[\w.-]{1,100}$/.test(repo)||repo==='.'||repo==='..')throw Error('Enter a valid repository name.');
    if(!/^[\w.\/-]{1,100}$/.test(branch)||branch.startsWith('/')||branch.endsWith('/')||branch.includes('..'))throw Error('Enter a valid branch name.');
    const changed=owner.toLowerCase()!==syncConfig.owner.toLowerCase()||repo.toLowerCase()!==syncConfig.repo.toLowerCase()||branch!==syncConfig.branch;
    const nextToken=$('#githubToken')?.value.trim();
    const nextPassphrase=$('#githubPassphrase')?.value;
    if(nextToken)syncToken=nextToken;
    if(nextPassphrase)syncPassphrase=nextPassphrase;
    syncConfig={...syncConfig,owner,repo,branch,rememberToken:Boolean($('#githubRemember')?.checked),...(changed?{lastSha:null,lastSyncedAt:null,syncedRevision:-1}:{})};
    saveSyncConfig();
    if(syncConfig.rememberToken && syncToken)localStorage.setItem(SYNC_TOKEN_KEY,syncToken);
    else localStorage.removeItem(SYNC_TOKEN_KEY);
  }
  function syncResult(message,isError=false){syncMessage=message;syncMessageError=isError;notify(message,isError);render();}
  function assertSyncReady(requirePassphrase){
    if(!syncToken)throw Error('Enter a GitHub token.');
    if(requirePassphrase && !syncPassphrase)throw Error('Enter the encryption password. Use the SAME password on both devices.');
  }
  async function githubAction(action){
    if(syncBusy)return;
    try{readSyncForm();assertSyncReady(action!=='check');}catch(e){syncResult(e.message,true);return}
    syncBusy=true;render();
    try{
      const client=window.FolioGitHub;
      await client.verify(syncConfig,syncToken); // Refuses public repositories.
      if(action==='check'){syncResult('Connection verified: the repository is private and accessible.');return}
      const remote=await client.read(syncConfig,syncToken);
      if(action==='push'){
        if(remote && !syncConfig.lastSha)throw Error('A backup already exists here. Pull on this device first before pushing, to avoid overwriting someone else’s copy. Save a local JSON backup before pulling.');
        if(remote && remote.sha!==syncConfig.lastSha)throw Error('Conflict: GitHub has a newer backup from another device. Pull first. Your local data has NOT been changed.');
        if(!remote && syncConfig.lastSha)throw Error('Remote backup was deleted or the branch changed. Check the repository before pushing again.');
        if(remote && !hasPendingSync()){syncResult('Already in sync with the last pushed backup.');return}
        if(remote){ // Prevent accidentally rotating the password and making other devices unable to decrypt.
          const existing=JSON.parse(await client.decrypt(remote.contents,syncPassphrase));
          validateImport(existing);
        }
        const snapshot=JSON.stringify(state);
        const revision=syncConfig.localRevision;
        const ciphertext=await client.encrypt(snapshot,syncPassphrase);
        const newSha=await client.write(syncConfig,syncToken,ciphertext,remote?.sha);
        syncConfig.lastSha=newSha;syncConfig.lastSyncedAt=new Date().toISOString();syncConfig.syncedRevision=revision;
        saveSyncConfig();syncResult('Encrypted backup pushed to GitHub. Your data stays readable only with your encryption password.');
      }else if(action==='pull'){
        if(!remote)throw Error('No backup found yet. Push your Folio data from the phone first.');
        if(remote.sha===syncConfig.lastSha && !hasPendingSync()){syncResult('This device already has the latest pulled backup.');return}
        const plain=await client.decrypt(remote.contents,syncPassphrase);
        if(plain.length>12*1024*1024)throw Error('Remote backup exceeds the 12 MB size limit.');
        const incoming=JSON.parse(plain);validateImport(incoming);
        // Reconfirm after decryption, without ever replacing data silently.
        const warning=hasPendingSync()?'\n\nWARNING: You have local changes that have NOT been pushed.':'\n\nAny local data not in GitHub will be replaced.';
        if(!window.confirm(`Replace all LOCAL Folio data with the GitHub backup?\n\nGitHub: ${incoming.transactions.length} transactions, ${incoming.budgets.length} budgets, ${incoming.schedules.length} schedules.${warning}\n\nFolio will download a safety copy of your current data before replacing it.`)){
          syncResult('Pull canceled. Local data was not changed.');return;
        }
        // Download safety copy before destructive replacement; use unique name per pull.
        download(`folio-before-pull-${new Date().toISOString().replace(/[:.]/g,'-')}.json`,JSON.stringify(state,null,2),'application/json');
        state=normalizeCashewBudgets(incoming);
        if(!save(false))throw Error('Could not save the downloaded data locally.');
        syncConfig.lastSha=remote.sha;syncConfig.lastSyncedAt=new Date().toISOString();syncConfig.syncedRevision=syncConfig.localRevision;
        saveSyncConfig();
        selectedMonth=firstDay(today());selectedBudgetId=null;selectedBudgetCategory=null;budgetDateOverride=null;
        syncResult('Latest encrypted backup pulled. Your previous local data was downloaded as a safety backup.');
      }
    }catch(e){syncResult(e.message||'Sync failed.',true)}finally{syncBusy=false;render()}
  }
  function openDialog(title,body,onSubmit,submitText='Save changes'){
    const dlg=$('#appDialog');dlg.classList.remove('budget-dialog');dlg.innerHTML=`<div class="dialog-head"><h2>${esc(title)}</h2><button class="dialog-close" type="button" data-action="close-dialog" aria-label="Close">${icon('x')}</button></div><form id="entityForm" class="dialog-form"><div class="form-grid">${body}</div><p class="dialog-error" id="dialogError"></p><div class="dialog-actions"><button type="button" class="button button-outline" data-action="close-dialog">Cancel</button><button type="submit" class="button button-primary">${esc(submitText)}</button></div></form>`;
    dlg._submit=onSubmit;dlg.showModal();
  }
  function formError(message){const el=$('#dialogError');if(el){el.textContent=message;el.classList.add('show')}else notify(message,true)}
  const field = (label,name,value='',type='text',extra='',full=false,help='') => `<div class="form-field ${full?'full':''}"><label for="input-${esc(name)}">${esc(label)}</label><input id="input-${esc(name)}" name="${esc(name)}" type="${type}" value="${esc(value)}" ${extra}>${help?`<span class="form-help">${esc(help)}</span>`:''}</div>`;
  const selectField = (label,name,opts,value='',extra='',full=false) => `<div class="form-field ${full?'full':''}"><label for="input-${esc(name)}">${esc(label)}</label><select id="input-${esc(name)}" name="${esc(name)}" ${extra}>${opts.map(([v,l])=>`<option value="${esc(v)}" ${v===value?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`;
  function tagsPicker(selected=[]){
    const opts=[...new Set([...TAG_OPTIONS,...selected])];
    return `<fieldset class="tag-field form-field full"><legend>Tags <span class="optional">optional</span></legend><p class="form-help">Choose from the list — no typing needed. Select any that apply.</p><div class="tag-picker">${opts.map(t=>`<label class="tag-choice"><input type="checkbox" name="tags" value="${esc(t)}" ${selected.includes(t)?'checked':''}><span>${esc(t)}</span></label>`).join('')}</div></fieldset>`;
  }
  const textareaField = (label,name,value='') => `<div class="form-field full"><label for="input-${esc(name)}">${esc(label)}</label><textarea id="input-${esc(name)}" name="${esc(name)}" placeholder="Optional notes...">${esc(value)}</textarea></div>`;
  const walletsOptions = () => state.wallets.map(w=>[w.id,w.name]);
  const categoryOptions = kind => state.categories.filter(c=>c.kind===kind && !c.archived).sort((a,b)=>categoryFullName(a.id).localeCompare(categoryFullName(b.id))).map(c=>[c.id,c.emoji+' '+categoryFullName(c.id)]);
  function typeToggle(type){return `<div class="form-field full"><label>Transaction type</label><div class="type-toggle" role="group" aria-label="Transaction type">${[['expense','Expense'],['income','Income'],['transfer','Transfer']].map(([v,label])=>`<button type="button" data-type-switch="${v}" class="${type===v?'selected':''}">${label}</button>`).join('')}</div><input type="hidden" name="type" value="${esc(type)}"></div>`}
  function categoryField(catId,kind){return `<div class="form-field" data-kind="category"><label for="input-categoryId">Category</label><select id="input-categoryId" name="categoryId">${categoryOptions(kind).map(([v,l])=>`<option value="${esc(v)}" ${v===catId?'selected':''}>${esc(l)}</option>`).join('')}</select></div>`}
  function updateTypeForm(form,type){
    $('input[name="type"]',form).value=type;
    $$('[data-type-switch]',form).forEach(b=>b.classList.toggle('selected',b.dataset.typeSwitch===type));
    const cat=$('[data-kind="category"]',form),to=$('[data-kind="toWallet"]',form);
    if(cat){cat.classList.toggle('hide',type==='transfer');const select=$('select',cat);if(select && type!=='transfer'){const previous=select.value;const options=categoryOptions(type);select.innerHTML=options.map(([id,label])=>`<option value="${esc(id)}">${esc(label)}</option>`).join('');select.value=options.some(([id])=>id===previous)?previous:(options[0]?.[0]||'');}}
    if(to)to.classList.toggle('hide',type!=='transfer');
  }
  function transactionModal(id=null){
    const tx=id?state.transactions.find(t=>t.id===id):null;if(id&&!tx)return;
    const type=tx?.type||'expense';let categoryChoices=categoryOptions(type==='transfer'?'expense':type);
    if(!state.wallets.length){notify('Create a wallet before adding transactions.',true);setRoute('settings');return}
    const body=`${typeToggle(type)}
      ${field('Amount','amount',tx?.amount||'','number','required min="0.01" step="0.01" placeholder="0.00"')}
      ${field('Date','date',tx?.date||today(),'date','required')}
      ${selectField('From wallet','walletId',walletsOptions(),tx?.walletId||state.wallets[0].id,'required')}
      <div data-kind="toWallet" class="${type!=='transfer'?'hide':''}">${selectField('To wallet','toWalletId',walletsOptions(),tx?.toWalletId||state.wallets[1]?.id||state.wallets[0].id)}</div>
      ${categoryField(tx?.categoryId||categoryChoices[0]?.[0]||'',type==='transfer'?'expense':type)}
      ${field('Merchant / title','payee',tx?.payee||'','text','placeholder="e.g. Pharmacy, cat food"',true)}
      ${tagsPicker(tx?.tags||[])}
      ${textareaField('Notes','note',tx?.note||'')}
      <div class="form-field full"><label class="checkbox-wrap"><input type="checkbox" name="excluded" ${tx?.excluded?'checked':''}> Exclude from spending charts and budgets</label></div>`;
    openDialog(tx?'Edit transaction':'Add transaction',body,data=>{
      const t=String(data.get('type')),amount=Number(data.get('amount')),walletId=String(data.get('walletId')),toWalletId=String(data.get('toWalletId')||'');
      if(!(amount>0&&Number.isFinite(amount)))return formError('Enter an amount greater than zero.');
      if(!walletById(walletId))return formError('Select a valid wallet.');
      if(t==='transfer'&&(!walletById(toWalletId)||walletId===toWalletId))return formError('Select two different wallets for transfers.');
      const categoryId=t==='transfer'?'':String(data.get('categoryId')||'');
      if(t!=='transfer'&&!state.categories.some(c=>c.id===categoryId&&c.kind===t))return formError('Create a category for this transaction type in Settings.');
      const date=String(data.get('date'));if(!/^\d{4}-\d{2}-\d{2}$/.test(date))return formError('Enter a valid date.');
      const value={type:t,amount:Math.round(amount*100)/100,date,categoryId,walletId,toWalletId:t==='transfer'?toWalletId:'',payee:String(data.get('payee')||'').trim(),note:String(data.get('note')||'').trim(),tags:data.getAll('tags').map(String),excluded:data.has('excluded')};
      if(tx) Object.assign(tx,value);else state.transactions.push({id:uid(),...value,scheduleId:null,occurrenceDate:null,createdAt:new Date().toISOString()});
      save();$('#appDialog').close();render();notify(tx?'Transaction updated':'Transaction added');
    },tx?'Save transaction':'Add transaction');
  }
  // One editor for both the budget envelope and the category caps inside it.
  // All changes are validated together and saved together, including new budgets.
  function budgetModal(id=null){
    const b=id?state.budgets.find(x=>x.id===id&&!x.parentBudgetId):null;
    if(id&&!b)return;
    const chosen=b?.categoryIds||[],custom=b?.period==='custom';
    const caps=b?categoryCaps(b):[];
    const catOptions=state.categories.filter(c=>c.kind==='expense'&&!c.archived)
      .sort((a,z)=>categoryFullName(a.id).localeCompare(categoryFullName(z.id)));
    const body=`<div class="budget-create-heading form-field full"><span class="section-kicker">STEP 1 · THE TOTAL</span><h3>Set your spending envelope</h3><p>The total is your spending ceiling. Category limits divide that amount; they do not add to it.</p></div>
      ${field('Budget name','name',b?.name||'','text','required maxlength="55" placeholder="e.g. Monthly spending"',true)}
      ${field('Total budget','amount',b?.amount??'','number','required min="0.01" step="0.01" placeholder="e.g. 430"')}
      ${selectField('Repeats','period',[['monthly','Every month'],['weekly','Every week'],['yearly','Every year'],['daily','Every day'],['custom','One-time / Custom dates']],b?.period||'monthly','required')}
      <div class="form-field full ${custom?'':'hide'}" id="customDates"><div class="budget-date-inputs">${field('Starts','startDate',b?.startDate||today(),'date')}${field('Ends','endDate',b?.endDate||today(),'date')}</div></div>
      <section class="budget-limit-editor form-field full" aria-label="Category spending limits">
        <div class="budget-editor-section-top"><div><span class="section-kicker">STEP 2 · YOUR CATEGORIES</span><h3>Divide the budget</h3><p>Give each category its own limit in money or as a percentage of your total.</p></div><button type="button" class="button button-light" id="budgetAddLimit">${icon('plus')} Add category</button></div>
        <div id="budgetLimitRows" class="budget-limit-rows"></div>
        <div id="budgetLimitEmpty" class="budget-limits-empty">No category limits yet. You can add some now or leave the whole amount unallocated.</div>
        <div class="budget-allocator-summary" aria-live="polite"><div><span>Total budget</span><strong id="budgetTotalLive">${esc(currency(b?.amount||0))}</strong></div><div><span>Allocated to categories</span><strong id="budgetAllocatedLive">${esc(currency(0))}</strong></div><div class="budget-summary-available"><span id="budgetRemainingLabel">Unallocated</span><strong id="budgetRemainingLive">${esc(currency(b?.amount||0))}</strong></div></div>
        <div class="budget-allocator-track" aria-hidden="true"><span id="budgetAllocatedBar"></span></div>
        <p id="budgetAllocatorHelp" class="budget-allocator-help">Category allocations must stay within the total budget.</p>
      </section>
      <details class="budget-scope form-field full" ${chosen.length?'open':''}><summary>Which expenses count toward this budget? <small>${chosen.length?'Selected categories':'All categories'}</small></summary>
        <fieldset class="budget-category-chooser"><legend>Expenses included</legend><label class="checkbox-wrap"><input type="checkbox" id="budgetAll" ${!chosen.length?'checked':''}> All expense categories</label>
        <div class="budget-category-options">${catOptions.map(c=>`<label class="checkbox-wrap"><input class="budget-cat" type="checkbox" name="categoryIds" value="${esc(c.id)}" ${chosen.includes(c.id)?'checked':''}> <span>${esc(c.emoji+' '+categoryFullName(c.id))}</span></label>`).join('')}</div><span class="form-help">Advanced: use this only if this budget should ignore some transactions. A limit must be for a category included here.</span></fieldset>
      </details>
      <div class="form-field full"><label class="checkbox-wrap"><input type="checkbox" name="active" ${b?.active!==false?'checked':''}> Budget active</label></div>`;
    openDialog(b?'Edit budget and category limits':'Create budget',body,data=>{
      const name=String(data.get('name')||'').trim(),amount=Number(data.get('amount')),period=String(data.get('period'));
      if(!name||!Number.isFinite(amount)||amount<=0)return formError('Enter a budget name and a total greater than zero.');
      if(!['daily','weekly','monthly','yearly','custom'].includes(period))return formError('Select a valid budget period.');
      let categoryIds=data.getAll('categoryIds').map(String);if($('#budgetAll').checked)categoryIds=[];
      if(!$('#budgetAll').checked&&!categoryIds.length)return formError('Select categories or choose All categories.');
      const startDate=String(data.get('startDate')||''),endDate=String(data.get('endDate')||'');
      if(period==='custom'&&(!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!/^\d{4}-\d{2}-\d{2}$/.test(endDate)||endDate<startDate))return formError('Enter a valid custom date range.');
      const parentAmount=Math.round(amount*100)/100;
      const rows=$$('.budget-limit-row','#budgetLimitRows');
      const capsToSave=[],seen=[];
      for(const row of rows){
        const categoryId=$('.budget-limit-category',row).value;
        const limitMode=$('.budget-limit-mode',row).value;
        const valRaw=$('.budget-limit-amount',row).value;
        const val=Number(valRaw);
        if(!catOptions.some(c=>c.id===categoryId))return formError('Choose a category for every limit.');
        if(!categoryIds.length || includesCategory(categoryIds,categoryId)){}else return formError(`${categoryFullName(categoryId)} isn't included in this budget. Update the expense filter or remove that limit.`);
        if(!['amount','percent'].includes(limitMode) || valRaw.trim()==='' || !Number.isFinite(val) || val<=0 || (limitMode==='percent'&&val>100))
          return formError('Each category needs a positive amount, or a percentage between 0 and 100.');
        if(seen.some(prev=>includesCategory([prev],categoryId)||includesCategory([categoryId],prev)))
          return formError('A category and its subcategory cannot both have separate limits. Choose one level.');
        seen.push(categoryId);
        const cleanVal=Math.round(val*100)/100;
        if(cleanVal<=0)return formError('Each limit must be at least 0.01.');
        const category=categoryById(categoryId);
        capsToSave.push({id:row.dataset.capId||uid(),name:category.name+' limit',amount:cleanVal,limitMode,period,categoryIds:[categoryId],active:true});
      }
      // Compute each effective cap in cents, so $0.01 rounding never permits over-allocation.
      const allocatedInCents=sum(capsToSave.map(c=>c.limitMode==='percent'?Math.round(parentAmount*100*c.amount/100):Math.round(c.amount*100)));
      if(allocatedInCents>Math.round(parentAmount*100))return formError(`Category limits exceed your budget by ${currency((allocatedInCents-Math.round(parentAmount*100))/100)}. Reduce a limit before saving.`);
      const value={name,amount:parentAmount,period,categoryIds,active:data.has('active'),...(period==='custom'?{startDate,endDate}:{startDate:'',endDate:''})};
      let parent=b;
      if(parent)Object.assign(parent,value);
      else{parent={id:uid(),...value};state.budgets.push(parent);selectedBudgetId=parent.id;}
      // Only replace this budget's caps: all other budgets remain unchanged.
      state.budgets=state.budgets.filter(existing=>existing.parentBudgetId!==parent.id);
      for(const saved of capsToSave)state.budgets.push({...saved,parentBudgetId:parent.id});
      selectedBudgetCategory=null;
      save();$('#appDialog').close();render();notify(b?'Budget and category limits saved':'Budget with category limits created');
    },b?'Save budget & limits':'Create budget');
    $('#appDialog').classList.add('budget-dialog');
    $('#input-period').addEventListener('change',e=>{$('#customDates').classList.toggle('hide',e.target.value!=='custom')});
    const all=$('#budgetAll');
    function updateExpenseScope(){const scope=$('.budget-scope summary small');if(scope)scope.textContent=all.checked?'All categories':`${$$('.budget-cat:checked','#appDialog').length} selected`;updateAllocator();}
    all.addEventListener('change',()=>{if(all.checked)$$('.budget-cat','#appDialog').forEach(c=>c.checked=false);updateExpenseScope()});
    $$('.budget-cat','#appDialog').forEach(c=>c.addEventListener('change',()=>{if(c.checked)all.checked=false;updateExpenseScope()}));
    const list=$('#budgetLimitRows'),add=$('#budgetAddLimit');
    function limitRow(item={}){
      const key=uid();
      const current=item.categoryIds?.[0]||'';
      const defaultCat=current||availableCategory()||'';
      const opts=catOptions.map(c=>`<option value="${esc(c.id)}" ${c.id===defaultCat?'selected':''}>${esc(c.emoji+' '+categoryFullName(c.id))}</option>`).join('');
      const row=document.createElement('div');row.className='budget-limit-row';
      if(item.id)row.dataset.capId=item.id;
      row.innerHTML=`<div class="budget-limit-number">${icon('budgets')}</div><div class="budget-limit-fields">
        <label>Category<select class="budget-limit-category">${opts}</select></label>
        <label>Limit type<select class="budget-limit-mode"><option value="amount" ${item.limitMode!=='percent'?'selected':''}>Fixed amount</option><option value="percent" ${item.limitMode==='percent'?'selected':''}>% of budget</option></select></label>
        <label>Limit<input class="budget-limit-amount" type="number" min="0.01" step="0.01" inputmode="decimal" value="${esc(item.amount??'')}" placeholder="0.00"></label>
      </div><div class="budget-limit-row-end"><span class="budget-limit-equivalent" aria-live="polite">${esc(currency(0))} allocated</span><button type="button" class="budget-limit-remove" aria-label="Remove category limit" title="Remove limit">${icon('trash')}</button></div>`;
      $('.budget-limit-remove',row).addEventListener('click',()=>{row.remove();refreshAvailableOptions();updateAllocator()});
      $('.budget-limit-category',row).addEventListener('change',()=>{refreshAvailableOptions();updateAllocator()});
      $('.budget-limit-mode',row).addEventListener('change',updateAllocator);
      $('.budget-limit-amount',row).addEventListener('input',updateAllocator);
      list.appendChild(row);refreshAvailableOptions();updateAllocator();
      return row;
    }
    function availableCategory(){
      const used=$$('.budget-limit-category',list).map(el=>el.value);
      const scope=all.checked?[]:$$('.budget-cat:checked','#appDialog').map(c=>c.value);
      return catOptions.find(c=>(!scope.length||includesCategory(scope,c.id)) && !used.some(other=>includesCategory([other],c.id)||includesCategory([c.id],other)))?.id;
    }
    function refreshAvailableOptions(){
      const rows=$$('.budget-limit-row',list),selected=rows.map(row=>$('.budget-limit-category',row).value);
      const scope=all.checked?[]:$$('.budget-cat:checked','#appDialog').map(c=>c.value);
      rows.forEach((row,i)=>{
        const select=$('.budget-limit-category',row);
        for(const opt of select.options){
          const clashes=selected.some((id,j)=>j!==i&&(includesCategory([id],opt.value)||includesCategory([opt.value],id)));
          const outside=scope.length&&!includesCategory(scope,opt.value);
          opt.disabled=clashes||outside;
          // Existing incompatible allocations stay visible, so they can be corrected.
        }
      });
      add.disabled=!availableCategory();
      add.title=add.disabled?'All eligible categories already have limits':'';
    }
    function updateAllocator(){
      const total=Number($('#input-amount').value)||0;
      let used=0,invalid=false;
      for(const row of $$('.budget-limit-row',list)){
        const mode=$('.budget-limit-mode',row).value,val=Number($('.budget-limit-amount',row).value);
        const effective=mode==='percent'?total*val/100:val;
        if($('.budget-limit-amount',row).value && (val<=0||!Number.isFinite(val)||mode==='percent'&&val>100))invalid=true;
        if(Number.isFinite(effective)&&effective>0)used+=Math.round(effective*100)/100;
        $('.budget-limit-equivalent',row).textContent=`${currency(Math.max(0,Number.isFinite(effective)?effective:0))} allocated`;
      }
      const remaining=total-used,over=remaining<-.005;
      $('#budgetTotalLive').textContent=currency(total);
      $('#budgetAllocatedLive').textContent=currency(used);
      $('#budgetRemainingLive').textContent=currency(Math.abs(remaining));
      $('#budgetRemainingLabel').textContent=over?'Overallocated':'Unallocated';
      $('.budget-summary-available').classList.toggle('is-over',over);
      $('#budgetAllocatedBar').style.width=`${total>0?cap(used/total*100,0,100):0}%`;
      $('#budgetAllocatedBar').classList.toggle('is-over',over);
      $('#budgetAllocatorHelp').textContent=over?'Category limits exceed the budget. Reduce one or increase the total before saving.':invalid?'Enter valid positive limits, up to 100% for a percentage.':'Any unallocated amount can still be spent in other categories.';
      $('#budgetAllocatorHelp').classList.toggle('is-over',over||invalid);
      $('#budgetLimitEmpty').classList.toggle('hide',!!list.children.length);
      refreshAvailableOptions();
    }
    add.addEventListener('click',()=>{
      const category=availableCategory();if(!category)return;
      const row=limitRow({categoryIds:[category],limitMode:'amount'});
      $('.budget-limit-amount',row).focus();
    });
    $('#input-amount').addEventListener('input',updateAllocator);
    caps.forEach(limitRow);
    updateAllocator();
    if(b)$('.dialog-actions','#entityForm').insertAdjacentHTML('afterbegin',`<button class="button button-danger" type="button" data-action="delete-budget" data-id="${esc(b.id)}">Delete</button>`);
  }
  function categoryCapModal(parentId,capId=null){
    const parent=state.budgets.find(b=>b.id===parentId&&!b.parentBudgetId);
    const limit=capId?state.budgets.find(b=>b.id===capId&&b.parentBudgetId===parentId):null;
    if(!parent)return;
    const existing=new Set(categoryCaps(parent).filter(b=>b.id!==capId).flatMap(b=>b.categoryIds||[]));
    const available=state.categories.filter(c=>c.kind==='expense'&&!existing.has(c.id)
      && ![...existing].some(other=>includesCategory([c.id],other)||includesCategory([other],c.id))
      && (!parent.categoryIds?.length||includesCategory(parent.categoryIds,c.id)))
      .sort((a,b)=>categoryFullName(a.id).localeCompare(categoryFullName(b.id)));
    if(!available.length){notify('All eligible categories already have limits.',true);return}
    const options=available.map(c=>[c.id,c.emoji+' '+categoryFullName(c.id)]);
    const mode=limit?.limitMode||'amount';
    const body=`<div class="budget-form-note form-field full">A category limit uses part of <strong>${esc(parent.name)} (${esc(currency(parent.amount))})</strong>; it never adds to the overall budget.</div>
      ${selectField('Category','categoryId',options,limit?.categoryIds?.[0]||available[0]?.id||'','required',true)}
      ${selectField('Limit type','limitMode',[['amount','Fixed amount'],['percent','Percentage of main budget']],mode,'required')}
      ${field('Limit','amount',limit?.amount??'','number','required min="0.01" step="0.01" placeholder="e.g. 20"')}
      <div class="form-field full"><span id="capExplanation" class="form-help"></span></div>`;
    openDialog(limit?'Edit category limit':'Add category limit',body,data=>{
      const categoryId=String(data.get('categoryId')),limitMode=String(data.get('limitMode')),amount=Number(data.get('amount'));
      if(!available.some(x=>x.id===categoryId)||!Number.isFinite(amount)||amount<=0)return formError('Choose a category and a positive limit.');
      if(limitMode==='percent'&&amount>100)return formError('Percentage limits must be 100% or less.');
      if(!['amount','percent'].includes(limitMode))return formError('Choose an amount or a percentage.');
      const otherAllocated=sum(categoryCaps(parent).filter(c=>c.id!==capId).map(c=>capValue(c,parent)));
      const thisAllocation=limitMode==='percent'?parent.amount*amount/100:amount;
      if(Math.round((otherAllocated+thisAllocation)*100)>Math.round(parent.amount*100))
        return formError(`Category limits exceed the main budget by ${currency(otherAllocated+thisAllocation-parent.amount)}. Reduce the limit first.`);
      const cat=categoryById(categoryId);
      const val={name:cat.name+' limit',amount:Math.round(amount*100)/100,limitMode,period:parent.period,categoryIds:[categoryId],active:true,parentBudgetId:parent.id};
      if(limit)Object.assign(limit,val);else state.budgets.push({id:uid(),...val});
      save();selectedBudgetCategory=null;$('#appDialog').close();render();notify(limit?'Category limit updated':'Category limit added');
    },limit?'Save limit':'Add limit');
    function explain(){
      const mode=$('#input-limitMode')?.value,amount=Number($('#input-amount')?.value)||0;
      const elsewhere=sum(categoryCaps(parent).filter(c=>c.id!==capId).map(c=>capValue(c,parent)));
      const free=parent.amount-elsewhere,actual=mode==='percent'?parent.amount*amount/100:amount;
      const excess=actual-free;
      $('#capExplanation').textContent=`${mode==='percent'?amount+'% = '+currency(actual):currency(amount)} of ${currency(parent.amount)} · ${currency(Math.max(0,free))} available for this category${excess>0.005?' · OVER BY '+currency(excess):''}.`;
    }
    $('#input-limitMode').addEventListener('change',explain);$('#input-amount').addEventListener('input',explain);explain();
    if(limit)$('.dialog-actions','#entityForm').insertAdjacentHTML('afterbegin',`<button class="button button-danger" type="button" data-action="delete-cap" data-id="${esc(limit.id)}">Delete limit</button>`);
  }

  function scheduleModal(id=null){const s=id?state.schedules.find(s=>s.id===id):null;if(id&&!s)return;
    const type=s?.type||'expense';const body=`${typeToggle(type)}
      ${field('Amount','amount',s?.amount||'','number','required min="0.01" step="0.01" placeholder="0.00"')}
      ${selectField('Frequency','frequency',[['daily','Every day'],['weekly','Every week'],['monthly','Every month'],['yearly','Every year']],s?.frequency||'monthly','required')}<div class="form-field full"><label class="checkbox-wrap"><input type="checkbox" name="oneTime" ${s?.oneTime?'checked':''}> Occurs only once (not recurring)</label></div>
      ${field('First occurrence','startDate',s?.startDate||today(),'date','required')}
      ${field('End date (optional)','endDate',s?.endDate||'','date')}
      ${selectField('From wallet','walletId',walletsOptions(),s?.walletId||state.wallets[0]?.id||'')}
      <div data-kind="toWallet" class="${type!=='transfer'?'hide':''}">${selectField('To wallet','toWalletId',walletsOptions(),s?.toWalletId||state.wallets[1]?.id||state.wallets[0]?.id||'')}</div>
      ${categoryField(s?.categoryId||categoryOptions(type==='transfer'?'expense':type)[0]?.[0]||'',type==='transfer'?'expense':type)}
      ${field('Description','payee',s?.payee||'','text','placeholder="e.g. Monthly cat food"',true)}
      ${tagsPicker(s?.tags||[])}
      ${textareaField('Notes','note',s?.note||'')}
      <div class="form-field full"><label class="checkbox-wrap"><input type="checkbox" name="autoPost" ${s?.autoPost===true?'checked':''}> Add transactions automatically when I open Folio</label><span class="form-help">Scheduled entries are posted when the app is opened, not in the background while closed.</span></div>
      <div class="form-field full"><label class="checkbox-wrap"><input type="checkbox" name="active" ${s?.active!==false?'checked':''}> Schedule active</label></div>`;
    openDialog(s?'Edit schedule':'Schedule a transaction',body,data=>{
      const t=String(data.get('type')),amount=Number(data.get('amount')),walletId=String(data.get('walletId')),toWalletId=String(data.get('toWalletId')||'');
      const categoryId=t==='transfer'?'':String(data.get('categoryId')||'');
      if(!(amount>0)||!Number.isFinite(amount))return formError('Enter an amount greater than zero.');
      if(!walletById(walletId))return formError('Select a valid wallet.');
      if(t==='transfer'&&(!walletById(toWalletId)||walletId===toWalletId))return formError('Transfers must use two different wallets.');
      if(t!=='transfer'&&!state.categories.some(c=>c.id===categoryId&&c.kind===t))return formError('Choose a category of the selected type.');
      const startDate=String(data.get('startDate')),endDate=String(data.get('endDate'));
      if(endDate&&endDate<startDate)return formError('The end date cannot be before the start date.');
      const value={type:t,amount:Math.round(amount*100)/100,frequency:String(data.get('frequency')),startDate,endDate,walletId,toWalletId:t==='transfer'?toWalletId:'',categoryId,payee:String(data.get('payee')||'').trim(),note:String(data.get('note')||'').trim(),tags:data.getAll('tags').map(String),autoPost:data.has('autoPost'),active:data.has('active'),oneTime:data.has('oneTime')};
      if(s)Object.assign(s,value);else state.schedules.push({id:uid(),skipDates:[],...value});
      processSchedules();save();$('#appDialog').close();render();notify(s?'Schedule updated':'Schedule created');
    },s?'Save schedule':'Create schedule');
    if(s)$('.dialog-actions','#entityForm').insertAdjacentHTML('afterbegin',`<button class="button button-danger" type="button" data-action="delete-schedule" data-id="${esc(s.id)}">Delete</button>`);
  }
  function walletModal(id=null){const w=id?walletById(id):null;
    openDialog(w?'Edit wallet':'Add wallet',`${field('Wallet name','name',w?.name||'','text','required maxlength="50" placeholder="e.g. Savings"',true)}${field('Opening balance','openingBalance',w?.openingBalance??0,'number','step="0.01" required')}${field('Color','color',w?.color||'#6658de','color')}`,data=>{
      const name=String(data.get('name')||'').trim(),openingBalance=Number(data.get('openingBalance'));
      if(!name||!Number.isFinite(openingBalance))return formError('Enter a valid wallet name and opening balance.');
      const color=String(data.get('color'));
      const value={name,openingBalance:Math.round(openingBalance*100)/100,color};
      if(w)Object.assign(w,value);else state.wallets.push({id:uid(),...value});
      save();$('#appDialog').close();render();notify(w?'Wallet updated':'Wallet added');
    },w?'Save wallet':'Add wallet');
    if(w&&state.wallets.length>1)$('.dialog-actions','#entityForm').insertAdjacentHTML('afterbegin',`<button class="button button-danger" type="button" data-action="delete-wallet" data-id="${esc(w.id)}">Delete</button>`);
  }
  function categoryModal(id=null){const c=id?categoryById(id):null;
    const parentOptions=[['','No parent (main category)'],...state.categories.filter(x=>x.id!==c?.id && x.kind===(c?.kind||'expense') && !categoryAncestors(x.id).some(a=>a.id===c?.id)).map(x=>[x.id,categoryFullName(x.id)])];
    const body=`${field('Category name','name',c?.name||'','text','required maxlength="50" placeholder="e.g. Cat care"',true)}${selectField('Category type','kind',[['expense','Expense'],['income','Income']],c?.kind||'expense','required')}${selectField('Parent category (optional)','parentId',parentOptions,c?.parentId||'')}${field('Emoji','emoji',c?.emoji||'🛍️','text','required maxlength="8"')}${field('Accent color','color',c?.color||'#6658de','color')}`;
    openDialog(c?'Edit category':'Add category',body,data=>{
      const name=String(data.get('name')||'').trim(),kind=String(data.get('kind'));
      if(!name)return formError('Category name is required.');
      if(c&&kind!==c.kind && (state.transactions.some(tx=>tx.categoryId===c.id)||state.categories.some(x=>x.parentId===c.id)))return formError('Cannot change type while transactions or subcategories use this category.');
      const parentId=String(data.get('parentId')||'');
      if(parentId && (!categoryById(parentId)||categoryById(parentId).kind!==kind||categoryAncestors(parentId).some(x=>x.id===c?.id)))return formError('Select a parent category of the same type.');
      const value={name,kind,parentId,emoji:String(data.get('emoji')).trim()||'🛍️',color:String(data.get('color'))};
      if(c)Object.assign(c,value);else state.categories.push({id:uid(),...value});
      save();$('#appDialog').close();render();notify(c?'Category updated':'Category added');
    },c?'Save category':'Add category');
    if(c)$('.dialog-actions','#entityForm').insertAdjacentHTML('afterbegin',`<button class="button button-danger" type="button" data-action="delete-category" data-id="${esc(c.id)}">Delete</button>`);
  }
  function download(name,content,mime){const blob=new Blob([content],{type:mime}),url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500)}
  function exportJson(){download(`folio-backup-${today()}.json`,JSON.stringify(state,null,2),'application/json');notify('Full backup downloaded')}
  function exportCsv(){const fields=['id','date','type','amount','category','wallet','to_wallet','payee','note','tags','excluded','recurring'];const line=values=>values.map(value=>{let t=String(value??'');if(/^[=+@\-\t\r]/.test(t)&&isNaN(Number(t)))t="'"+t;return '"'+t.replace(/"/g,'""')+'"'}).join(',');const rows=state.transactions.map(tx=>line([tx.id,tx.date,tx.type,tx.amount,displayCategory(tx).name,walletById(tx.walletId)?.name||'',walletById(tx.toWalletId)?.name||'',tx.payee,tx.note,(tx.tags||[]).join('; '),tx.excluded?'yes':'no',tx.scheduleId?'yes':'no']));download(`folio-transactions-${today()}.csv`,[fields.join(','),...rows].join('\r\n'),'text/csv;charset=utf-8');notify('Transactions exported as CSV')}
  function validateImport(s){
    if(!s||s.version!==1||!s.settings || !Array.isArray(s.transactions)||!Array.isArray(s.wallets)||!Array.isArray(s.categories)||!Array.isArray(s.budgets)||!Array.isArray(s.schedules))throw Error('Not a supported Folio backup.');
    if(!s.wallets.length || s.transactions.length>100000 || s.wallets.length>200 || s.categories.length>500 || s.budgets.length>1000 || s.schedules.length>1000)throw Error('The backup has invalid data sizes.');
    const ids=x=>x.every(v=>v&&typeof v.id==='string'&&v.id.length<150);
    if(![s.wallets,s.categories,s.budgets,s.schedules,s.transactions].every(ids))throw Error('The backup has invalid record IDs.');
    const hex=color=>/^#[0-9a-fA-F]{6}$/.test(color);
    if(!s.wallets.every(w=>typeof w.name==='string'&&Number.isFinite(Number(w.openingBalance))&&hex(w.color)))throw Error('The wallet data is invalid.');
    if(!s.categories.every(c=>['income','expense'].includes(c.kind)&&typeof c.name==='string'&&typeof c.emoji==='string'&&hex(c.color)))throw Error('The category data is invalid.');
    if(!s.transactions.every(t=>['income','expense','transfer'].includes(t.type)&&Number(t.amount)>0&&Number.isFinite(Number(t.amount))&&/^\d{4}-\d{2}-\d{2}$/.test(t.date)))throw Error('The transaction data is invalid.');
    if(!s.budgets.every(b=>Number(b.amount)>0 && Number.isFinite(Number(b.amount)) && ['daily','weekly','monthly','yearly','custom'].includes(b.period)&&Array.isArray(b.categoryIds)&&(!b.limitMode||['amount','percent'].includes(b.limitMode))&&(b.period!=='custom'||(/^\d{4}-\d{2}-\d{2}$/.test(b.startDate)&&/^\d{4}-\d{2}-\d{2}$/.test(b.endDate)&&b.endDate>=b.startDate))))throw Error('The budget data is invalid.');
    if(!s.schedules.every(sc=>Number(sc.amount)>0&&['daily','weekly','monthly','yearly'].includes(sc.frequency)&&/^\d{4}-\d{2}-\d{2}$/.test(sc.startDate)&&['expense','income','transfer'].includes(sc.type)))throw Error('The schedule data is invalid.');
    if(!s.categories.every(c=>!c.parentId || s.categories.some(parent=>parent.id===c.parentId && parent.kind===c.kind)))throw Error('Some subcategories have a missing or mismatched parent.');
    if(!['USD','LBP','EUR','GBP','CAD','AUD','AED','SAR'].includes(s.settings.currency))s.settings.currency='USD';
  }
  // CSV-only import is additive and intentionally omits unpaid entries and budgets.
  // For a complete transfer, use the offline CSV + SQLite converter in /tools.
  function parseCashewCsv(text){
    const result=[];let row=[],cell='',quoted=false;
    for(let i=0;i<text.length;i++){
      const c=text[i];
      if(quoted){if(c==='"' && text[i+1]==='"'){cell+='"';i++}else if(c==='"')quoted=false;else cell+=c;continue}
      if(c==='"'){if(cell==='')quoted=true;else cell+=c}
      else if(c===','){row.push(cell);cell=''}
      else if(c==='\n'){row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))result.push(row);row=[];cell=''}
      else cell+=c;
    }
    if(quoted)throw Error('Unclosed quoted value in CSV.');
    if(cell!==''||row.length){row.push(cell.replace(/\r$/,''));if(row.some(x=>x.trim()))result.push(row)}
    return result;
  }
  async function importCashewCsv(file){if(!file)return;
    try{
      if(file.size>8*1024*1024)throw Error('CSV is larger than 8MB.');
      const table=parseCashewCsv((await file.text()).replace(/^\ufeff/,''));
      if(table.length<2)throw Error('No transactions found.');
      const keys=table.shift().map(k=>k.trim().toLowerCase());
      const required=['account','amount','amount unpaid','title','note','date','income','type','category name','subcategory name'];
      if(!required.every(k=>keys.includes(k)))throw Error('This is not a recognized Cashew transaction CSV.');
      const rows=table.map(line=>Object.fromEntries(keys.map((k,i)=>[k,(line[i]||'').trim()])));
      if(rows.length>20000)throw Error('Too many transactions in one file.');
      const paid=rows.filter(r=>r.amount && !r['amount unpaid']);
      const unpaid=rows.length-paid.length;
      if(!window.confirm(`Import up to ${paid.length} paid transactions into Folio?\n\n${unpaid} unpaid/upcoming entries will be skipped. Your current budgets and schedules will be kept. Existing matching transactions will not be duplicated.\n\nFor a full Cashew migration including budgets, restore the JSON created by the included converter instead.`))return;
      const signature=t=>[t.date,t.type,Number(t.amount).toFixed(2),(t.payee||'').trim().toLowerCase(),(t.note||'').trim().toLowerCase(),t.walletId,categoryFullName(t.categoryId).toLowerCase()].join('|');
      const known=new Set(state.transactions.map(signature));let added=0,skipped=0;
      const pickColor=(value,fallback='#8577db')=>/^0x[0-9a-f]{2}[0-9a-f]{6}$/i.test(value||'')?'#'+value.slice(-6).toLowerCase():fallback;
      for(const row of paid){
        const signed=Number(row.amount),date=(row.date||'').slice(0,10);
        if(!Number.isFinite(signed)||signed===0||!/^\d{4}-\d{2}-\d{2}$/.test(date)){skipped++;continue}
        const type=signed>0?'income':'expense';
        const walletName=row.account||'Bank';
        let wallet=state.wallets.find(w=>w.name.toLowerCase()===walletName.toLowerCase());
        if(!wallet){wallet={id:uid(),name:walletName,openingBalance:0,color:'#6658de'};state.wallets.push(wallet)}
        const mainName=row['category name']|| (type==='expense'?'Other expenses':'Other income');
        let parent=state.categories.find(c=>c.kind===type&&!c.parentId&&c.name.toLowerCase()===mainName.toLowerCase());
        if(!parent){parent={id:uid(),name:mainName,kind:type,emoji:type==='income'?'💰':'📦',color:pickColor(row.color),parentId:''};state.categories.push(parent)}
        let category=parent;
        if(row['subcategory name']){
          const name=row['subcategory name'];
          category=state.categories.find(c=>c.kind===type&&c.parentId===parent.id&&c.name.toLowerCase()===name.toLowerCase());
          if(!category){category={id:uid(),name,kind:type,emoji:parent.emoji,color:parent.color,parentId:parent.id};state.categories.push(category)}
        }
        const item={id:uid(),type,amount:Math.abs(signed),date,walletId:wallet.id,toWalletId:'',categoryId:category.id,
          payee:row.title||'',note:row.note||'',tags:[],excluded:false,scheduleId:null,occurrenceDate:null,createdAt:new Date().toISOString()};
        const key=signature(item);
        if(known.has(key)){skipped++;continue}
        state.transactions.push(item);known.add(key);added++;
      }
      save();render();notify(`${added} Cashew transactions imported. ${skipped} duplicates/invalid skipped. ${unpaid} unpaid not included.`);
    }catch(e){notify('Cashew CSV import failed: '+e.message,true)}finally{$('#cashewCsvInput').value=''}
  }
  async function importJson(file){if(!file)return;try{
    if(file.size>12*1024*1024)throw Error('Backup exceeds the 12 MB import limit.');
    const content=await file.text();const parsed=JSON.parse(content);validateImport(parsed);
    if(!window.confirm(`Replace your current data with this backup?\n\nIt contains ${parsed.transactions.length} transactions, ${parsed.budgets.length} budgets and ${parsed.schedules.length} schedules. Export your current data first if you need it.`))return;
    state=normalizeCashewBudgets(parsed);processSchedules();save();selectedMonth=firstDay(today());render();notify('Backup restored successfully');
  }catch(e){notify('Import failed: '+e.message,true)}finally{$('#importInput').value=''}}
  function removeTransaction(id){const tx=state.transactions.find(t=>t.id===id);if(!tx)return;
    if(!window.confirm(`Delete ${transactionLabel(tx)} for ${currency(tx.amount)}?`))return;
    // Undoing a manually paid schedule restores its planned occurrence.
    // Automatic rules need a skip to prevent the removed record being regenerated immediately.
    if(tx.scheduleId && tx.occurrenceDate){const s=state.schedules.find(s=>s.id===tx.scheduleId);if(s?.autoPost){s.skipDates=s.skipDates||[];if(!s.skipDates.includes(tx.occurrenceDate))s.skipDates.push(tx.occurrenceDate)}}
    state.transactions=state.transactions.filter(t=>t.id!==id);save();render();notify(tx.scheduleId?'Transaction deleted; manual schedule restored if active':'Transaction deleted');
  }
  function deleteBudget(id){const b=state.budgets.find(x=>x.id===id);if(!b)return;if(!window.confirm(`Delete budget "${b.name}" and all its category limits? Paid transactions will stay.`))return;state.budgets=state.budgets.filter(x=>x.id!==id&&x.parentBudgetId!==id);if(selectedBudgetId===id)selectedBudgetId=null;selectedBudgetCategory=null;$('#appDialog').close();save();render();notify('Budget deleted')}
  function deleteSchedule(id){const s=state.schedules.find(x=>x.id===id);if(!s)return;if(!window.confirm(`Delete schedule "${s.payee||s.frequency}"? Past posted transactions will stay in your history.`))return;state.schedules=state.schedules.filter(x=>x.id!==id);$('#appDialog').close();save();render();notify('Schedule deleted')}
  function deleteWallet(id){if(state.wallets.some(w=>w.id===id)&&state.wallets.length<=1)return formError('You must keep at least one wallet.');
    if(state.transactions.some(t=>t.walletId===id||t.toWalletId===id)||state.schedules.some(s=>s.walletId===id||s.toWalletId===id))return formError('This wallet is used by transactions or schedules. Edit those first.');
    if(!window.confirm('Delete this unused wallet?'))return;state.wallets=state.wallets.filter(w=>w.id!==id);$('#appDialog').close();save();render();notify('Wallet deleted');
  }
  function deleteCategory(id){if(state.categories.some(c=>c.parentId===id)||state.transactions.some(t=>t.categoryId===id)||state.schedules.some(s=>s.categoryId===id)||state.budgets.some(b=>b.categoryIds?.includes(id)))return formError('Category is used by subcategories, transactions, budgets, or schedules. Move those first.');
    if(!window.confirm('Delete this unused category?'))return;state.categories=state.categories.filter(c=>c.id!==id);$('#appDialog').close();save();render();notify('Category deleted');
  }
  // Each Pay click is atomic: it creates one transaction for one occurrence.
  function moveBudgetPeriod(n){
    const b=parentBudgets().find(b=>b.id===selectedBudgetId);if(!b||b.period==='custom')return;
    const reference=budgetRef(b),next=budgetPeriodOffset(b.period,budgetRange(b,reference).start,n);
    // A separate budget reference permits reviewing weeks/days inside one month.
    budgetDateOverride=next;
    selectedBudgetCategory=null;render();
  }
  function shiftMonth(n){const d=parseDate(selectedMonth);selectedMonth=localYmd(new Date(d.getFullYear(),d.getMonth()+n,1));render()}
  document.addEventListener('click',event=>{
    const routeEl=event.target.closest('[data-route]');if(routeEl){event.preventDefault();setRoute(routeEl.dataset.route);return}
    const type=event.target.closest('[data-type-switch]');if(type){const f=type.closest('form');if(f)updateTypeForm(f,type.dataset.typeSwitch);return}
    const btn=event.target.closest('[data-action]');if(!btn)return;
    const action=btn.dataset.action,id=btn.dataset.id;
    const actions={
      'prev-month':()=>shiftMonth(-1),'next-month':()=>shiftMonth(1),
      'add-transaction':()=>transactionModal(),'edit-transaction':()=>transactionModal(id),'delete-transaction':()=>removeTransaction(id),
      'add-budget':()=>budgetModal(),'edit-budget':()=>budgetModal(id),'delete-budget':()=>deleteBudget(id),
      'select-budget':()=>{selectedBudgetId=id;selectedBudgetCategory=null;budgetDateOverride=null;render()},
      'budget-prev-period':()=>moveBudgetPeriod(-1),'budget-next-period':()=>moveBudgetPeriod(1),
      'set-budget-period':()=>{budgetDateOverride=btn.dataset.date;selectedBudgetCategory=null;render()},
      'filter-budget-category':()=>{selectedBudgetCategory=selectedBudgetCategory===id?null:id;render()},
      'clear-budget-category':()=>{selectedBudgetCategory=null;render()},
      'add-cap':()=>categoryCapModal(id),'edit-cap':()=>{const c=state.budgets.find(x=>x.id===id);if(c)categoryCapModal(c.parentBudgetId,id)},
      'delete-cap':()=>{const c=state.budgets.find(x=>x.id===id&&x.parentBudgetId);if(!c)return;if(!window.confirm(`Remove category limit for ${categoryFullName(c.categoryIds[0])}?`))return;state.budgets=state.budgets.filter(x=>x.id!==id);$('#appDialog').close();save();render();notify('Category limit removed')},
      'add-schedule':()=>scheduleModal(),'edit-schedule':()=>scheduleModal(id),'delete-schedule':()=>deleteSchedule(id),
      'toggle-schedule':()=>{const s=state.schedules.find(s=>s.id===id);if(!s)return;s.active=!s.active;processSchedules();save();render();notify(s.active?'Schedule resumed':'Schedule paused')},
      'pay-occurrence':()=>postOccurrence(id,btn.dataset.date),'skip-occurrence':()=>skipOccurrence(id,btn.dataset.date),'add-wallet':()=>walletModal(),'edit-wallet':()=>walletModal(id),'delete-wallet':()=>deleteWallet(id),
      'add-category':()=>categoryModal(),'edit-category':()=>categoryModal(id),'delete-category':()=>deleteCategory(id),
      'close-dialog':()=>$('#appDialog').close(),'export-json':exportJson,'export-csv':exportCsv,
      'import-json':()=>$('#importInput').click(),
      'github-save':()=>{try{readSyncForm();syncResult('GitHub connection settings saved. Your finance data has not been uploaded.')}catch(e){syncResult(e.message,true)}},
      'github-check':()=>githubAction('check'),'github-push':()=>githubAction('push'),'github-pull':()=>githubAction('pull'),
      'import-cashew-csv':()=>$('#cashewCsvInput').click(),
      'clear-data':()=>{if(!window.confirm('Delete ALL Folio data on this browser? This cannot be undone without a JSON backup.'))return;if(!window.confirm('Last check: permanently reset Folio and start from zero?'))return;state=initialState();save();selectedMonth=firstDay(today());render();notify('Folio reset to a clean start')}
    };
    if(actions[action])actions[action]();
  });
  $('#appDialog').addEventListener('click',event=>{if(event.target===$('#appDialog'))$('#appDialog').close()});
  $('#appDialog').addEventListener('submit',event=>{event.preventDefault();const f=event.target;if(f.id==='entityForm'){const form=new FormData(f);$('#appDialog')._submit?.(form)}});
  $('#importInput').addEventListener('change',event=>importJson(event.target.files[0]));
  $('#cashewCsvInput').addEventListener('change',event=>importCashewCsv(event.target.files[0]));
  document.addEventListener('click',event=>{const el=event.target.closest('[data-tx-status]');if(el){filters.status=el.dataset.txStatus;render()}});
  document.addEventListener('change',event=>{const el=event.target;
    if(el.id==='txTypeFilter'){filters.type=el.value;render()}
    else if(el.id==='txCategoryFilter'){filters.category=el.value;render()}
    else if(el.id==='txWalletFilter'){filters.wallet=el.value;render()}
    else if(el.id==='txTagFilter'){filters.tag=el.value;render()}
    else if(el.id==='currencySelect'){state.settings.currency=el.value;save();render();notify('Display currency updated. Existing amounts were not converted.')}
  });
  document.addEventListener('input',event=>{if(event.target.id==='txSearch'){const input=event.target,caret=input.selectionStart;filters.search=input.value;render();const newInput=$('#txSearch');if(newInput){newInput.focus();newInput.setSelectionRange(caret,caret)}}});
  window.addEventListener('hashchange',()=>{const to=location.hash.replace('#','');if(to!==route&&navItems.some(([id])=>id===to)){route=to;render()}});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden){const n=processSchedules();if(n){render();notify(`${n} scheduled transaction${n===1?'':'s'} added`)}}});
  window.addEventListener('storage',event=>{if(event.key===KEY && event.newValue){state=loadState();render();notify('Data updated from another tab')}});
  $('#topAdd').addEventListener('click',()=>transactionModal());
  route=navItems.some(([id])=>id===location.hash.slice(1))?location.hash.slice(1):'dashboard';
  const created=processSchedules();render();if(created)setTimeout(()=>notify(`${created} scheduled transaction${created===1?'':'s'} added`),250);
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost'||location.hostname==='127.0.0.1'))navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
})();
