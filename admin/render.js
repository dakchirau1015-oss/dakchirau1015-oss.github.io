/* 게시판 정적 페이지 만들기 — 관리자 화면(브라우저)과 node 양쪽에서 같은 코드로 쓴다.
   글 원본: board/data/<slug>.json, 목록: board/posts.json
   만드는 파일: board/index.html, board/<slug>/index.html, sitemap.xml */
(function (root) {
  var SITE = 'https://yydplus.co.kr';
  var CSS_VER = '9';
  var KAKAO = 'https://open.kakao.com/o/szJtwKyi';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // 한글은 그대로 두고 주소에 못 쓰는 글자만 정리
  function slugify(title) {
    return String(title).trim().toLowerCase()
      .replace(/[\s_]+/g, '-')
      .replace(/[^0-9a-z가-힣\-]/g, '')
      .replace(/-+/g, '-').replace(/^-|-$/g, '')
      .slice(0, 60) || 'post';
  }

  function fmtDate(iso) {
    var d = new Date(iso);
    var p = function (n) { return (n < 10 ? '0' : '') + n; };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }

  function textOf(html) {
    return String(html || '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'")
      .replace(/\s+/g, ' ').trim();
  }

  function summaryOf(post) {
    // 목록 데이터(posts.json)에는 본문이 없어서 발행 때 저장해 둔 excerpt를 쓴다
    var s = post.summary && post.summary.trim() ? post.summary.trim() : (post.excerpt || textOf(post.content));
    return s.length > 120 ? s.slice(0, 118) + '…' : s;
  }

  function coverOf(post) {
    if (post.cover) return post.cover;
    var m = String(post.content || '').match(/<img[^>]+src="([^"]+)"/);
    return m ? m[1] : '';
  }

  function head(o) {
    return '<!DOCTYPE html>\n<html lang="ko">\n<head>\n<meta charset="UTF-8">\n' +
      '<meta name="viewport" content="width=device-width, initial-scale=1.0">\n' +
      '<title>' + esc(o.title) + '</title>\n' +
      '<meta name="description" content="' + esc(o.desc) + '">\n' +
      '<link rel="canonical" href="' + SITE + o.path + '">\n' +
      '<link rel="icon" href="' + SITE + '/favicon.ico" sizes="any">\n' +
      '<link rel="icon" type="image/png" sizes="32x32" href="' + SITE + '/favicon-32.png">\n' +
      '<link rel="apple-touch-icon" href="' + SITE + '/apple-touch-icon.png">\n' +
      '<meta property="og:type" content="' + (o.type || 'website') + '">\n' +
      '<meta property="og:url" content="' + SITE + o.path + '">\n' +
      '<meta property="og:title" content="' + esc(o.title) + '">\n' +
      '<meta property="og:description" content="' + esc(o.desc) + '">\n' +
      '<meta property="og:image" content="' + esc(o.image ? (o.image.charAt(0) === '/' ? SITE + o.image : o.image) : SITE + '/yplus-share.png') + '">\n' +
      (o.extraHead || '') +
      '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css">\n' +
      '<link rel="stylesheet" href="/site.css?v=' + CSS_VER + '">\n</head>\n<body>\n';
  }

  function header() {
    return '<header>\n  <div class="inner nav">\n' +
      '    <a class="brand" href="/" aria-label="Y-PLUS 홈"><span class="brand-logo"><img src="/logo.png" alt=""></span><span><b>Y-PLUS</b><small>ONLINE MARKETING</small></span></a>\n' +
      '    <ul class="menu" id="menu">\n' +
      '      <li><a href="/#about">소개</a></li>\n' +
      '      <li><a href="/products/">서비스상품</a></li>\n' +
      '      <li><a href="/#perf">진행사례</a></li>\n' +
      '      <li><a href="/board/" class="on">게시판</a></li>\n' +
      '      <li><a href="/#contact">문의</a></li>\n' +
      '      <li><a href="/#guide">상담안내</a></li>\n' +
      '    </ul>\n' +
      '    <a class="tel" href="tel:010-3046-7649"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/></svg>010-3046-7649</a>\n' +
      '    <button class="burger" id="burger" aria-label="메뉴 열기" aria-expanded="false">☰</button>\n' +
      '  </div>\n</header>\n';
  }

  function footer() {
    return '<footer>\n  <div class="inner">\n    <div>\n' +
      '      <div class="brand"><span class="brand-logo"><img src="/logo.png" alt=""></span><span><b>Y-PLUS</b><small>ONLINE MARKETING</small></span></div>\n' +
      '      <p>(주)JS컴퍼니&amp;흐름컴퍼니 | 대표자 : 박준성 &amp; 손동혁 | 사업자등록번호 : 899-87-04241</p>\n' +
      '      <p>주소 : 인천시 부평구 주부토로 236 테크노밸리 U1센터 B동 912호</p>\n' +
      '      <p>담당 : 유광일 본부장 | 메일 : dakchirau1015@gmail.com | 카카오톡 : uilgg</p>\n' +
      '      <p>고객센터 : 070-7706-8000 | 팩스 : 032-330-8001</p>\n' +
      '      <p style="margin-top:18px">© 2026 JS COMPANY &amp; FLOW COMPANY. All rights reserved.</p>\n' +
      '    </div>\n    <div class="right">\n' +
      '      <a class="ftel" href="tel:010-3046-7649">010-3046-7649</a>\n' +
      '      <p>카카오톡 상담은 언제든 남겨 주세요</p>\n' +
      '      <div class="links"><a href="/products/">서비스상품</a><a href="' + KAKAO + '" target="_blank" rel="noopener">카카오톡 상담</a></div>\n' +
      '    </div>\n  </div>\n</footer>\n' +
      '<div class="float-bar" id="floatBar"><p><em>채널별 맞춤 무료진단</em>을 해주는 업계 1% 마케터 Y-PLUS</p><a class="btn btn-main" href="/#contact">무료진단 신청</a></div>\n';
  }

  var commonScript =
    '<script>\n(function(){\n' +
    '  var b=document.getElementById("burger"),m=document.getElementById("menu");\n' +
    '  b.addEventListener("click",function(){b.setAttribute("aria-expanded",m.classList.toggle("open"));});\n' +
    '  var f=document.getElementById("floatBar");\n' +
    '  function s(){f.classList.toggle("show",scrollY>300);}\n' +
    '  addEventListener("scroll",s,{passive:true});s();\n' +
    '})();\n</script>\n';

  function card(p) {
    var cover = coverOf(p);
    return '<a class="b-card" href="/board/' + encodeURIComponent(p.slug) + '/" data-tags="' + esc((p.tags || []).join('|')) + '">' +
      (cover ? '<span class="b-thumb"><img src="' + esc(cover) + '" alt="" loading="lazy"></span>'
             : '<span class="b-thumb b-thumb-empty"><b>' + esc(p.title.slice(0, 1)) + '</b></span>') +
      '<span class="b-body"><span class="b-cat">칼럼</span><b>' + esc(p.title) + '</b><span class="b-sum">' + esc(summaryOf(p)) + '</span>' +
      '<span class="b-date">' + fmtDate(p.date) + '</span></span></a>';
  }

  function renderList(posts) {
    // 비노출(hidden) 글은 게시판 목록·해시태그·다른 글에서만 뺀다 (글 페이지·사이트맵은 남겨 검색엔진이 인식)
    var list = posts.filter(function (p) { return !p.hidden; }).sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    var tagCount = {};
    list.forEach(function (p) { (p.tags || []).forEach(function (t) { tagCount[t] = (tagCount[t] || 0) + 1; }); });
    var tags = Object.keys(tagCount).sort(function (a, b) { return tagCount[b] - tagCount[a] || (a < b ? -1 : 1); });
    return head({ title: '게시판 — 유광일 본부장 칼럼 | Y-PLUS 와이플러스', desc: '6년 현업 온라인 마케터 유광일 본부장이 직접 쓰는 쿠팡·스마트스토어·플레이스 마케팅 이야기.', path: '/board/' }) +
      header() +
      '<section class="sub-hero"><div class="inner"><span class="en">COLUMN</span><h1>게시판</h1><p>유광일 본부장이 현장에서 직접 쓰는 온라인 마케팅 이야기</p></div></section>\n' +
      '<div class="inner board">\n' +
      '  <div class="b-filter" id="bFilter" hidden><span>#<b id="bTag"></b> 글만 보는 중</span><a href="/board/">전체 보기</a></div>\n' +
      (list.length ? '  <div class="b-grid" id="bGrid">\n    ' + list.map(card).join('\n    ') + '\n  </div>\n'
                   : '  <div class="b-empty">아직 올라온 글이 없습니다. 곧 첫 글이 올라옵니다.</div>\n') +
      (tags.length ? '  <div class="b-tags"><h2>해시태그</h2><div><a href="/board/" class="on" data-tag="">전체</a>' +
        tags.map(function (t) { return '<a href="/board/?tag=' + encodeURIComponent(t) + '" data-tag="' + esc(t) + '">#' + esc(t) + '</a>'; }).join('') + '</div></div>\n' : '') +
      '</div>\n' + footer() + commonScript +
      '<script>\n(function(){\n' +
      '  var tag=new URLSearchParams(location.search).get("tag");if(!tag)return;\n' +
      '  [].forEach.call(document.querySelectorAll(".b-card"),function(c){c.hidden=c.dataset.tags.split("|").indexOf(tag)<0;});\n' +
      '  [].forEach.call(document.querySelectorAll(".b-tags a"),function(a){a.classList.toggle("on",a.dataset.tag===tag);});\n' +
      '  document.getElementById("bTag").textContent=tag;document.getElementById("bFilter").hidden=false;\n' +
      '})();\n</script>\n</body>\n</html>\n';
  }

  function renderPost(post, posts) {
    var others = posts.filter(function (p) { return p.slug !== post.slug && !p.hidden; })
      .sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
    var path = '/board/' + encodeURIComponent(post.slug) + '/';
    var ld = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'BlogPosting', headline: post.title,
      datePublished: post.date, dateModified: post.updated || post.date,
      author: { '@type': 'Person', name: '유광일' }, mainEntityOfPage: SITE + path
    }).replace(/</g, '\\u003c');
    return head({ title: post.title + ' | Y-PLUS 게시판', desc: summaryOf(post), path: path, type: 'article', image: coverOf(post),
      extraHead: '<script type="application/ld+json">' + ld + '</script>\n' }) +
      header() +
      '<article class="inner post">\n' +
      '  <a class="post-back" href="/board/">← 게시판</a>\n' +
      '  <span class="b-cat">칼럼</span>\n' +
      '  <h1>' + esc(post.title) + '</h1>\n' +
      '  <div class="post-meta"><b>유광일 본부장</b><span>' + fmtDate(post.date) + '</span>' +
      (post.updated && fmtDate(post.updated) !== fmtDate(post.date) ? '<span>수정 ' + fmtDate(post.updated) + '</span>' : '') + '</div>\n' +
      '  <div class="post-body">\n' + post.content + '\n  </div>\n' +
      '  <div class="post-cta"><b>우리 매장·상품에 맞는 방향,<br>무료진단으로 먼저 확인하세요</b><div class="btns"><a class="btn btn-w" href="/#contact">무료진단 받기 →</a><a class="btn btn-dark" href="' + KAKAO + '" target="_blank" rel="noopener">카카오톡 상담</a></div></div>\n' +
      ((post.tags || []).length ? '  <div class="post-tags">' + post.tags.map(function (t) { return '<a href="/board/?tag=' + encodeURIComponent(t) + '">#' + esc(t) + '</a>'; }).join('') + '</div>\n' : '') +
      (others.length ? '  <div class="post-more"><h2>다른 글</h2><div class="b-grid">' + others.map(card).join('') + '</div></div>\n' : '') +
      '</article>\n' + footer() + commonScript + '</body>\n</html>\n';
  }

  function renderSitemap(posts) {
    var today = new Date().toISOString().slice(0, 10);
    var urls = [['/', today, '1.0'], ['/products/', today, '0.9'], ['/board/', today, '0.8']];
    posts.forEach(function (p) { urls.push(['/board/' + encodeURIComponent(p.slug) + '/', (p.updated || p.date).slice(0, 10), '0.7']); });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
      urls.map(function (u) { return '  <url>\n    <loc>' + SITE + u[0] + '</loc>\n    <lastmod>' + u[1] + '</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>' + u[2] + '</priority>\n  </url>'; }).join('\n') +
      '\n</urlset>\n';
  }

  var api = { esc: esc, slugify: slugify, fmtDate: fmtDate, textOf: textOf, summaryOf: summaryOf,
    renderList: renderList, renderPost: renderPost, renderSitemap: renderSitemap, coverOf: coverOf };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.BoardRender = api;
})(this);
