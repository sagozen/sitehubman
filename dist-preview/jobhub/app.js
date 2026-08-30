'use strict';
const CATEGORIES=[{id:1,name:'Information Technology',icon:'\uD83D\uDCBB',count:8420,bg:'#EFF6FF'},{id:2,name:'Banking & Finance',icon:'\uD83C\uDFE6',count:5310,bg:'#F0FDF4'},{id:3,name:'Marketing & Sales',icon:'\uD83D\uDCCA',count:4875,bg:'#FFF7ED'},{id:4,name:'Healthcare',icon:'\uD83C\uDFE5',count:3290,bg:'#FDF4FF'},{id:5,name:'Education',icon:'\uD83C\uDF93',count:2940,bg:'#FFFDE7'},{id:6,name:'Engineering',icon:'\u2699\uFE0F',count:3780,bg:'#FEF2F2'},{id:7,name:'Hospitality',icon:'\uD83C\uDFE8',count:2650,bg:'#F0FDFA'},{id:8,name:'Legal',icon:'\u2696\uFE0F',count:1420,bg:'#F5F3FF'},{id:9,name:'Human Resources',icon:'\uD83D\uDC65',count:2180,bg:'#FFF0F3'},{id:10,name:'Logistics',icon:'\uD83D\uDE9A',count:2870,bg:'#F0F9FF'},{id:11,name:'NGO',icon:'\uD83C\uDF0D',count:1690,bg:'#F0FDF4'},{id:12,name:'Creative & Design',icon:'\uD83C\uDFA8',count:1850,bg:'#FFF5F5'}];
const JOBS=[
  {id:1,title:'Senior Software Engineer',company:'Metfone',logo:'MF',lc:'#0057A8',location:'Phnom Penh',type:'fulltime',salary:'$2,000-$2,800/mo',posted:'2 hours ago',deadline:'Closes Aug 15, 2026',badges:['Full-time','Hot'],bt:['type','hot']},
  {id:2,title:'Loan Officer',company:'Acleda Bank',logo:'AC',lc:'#E4002B',location:'Siem Reap',type:'fulltime',salary:'$800-$1,200/mo',posted:'4 hours ago',deadline:'Closes Aug 20, 2026',badges:['Full-time','New'],bt:['type','new']},
  {id:3,title:'Brand Manager',company:'Smart Axiata',logo:'SM',lc:'#FF6200',location:'Phnom Penh',type:'fulltime',salary:'$1,500-$2,000/mo',posted:'1 day ago',deadline:'Closes Sep 1, 2026',badges:['Full-time','Featured'],bt:['type','featured']},
  {id:4,title:'UI/UX Designer',company:'Wing Bank',logo:'WB',lc:'#1A237E',location:'Phnom Penh (Remote)',type:'remote',salary:'$1,200-$1,800/mo',posted:'2 days ago',deadline:'Closes Aug 30, 2026',badges:['Remote','Hot'],bt:['remote','hot']},
  {id:5,title:'HR Specialist',company:'AEON Mall',logo:'AM',lc:'#2D5BA3',location:'Phnom Penh',type:'fulltime',salary:'$700-$1,000/mo',posted:'3 days ago',deadline:'Closes Aug 25, 2026',badges:['Full-time'],bt:['type']},
  {id:6,title:'Data Analyst Intern',company:'TrueMoney',logo:'TM',lc:'#2196F3',location:'Phnom Penh',type:'internship',salary:'$300-$450/mo',posted:'1 day ago',deadline:'Closes Aug 18, 2026',badges:['Internship','New'],bt:['type','new']},
  {id:7,title:'English Teacher',company:'CamEd Business School',logo:'CB',lc:'#0F766E',location:'Phnom Penh',type:'parttime',salary:'$15-$25/hr',posted:'5 days ago',deadline:'Closes Sep 10, 2026',badges:['Part-time'],bt:['type']},
  {id:8,title:'Supply Chain Manager',company:'Canadia Bank',logo:'CB',lc:'#CC0000',location:'Phnom Penh',type:'fulltime',salary:'$1,800-$2,500/mo',posted:'2 days ago',deadline:'Closes Sep 5, 2026',badges:['Full-time','Featured'],bt:['type','featured']}
];
const COMPANIES=[
  {name:'Metfone',industry:'Telecommunications',jobs:142,logo:'MF',color:'#0057A8'},
  {name:'Acleda Bank',industry:'Banking & Finance',jobs:95,logo:'AC',color:'#E4002B'},
  {name:'Smart Axiata',industry:'Telecommunications',jobs:118,logo:'SM',color:'#FF6200'},
  {name:'AEON Mall',industry:'Retail & Commerce',jobs:76,logo:'AM',color:'#2D5BA3'},
  {name:'Wing Bank',industry:'Fintech',jobs:63,logo:'WB',color:'#1A237E'},
  {name:'TrueMoney',industry:'Mobile Payments',jobs:54,logo:'TM',color:'#2196F3'},
  {name:'ANZ Royal',industry:'Banking',jobs:41,logo:'AR',color:'#003087'},
  {name:'Canadia Bank',industry:'Banking & Finance',jobs:88,logo:'CB',color:'#CC0000'}
];
const TESTIMONIALS=[
  {text:'JobHub Pro helped me land my dream job at Metfone within just 3 weeks. The job alerts are incredibly relevant.',name:'Dara Chann',role:'Software Engineer at Metfone',av:'DC',ac:'#0057A8'},
  {text:'As an HR manager, JobHub Pro is my go-to for finding qualified candidates. The quality of applicants is far superior.',name:'Sophea Lim',role:'HR Director at AEON Mall',av:'SL',ac:'#2D5BA3'},
  {text:'I was a fresh graduate with no connections. JobHub Pro connected me with TrueMoney for an internship that became a full-time offer.',name:'Bopha Keo',role:'Data Analyst at TrueMoney',av:'BK',ac:'#2196F3'},
  {text:'The salary guide feature is priceless. I used it to negotiate a 30% pay raise at my new company.',name:'Virak Phan',role:'Finance Manager at Canadia Bank',av:'VP',ac:'#CC0000'},
  {text:'Relocated from Siem Reap to Phnom Penh and had 5 interviews lined up before I even arrived - all from JobHub Pro.',name:'Sothea Ros',role:'Marketing Specialist at Smart',av:'SR',ac:'#FF6200'},
  {text:'Our employer branding tools help showcase our culture authentically. We saw a 40% increase in quality applications.',name:'Channary Mam',role:'Talent Acquisition at Acleda',av:'CM',ac:'#E4002B'}
];

