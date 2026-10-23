/* Story interaction layer — progressive enhancement; all motion disabled for reduced-motion users. */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches;
  var $ = function(s,r){return (r||document).querySelector(s)};
  var $$ = function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
  var clamp = function(v,a,b){return Math.max(a,Math.min(b,v))};
  var lerp = function(a,b,t){return a+(b-a)*t};
  var root = document.documentElement;
  var bar = $('.bar');
  function setBH(){ if(bar) root.style.setProperty('--bh', bar.offsetHeight+'px'); }
  setBH(); window.addEventListener('resize',setBH);

  /* ---------- hero headline split + ready ---------- */
  var h1 = $('#h1');
  if(h1){
    var label = h1.textContent.replace(/\s+/g,' ').trim(), n = 0;
    (function walk(node){
      Array.prototype.slice.call(node.childNodes).forEach(function(ch){
        if(ch.nodeType===3){
          var frag = document.createDocumentFragment();
          ch.textContent.split(/(\s+)/).forEach(function(t){
            if(!t) return;
            if(!t.trim()){ frag.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span'); w.className='w'; w.setAttribute('aria-hidden','true');
            var i = document.createElement('i'); i.textContent=t; i.style.setProperty('--i',n++); w.appendChild(i); frag.appendChild(w);
          });
          ch.parentNode.replaceChild(frag,ch);
        } else if(ch.nodeType===1){ walk(ch); }
      });
    })(h1);
    h1.setAttribute('aria-label',label);
  }
  var go = function(){ document.body.classList.add('ready'); };
  (document.fonts && document.fonts.ready ? Promise.race([document.fonts.ready, new Promise(function(r){setTimeout(r,900)})]) : Promise.resolve()).then(function(){ requestAnimationFrame(function(){ requestAnimationFrame(go); }); });
  if(reduce) go();

  /* ---------- sections, nav, ghost numbers ---------- */
  var secs = $$('main .sec[data-title]');
  var rail = $('#rail'), chips = $('#chips');
  secs.forEach(function(s,i){
    var num = ('0'+(i+1)).slice(-2), t = s.getAttribute('data-title');
    if(rail){ var li = document.createElement('li'); li.innerHTML = '<a href="#'+s.id+'" data-id="'+s.id+'"><b>'+num+'</b>'+t+'</a>'; rail.appendChild(li); }
    if(chips){ var a = document.createElement('a'); a.href='#'+s.id; a.setAttribute('data-id',s.id); a.textContent = num+' '+t; chips.appendChild(a); }
    var g = document.createElement('div'); g.className='ghost'; g.setAttribute('aria-hidden','true'); g.textContent=num; g.setAttribute('data-par','-0.12'); s.insertBefore(g,s.firstChild);
    var k = $('.kicker b',s); if(k) k.textContent = num;
  });
  function setOn(id){
    $$('[data-id]').forEach(function(a){ var on = a.getAttribute('data-id')===id; a.classList.toggle('on',on); if(on && chips && a.parentNode===chips){ chips.scrollTo({left:a.offsetLeft-24,behavior:reduce?'auto':'smooth'}); } });
  }
  if('IntersectionObserver' in window){
    var spy = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting) setOn(e.target.id); }); },{rootMargin:'-35% 0px -60% 0px'});
    secs.forEach(function(s){spy.observe(s)});
    var alt = 0;
    var tio = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ var i = secs.indexOf(e.target); document.body.setAttribute('data-tone', i%2===1 ? 'tint' : ''); } }); },{rootMargin:'-45% 0px -45% 0px'});
    secs.forEach(function(s){tio.observe(s)});
  }

  /* ---------- progress ---------- */
  var prog = $('#prog');
  function onScrollProg(){ var h = root; var p = h.scrollTop/(h.scrollHeight-h.clientHeight); if(prog) prog.style.width = clamp(p,0,1)*100+'%'; }
  window.addEventListener('scroll',onScrollProg,{passive:true}); onScrollProg();

  /* ---------- reveal ---------- */
  var targets = [];
  $$('.sec .col, .sec .wide').forEach(function(c){ Array.prototype.slice.call(c.children).forEach(function(ch){ if(!ch.classList.contains('ghost')) targets.push(ch); }); });
  $$('.stat,.x-metric').forEach(function(el){ targets.push(el); });
  targets.forEach(function(el){ el.classList.add('rv'); });
  if('IntersectionObserver' in window && !reduce){
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target);} }); },{threshold:.08,rootMargin:'0px 0px -5% 0px'});
    targets.forEach(function(r){io.observe(r)});
  } else { targets.forEach(function(r){r.classList.add('in')}); }

  /* ---------- evidence-gap toggle ---------- */
  var evBtn = $('#evBtn');
  var gaps = $$('.gap,.gap-note,.x-note,.x-redaction,.x-fieldgap,.x-disclose');
  if(evBtn){
    if(!gaps.length){ evBtn.style.display='none'; }
    evBtn.addEventListener('click',function(){ var on = evBtn.getAttribute('aria-pressed')!=='true'; evBtn.setAttribute('aria-pressed',on); document.body.classList.toggle('ev-on',on); });
  }

  /* ---------- auto chain (pinned horizontal) ---------- */
  var hs = null, track = null, hsBar = null, pinned = false, dist = 0;
  if(secs.length>=4){
    hs = document.createElement('section'); hs.className='hscroll'; hs.id='chain'; hs.setAttribute('aria-label','The case in '+secs.length+' steps');
    var cards = secs.map(function(s,i){
      var h = $('h2',s); var title = s.getAttribute('data-title');
      var txt = h ? h.textContent.trim() : '';
      return '<a class="hs-card" href="#'+s.id+'"><span class="n">'+('0'+(i+1)).slice(-2)+'</span><h4>'+title+'</h4><p>'+txt.replace(/</g,'&lt;')+'</p><span class="go">Jump to this step →</span></a>';
    }).join('');
    hs.innerHTML = '<div class="hs-pin"><div class="hs-head"><div class="kicker"><b>↔</b>The whole case, traced</div><h2 style="margin-bottom:6px">'+secs.length+' steps, start to finish</h2><p style="margin:0">Keep scrolling — every step links to the detail behind it.</p></div><div class="hs-track" id="hsTrack">'+cards+'</div><div class="hs-bar" aria-hidden="true"><i id="hsBar"></i></div></div>';
    var first = secs[0]; first.parentNode.insertBefore(hs, first);
    track = $('#hsTrack'); hsBar = $('#hsBar');
  }
  var mqPin = window.matchMedia('(min-width: 900px)');
  function hsSetup(){
    if(!hs) return;
    pinned = mqPin.matches && !reduce;
    hs.classList.toggle('pinned',pinned);
    if(pinned){
      var pin = $('.hs-pin',hs), bh = bar ? bar.offsetHeight : 61;
      dist = Math.max(0, track.scrollWidth - pin.clientWidth + 40);
      hs.style.height = (window.innerHeight - bh + dist) + 'px';
    } else { hs.style.height=''; if(track) track.style.transform=''; }
  }
  hsSetup(); window.addEventListener('resize',hsSetup); window.addEventListener('load',hsSetup);
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(hsSetup);

  /* ---------- scroll-linked frame ---------- */
  var spot = $('#spot'), hero = $('#top'), heroTop = $('#heroTop'), sx = 300, sy = 200, tsx = 300, tsy = 200;
  if(hero && fine && !reduce){ hero.addEventListener('pointermove',function(e){ var b = hero.getBoundingClientRect(); tsx = e.clientX-b.left; tsy = e.clientY-b.top; }); }
  var pars = $$('[data-par]'), ticking = false;
  function frame(){
    ticking = false;
    var vh = window.innerHeight;
    if(!reduce){
      sx = lerp(sx,tsx,.12); sy = lerp(sy,tsy,.12);
      if(spot) spot.style.transform = 'translate3d('+sx.toFixed(1)+'px,'+sy.toFixed(1)+'px,0)';
      if(hero && heroTop){ var hr = hero.getBoundingClientRect(); var p = clamp(-hr.top/(hr.height*.6),0,1); heroTop.style.transform = 'translate3d(0,'+(p*60).toFixed(1)+'px,0)'; heroTop.style.opacity = (1-p*.9).toFixed(3); }
      pars.forEach(function(el){ var r = el.getBoundingClientRect(); if(r.bottom<-200||r.top>vh+200) return; var off = (r.top + r.height/2 - vh/2)*parseFloat(el.getAttribute('data-par')); el.style.transform = 'translate3d(0,'+(-off).toFixed(1)+'px,0)'; });
    }
    if(pinned){ var bh = bar ? bar.offsetHeight : 61; var rr = hs.getBoundingClientRect(); var span = hs.offsetHeight - (window.innerHeight-bh); var pp = clamp(-(rr.top-bh)/span,0,1); track.style.transform = 'translate3d('+(-pp*dist).toFixed(1)+'px,0,0)'; if(hsBar) hsBar.style.transform = 'scaleX('+pp.toFixed(3)+')'; }
    if(!reduce) requestAnimationFrame(function(){ if(Math.abs(sx-tsx)>.5||Math.abs(sy-tsy)>.5) req(); });
  }
  function req(){ if(!ticking){ ticking = true; requestAnimationFrame(frame); } }
  window.addEventListener('scroll',req,{passive:true}); window.addEventListener('resize',req);
  window.addEventListener('pointermove',function(){ if(!reduce) req(); },{passive:true});
  req();

  /* ---------- tilt, magnetic, cursor (fine pointers only) ---------- */
  if(fine && !reduce){
    $$('.card,.cs-grid-item,.stat,.x-metric,.x-clause,.learning,.x-learn,.hs-card,.affinity-cluster,.x-affinity-cell,.fieldgrid>div,.x-fieldgrid>div').forEach(function(el){
      el.classList.add('tilt');
      el.addEventListener('pointermove',function(e){
        var b = el.getBoundingClientRect(), x = (e.clientX-b.left)/b.width, y = (e.clientY-b.top)/b.height;
        el.style.setProperty('--mx',(x*100)+'%'); el.style.setProperty('--my',(y*100)+'%');
        el.style.transform = 'perspective(900px) rotateX('+((.5-y)*5).toFixed(2)+'deg) rotateY('+((x-.5)*6).toFixed(2)+'deg) translateZ(0)';
      });
      el.addEventListener('pointerleave',function(){ el.style.transform=''; });
    });
    $$('.ev-toggle,.proto-fab,.x-fab,.chips a').forEach(function(el){
      el.classList.add('mag');
      el.addEventListener('pointermove',function(e){ var b = el.getBoundingClientRect(); var dx = e.clientX-(b.left+b.width/2), dy = e.clientY-(b.top+b.height/2); el.style.transform = 'translate('+(dx*.22).toFixed(1)+'px,'+(dy*.28).toFixed(1)+'px)'; });
      el.addEventListener('pointerleave',function(){ el.style.transform=''; });
    });
    var cur = $('#cur');
    if(cur){
      var ring = $('i',cur), dot = $('b',cur), mx = -100, my = -100, rx = -100, ry = -100;
      window.addEventListener('pointermove',function(e){ mx = e.clientX; my = e.clientY; });
      document.addEventListener('pointerover',function(e){
        var t = e.target; if(!t || !t.closest) return;
        var z = t.closest('.zoomable'); var h = t.closest('a,button,[role="button"]');
        cur.classList.toggle('zoom',!!z); cur.classList.toggle('hot',!!h && !z);
      });
      (function loop(){ rx = lerp(rx,mx,.18); ry = lerp(ry,my,.18); ring.style.left = rx+'px'; ring.style.top = ry+'px'; dot.style.left = mx+'px'; dot.style.top = my+'px'; requestAnimationFrame(loop); })();
    }
  }

  /* ---------- click-to-zoom lightbox on every figure image ---------- */
  var lb = $('#lb'), lbi = $('#lbi'), lbc = $('#lbc'), lastEl = null;
  if(lb){
    $$('.figure img,.x-figure img,.cs-hero-figure img,.x-hero-fig img,.x-hero img,.fig img').forEach(function(img){
      img.classList.add('zoomable'); img.tabIndex = 0; img.setAttribute('role','button'); img.setAttribute('aria-label','Enlarge image: '+(img.alt||'figure'));
      var open = function(){ lastEl = img; lbi.src = img.currentSrc||img.src; lbi.alt = img.alt||''; var cap = img.parentNode.querySelector('.figure-cap,.x-figcap,figcaption'); lbc.textContent = cap ? cap.textContent : ''; if(lb.showModal) lb.showModal(); else lb.setAttribute('open',''); };
      img.addEventListener('click',open);
      img.addEventListener('keydown',function(e){ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); open(); } });
    });
    var closeLb = function(){ if(lb.close) lb.close(); else lb.removeAttribute('open'); if(lastEl) lastEl.focus(); };
    $('#lbx').addEventListener('click',closeLb);
    lb.addEventListener('click',function(e){ if(e.target===lb) closeLb(); });
  }
})();