const state = { saved: new Set(), filter: 'all' };
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

function getBadgeClass(t) {
  const m = { type:'jb-type', hot:'jb-hot', new:'jb-new', featured:'jb-featured', remote:'jb-remote' };
  return m[t] || 'jb-type';
}

function renderCategories() {
  const g = $('#categoriesGrid');
  if (!g) return;
  g.innerHTML = CATEGORIES.map(c =>
    '<div class="cat-card" role="button" tabindex="0" data-cat="' + c.id + '">' +
    '<div class="cat-icon" style="background:' + c.bg + '">' + c.icon + '</div>' +
    '<div class="cat-name">' + c.name + '</div>' +
    '<div class="cat-count">' + c.count.toLocaleString() + ' jobs</div>' +
    '</div>'
  ).join('');
  $$('.cat-card').forEach(function(card) {
    card.addEventListener('click', function() {
      $('#searchKeyword').value = card.querySelector('.cat-name').textContent;
      document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
    });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

function jobCardHTML(j) {
  var sv = state.saved.has(j.id);
  var badges = j.badges.map(function(b, i) {
    return '<span class="jbadge ' + getBadgeClass(j.bt[i]) + '">' + b + '</span>';
  }).join('');
  return '<article class="job-card" data-id="' + j.id + '" data-type="' + j.type + '" tabindex="0">' +
    '<div class="job-card-header">' +
    '<div class="job-logo" style="background:' + j.lc + '">' + j.logo + '</div>' +
    '<div class="job-info">' +
    '<div class="job-title">' + j.title + '</div>' +
    '<div class="job-company">' + j.company + '</div>' +
    '</div>' +
    '<button class="job-save' + (sv ? ' saved' : '') + '" data-id="' + j.id + '" aria-label="Save job">' + (sv ? '\u2665' : '\u2661') + '</button>' +
    '</div>' +
    '<div class="job-badges">' + badges + '</div>' +
    '<div class="job-meta">' +
    '<span class="job-meta-item">\uD83D\uDCCD ' + j.location + '</span>' +
    '<span class="job-meta-item">\uD83D\uDD50 ' + j.posted + '</span>' +
    '</div>' +
    '<div class="job-footer">' +
    '<div><div class="job-salary">' + j.salary + '</div><div class="job-deadline">' + j.deadline + '</div></div>' +
    '<button class="job-apply" data-id="' + j.id + '">Apply Now</button>' +
    '</div>' +
    '</article>';
}

function renderJobs(filter) {
  var g = $('#jobsGrid');
  if (!g) return;
  var list = filter === 'all' ? JOBS : JOBS.filter(function(j) { return j.type === filter; });
  g.innerHTML = list.length
    ? list.map(jobCardHTML).join('')
    : '<div style="grid-column:1/-1;text-align:center;padding:48px;color:#64748B"><p style="font-weight:600">No jobs found in this category</p></div>';
  bindJobs();
}

function bindJobs() {
  $$('.job-save').forEach(function(b) {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      var id = parseInt(b.dataset.id);
      if (state.saved.has(id)) {
        state.saved.delete(id);
        b.textContent = '\u2661';
        b.classList.remove('saved');
        showToast('Removed from saved');
      } else {
        state.saved.add(id);
        b.textContent = '\u2665';
        b.classList.add('saved');
        showToast('Job saved!', 'success');
      }
    });
  });
  $$('.job-apply').forEach(function(b) {
    b.addEventListener('click', function(e) {
      e.stopPropagation();
      var j = JOBS.find(function(x) { return x.id === parseInt(b.dataset.id); });
      if (j) { setModalJob(j); openModal(); }
    });
  });
  $$('.job-card').forEach(function(card) {
    card.addEventListener('click', function() {
      var j = JOBS.find(function(x) { return x.id === parseInt(card.dataset.id); });
      if (j) { setModalJob(j); openModal(); }
    });
    card.addEventListener('keydown', function(e) { if (e.key === 'Enter') card.click(); });
  });
}

function setModalJob(j) {
  $('#loginModalTitle').textContent = 'Apply: ' + j.title;
  document.querySelector('#loginModal .modal-subtitle').textContent = j.company + ' \u00b7 ' + j.location + ' \u00b7 ' + j.salary;
}

function renderCompanies() {
  var g = $('#companiesGrid');
  if (!g) return;
  g.innerHTML = COMPANIES.map(function(c) {
    return '<div class="company-card" tabindex="0" role="button">' +
      '<div class="company-logo" style="background:' + c.color + '">' + c.logo + '</div>' +
      '<div class="company-name">' + c.name + '</div>' +
      '<div class="company-industry">' + c.industry + '</div>' +
      '<span class="company-jobs">\uD83D\uDCBC ' + c.jobs + ' Open Positions</span>' +
      '</div>';
  }).join('');
  $$('.company-card').forEach(function(c) {
    c.addEventListener('click', function() {
      $('#searchKeyword').value = c.querySelector('.company-name').textContent;
      document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
    });
    c.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); }
    });
  });
}

function renderTestimonials() {
  var g = $('#testimonialsGrid');
  if (!g) return;
  g.innerHTML = TESTIMONIALS.map(function(t) {
    return '<div class="testimonial-card">' +
      '<div class="t-stars">\u2605\u2605\u2605\u2605\u2605</div>' +
      '<p class="t-text">&ldquo;' + t.text + '&rdquo;</p>' +
      '<div class="t-footer">' +
      '<div class="t-avatar" style="background:' + t.ac + '">' + t.av + '</div>' +
      '<div><div class="t-name">' + t.name + '</div><div class="t-role">' + t.role + '</div></div>' +
      '</div></div>';
  }).join('');
}

function animateCounters() {
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      var el = e.target, target = parseInt(el.dataset.target), dur = 1800, step = 16;
      var inc = target / (dur / step), cur = 0;
      var t = setInterval(function() {
        cur = Math.min(cur + inc, target);
        el.textContent = cur >= 1e6
          ? (cur / 1e6).toFixed(1) + 'M+'
          : cur >= 1000
          ? Math.floor(cur / 1000) + 'K+'
          : Math.floor(cur) + (target === 98 ? '%' : '+');
        if (cur >= target) clearInterval(t);
      }, step);
      obs.unobserve(el);
    });
  }, { threshold: 0.3 });
  $$('[data-target]').forEach(function(c) { obs.observe(c); });
}

function initFilterTabs() {
  $$('.filter-tab').forEach(function(t) {
    t.addEventListener('click', function() {
      $$('.filter-tab').forEach(function(x) { x.classList.remove('active'); x.setAttribute('aria-selected','false'); });
      t.classList.add('active'); t.setAttribute('aria-selected', 'true');
      state.filter = t.dataset.filter;
      renderJobs(state.filter);
    });
  });
}

function initSearch() {
  var btn = $('#searchBtn'), kw = $('#searchKeyword'), loc = $('#searchLocation');
  function doSearch() {
    var k = kw.value.trim(), l = loc.value.trim();
    if (!k && !l) { showToast('Please enter a keyword or location', 'error'); kw.focus(); return; }
    showToast('Searching for "' + (k || 'all jobs') + '"' + (l ? ' in ' + l : '') + '...');
    document.getElementById('jobs').scrollIntoView({ behavior: 'smooth' });
  }
  btn.addEventListener('click', doSearch);
  [kw, loc].forEach(function(i) { i.addEventListener('keydown', function(e) { if (e.key === 'Enter') doSearch(); }); });
  $$('.popular-tag').forEach(function(tag) {
    tag.addEventListener('click', function(e) { e.preventDefault(); kw.value = tag.dataset.keyword; doSearch(); });
  });
}

function initNavbar() {
  var nb = $('#navbar'), hb = $('#hamburger'), mm = $('#mobileMenu');
  window.addEventListener('scroll', function() {
    nb.classList.toggle('scrolled', window.scrollY > 10);
    $('#backToTop').classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  hb.addEventListener('click', function() {
    var open = mm.classList.toggle('open');
    hb.classList.toggle('open', open);
    hb.setAttribute('aria-expanded', open);
    mm.setAttribute('aria-hidden', !open);
  });
  $$('.mobile-link').forEach(function(l) {
    l.addEventListener('click', function() {
      mm.classList.remove('open'); hb.classList.remove('open');
      hb.setAttribute('aria-expanded','false'); mm.setAttribute('aria-hidden','true');
    });
  });
}

function openModal() { $('#loginModal').classList.add('open'); $('#loginEmail').focus(); document.body.style.overflow = 'hidden'; }
function closeModal() { $('#loginModal').classList.remove('open'); document.body.style.overflow = ''; }

function initModal() {
  $('#loginBtn').addEventListener('click', function(e) {
    e.preventDefault();
    $('#loginModalTitle').textContent = 'Sign In to JobHub Pro';
    document.querySelector('#loginModal .modal-subtitle').textContent = 'Access thousands of jobs and track your applications';
    openModal();
  });
  $('#closeLoginModal').addEventListener('click', closeModal);
  $('#loginModal').addEventListener('click', function(e) { if (e.target === $('#loginModal')) closeModal(); });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeModal(); });
  $('#loginForm').addEventListener('submit', function(e) {
    e.preventDefault();
    var em = $('#loginEmail'), pw = $('#loginPassword');
    var ee = $('#loginEmailError'), pe = $('#loginPasswordError');
    var ok = true;
    ee.textContent = ''; pe.textContent = ''; em.classList.remove('error'); pw.classList.remove('error');
    if (!em.value.trim()) { ee.textContent = 'Email is required'; em.classList.add('error'); em.focus(); ok = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { ee.textContent = 'Please enter a valid email'; em.classList.add('error'); em.focus(); ok = false; }
    if (ok && !pw.value) { pe.textContent = 'Password is required'; pw.classList.add('error'); pw.focus(); ok = false; }
    if (!ok) return;
    var b = e.target.querySelector('[type=submit]');
    b.disabled = true; b.textContent = 'Signing in...';
    setTimeout(function() { b.disabled = false; b.textContent = 'Sign In'; showToast('Welcome back!', 'success'); closeModal(); }, 1400);
  });
}

function initNewsletter() {
  var f = $('#newsletterForm');
  if (!f) return;
  f.addEventListener('submit', function(e) {
    e.preventDefault();
    var em = $('#newsletterEmail');
    if (!em.value.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em.value)) { showToast('Please enter a valid email', 'error'); em.focus(); return; }
    var b = f.querySelector('button[type=submit]');
    b.disabled = true; b.textContent = 'Subscribing...';
    setTimeout(function() { b.disabled = false; b.textContent = 'Subscribe Free'; em.value = ''; showToast('Subscribed! Check your inbox.', 'success'); }, 1200);
  });
}

function initSalaryBars() {
  var bars = $$('.chart-bar');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
      if (!e.isIntersecting) return;
      bars.forEach(function(b) {
        var w = b.style.getPropertyValue('--w');
        b.style.width = '0%';
        requestAnimationFrame(function() { setTimeout(function() { b.style.width = w; }, 100); });
      });
      obs.disconnect();
    });
  }, { threshold: 0.3 });
  var s = $('.salary-banner');
  if (s) obs.observe(s);
}

function initBackToTop() {
  var b = $('#backToTop');
  if (b) b.addEventListener('click', function() { window.scrollTo({ top: 0, behavior: 'smooth' }); });
}

function initSignupBtn() {
  var b = $('#signupBtn');
  if (b) b.addEventListener('click', function(e) { e.preventDefault(); showToast('Employer portal - contact sales@jobhubpro.com.kh'); });
}

function initSmoothScroll() {
  $$('a[href^="#"]').forEach(function(a) {
    a.addEventListener('click', function(e) {
      var h = a.getAttribute('href');
      if (h === '#') return;
      var t = document.querySelector(h);
      if (t) { e.preventDefault(); window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 80, behavior: 'smooth' }); }
    });
  });
}

function initScrollReveal() {
  var items = $$('.cat-card,.job-card,.company-card,.testimonial-card,.step-card');
  var obs = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry, i) {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '0';
        entry.target.style.transform = 'translateY(16px)';
        setTimeout(function() {
          entry.target.style.transition = 'opacity 350ms ease,transform 350ms ease';
          entry.target.style.opacity = '1';
          entry.target.style.transform = 'translateY(0)';
        }, i * 40);
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function(el) { el.style.opacity = '0'; obs.observe(el); });
}

var toastTimer = null;
function showToast(msg, type) {
  type = type || 'info';
  var ex = document.querySelector('.toast');
  if (ex) ex.remove();
  if (toastTimer) clearTimeout(toastTimer);
  var t = document.createElement('div');
  t.className = 'toast ' + type;
  t.setAttribute('role', 'status');
  t.setAttribute('aria-live', 'polite');
  t.textContent = msg;
  document.body.appendChild(t);
  toastTimer = setTimeout(function() {
    t.classList.add('out');
    setTimeout(function() { t.remove(); }, 260);
  }, 3500);
}

document.addEventListener('DOMContentLoaded', function() {
  renderCategories();
  renderJobs('all');
  renderCompanies();
  renderTestimonials();
  initNavbar();
  initFilterTabs();
  initSearch();
  initModal();
  initNewsletter();
  initBackToTop();
  initSalaryBars();
  initSignupBtn();
  initSmoothScroll();
  animateCounters();
  requestAnimationFrame(function() { setTimeout(initScrollReveal, 100); });
});
