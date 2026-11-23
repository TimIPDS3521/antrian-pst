// Pembantu halaman admin: sesi, layout (sidebar + header), flash, paginasi, format tanggal.
(function () {
  var KEY = 'admin_token', KEY_USER = 'admin_user', KEY_FLASH = 'admin_flash';

  function store() { return sessionStorage.getItem(KEY) ? sessionStorage : localStorage; }
  function read(k) { try { return sessionStorage.getItem(k) || localStorage.getItem(k); } catch (e) { return null; } }

  var ADMIN = window.ADMIN = {
    token: function () { return read(KEY); },
    user: function () { try { return JSON.parse(read(KEY_USER) || 'null'); } catch (e) { return null; } },
    save: function (token, user, remember) {
      ADMIN.clear();
      var s = remember ? localStorage : sessionStorage;
      s.setItem(KEY, token); s.setItem(KEY_USER, JSON.stringify(user));
    },
    clear: function () {
      try { [sessionStorage, localStorage].forEach(function (s) { s.removeItem(KEY); s.removeItem(KEY_USER); }); } catch (e) {}
    },
    flash: function (msg) { try { sessionStorage.setItem(KEY_FLASH, msg); } catch (e) {} },
    takeFlash: function () {
      try { var m = sessionStorage.getItem(KEY_FLASH); sessionStorage.removeItem(KEY_FLASH); return m; } catch (e) { return null; }
    },
    // panggilan API admin; sesi habis -> kembali ke halaman login
    call: async function (action, body) {
      try {
        return await api.post(action, Object.assign({ token: ADMIN.token() }, body || {}));
      } catch (e) {
        if (e && e.status === 401) { ADMIN.clear(); window.location.replace('login.html'); }
        throw e;
      }
    },
    logout: async function () {
      try { await api.post('logout', { token: ADMIN.token() }); } catch (e) {}
      ADMIN.clear();
      window.location.replace('login.html');
    },
    // Pastikan sudah login; kalau belum langsung ke halaman login
    require: function () {
      if (!ADMIN.token()) { window.location.replace('login.html'); return false; }
      return true;
    }
  };

  var NAV = [
    ['dashboard', 'dashboard.html', '🏠 Dashboard', ''],
    ['antrian', 'antrian.html', '📋 Daftar Antrian', ''],
    ['petugas', 'petugas.html', '👤 Kelola Petugas', '']
  ];

  // Menyusun kerangka halaman admin (setara layouts/admin.blade.php). Mengembalikan elemen #page.
  ADMIN.shell = function (title, active) {
    document.title = title;
    var u = ADMIN.user();
    var nav = NAV.map(function (n) {
      return '<a href="' + n[1] + '" class="block px-3 py-2 rounded-lg hover:bg-white/10 ' + (active === n[0] ? 'bg-[#7a2418] text-white' : '') + '">' + n[2] + '</a>';
    }).join('');
    document.getElementById('app').innerHTML =
      '<div class="flex min-h-screen">' +
      '<aside class="w-60 bg-[#2b0e09] text-slate-200 flex-shrink-0 hidden md:flex md:flex-col">' +
      '<div class="px-5 py-5 border-b border-white/10 flex items-center gap-3">' +
      '<img src="../images/logo-bps.png" alt="Logo BPS" class="h-10 w-auto object-contain"><div>' +
      '<p class="font-semibold text-white text-sm leading-tight">Admin Panel</p>' +
      '<p class="text-xs text-white/50">Antrian PST BPS Kabupaten Ngawi</p></div></div>' +
      '<nav class="flex-1 px-3 py-4 space-y-1 text-sm">' + nav +
      '<a href="../display.html" target="_blank" class="block px-3 py-2 rounded-lg hover:bg-white/10">🖥️ Layar Display</a>' +
      '<a href="../index.html" target="_blank" class="block px-3 py-2 rounded-lg hover:bg-white/10">🔗 Halaman QR</a>' +
      '</nav>' +
      '<div class="p-3 border-t border-white/10">' +
      '<button id="btn-logout" class="w-full text-left px-3 py-2 rounded-lg hover:bg-white/10 text-sm">🚪 Keluar</button></div>' +
      '</aside>' +
      '<div class="flex-1 flex flex-col">' +
      '<header class="bg-white border-b px-4 md:px-8 py-4 flex items-center justify-between">' +
      '<h1 class="font-semibold text-slate-800">' + esc(title) + '</h1>' +
      '<span class="text-sm text-[#7a2418] font-medium">' + esc(u ? u.name : '') + '</span></header>' +
      '<main class="flex-1 p-4 md:p-8"><div id="flash"></div><div id="page"></div></main></div></div>';
    document.getElementById('btn-logout').addEventListener('click', ADMIN.logout);
    var f = ADMIN.takeFlash();
    if (f) ADMIN.showFlash(f);
    return document.getElementById('page');
  };

  ADMIN.showFlash = function (msg) {
    document.getElementById('flash').innerHTML =
      '<div class="mb-4 bg-green-100 text-green-800 text-sm px-4 py-3 rounded-lg">' + esc(msg) + '</div>';
  };

  ADMIN.fotoHtml = function (p, imgCls) {
    return p.foto
      ? '<img src="' + esc(p.foto) + '" alt="' + esc(p.nama) + '" class="' + imgCls + '" referrerpolicy="no-referrer">'
      : esc((p.nama || '?').charAt(0).toUpperCase());
  };

  // 'd M Y, H:i' dari 'yyyy-MM-dd HH:mm:ss' (bulan bahasa Inggris, seperti aslinya)
  ADMIN.tglJam = function (s) {
    if (!s) return '';
    var m = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/.exec(s);
    if (!m) return s;
    return m[3] + ' ' + BULAN_EN[Number(m[2]) - 1].slice(0, 3) + ' ' + m[1] + ', ' + m[4] + ':' + m[5];
  };

  ADMIN.hariIni = function () {
    return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  };

  ADMIN.cap = function (s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); };

  ADMIN.STATUS = [['menunggu', 'Menunggu'], ['dipanggil', 'Dipanggil'], ['selesai', 'Selesai'], ['dibatalkan', 'Dibatalkan'], ['tidak_hadir', 'Tidak Hadir']];

  // Paginasi bergaya Laravel (Tailwind). urlFor(page) -> alamat halaman tersebut.
  ADMIN.pagination = function (pg, urlFor) {
    if (!pg || pg.last_page <= 1) return '';
    var cur = pg.current_page, last = pg.last_page;
    var chev = {
      l: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" /></svg>',
      r: '<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" /></svg>'
    };
    var off = 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 cursor-default leading-5 rounded-md dark:text-gray-600 dark:bg-gray-800 dark:border-gray-600';
    var on = 'relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 leading-5 rounded-md hover:text-gray-500 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150 dark:bg-gray-800 dark:border-gray-600 dark:text-gray-300 dark:focus:border-blue-700 dark:active:bg-gray-700 dark:active:text-gray-300';
    var mobile = (cur > 1 ? '<a href="' + esc(urlFor(cur - 1)) + '" class="' + on + '">&laquo; Previous</a>' : '<span class="' + off + '">&laquo; Previous</span>') +
      (cur < last ? '<a href="' + esc(urlFor(cur + 1)) + '" class="' + on + ' ml-3">Next &raquo;</a>' : '<span class="' + off + ' ml-3">Next &raquo;</span>');

    var pages = [];
    if (last <= 13) { for (var i = 1; i <= last; i++) pages.push(i); }
    else {
      var set = {}; [1, 2, last - 1, last].forEach(function (p) { set[p] = 1; });
      for (var j = Math.max(1, cur - 3); j <= Math.min(last, cur + 3); j++) set[j] = 1;
      var arr = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
      arr.forEach(function (p, k) { if (k > 0 && p - arr[k - 1] > 1) pages.push('...'); pages.push(p); });
    }
    var cell = 'relative inline-flex items-center px-4 py-2 -ml-px text-sm font-medium border border-gray-300 leading-5 dark:bg-gray-800 dark:border-gray-600 ';
    var items = pages.map(function (p) {
      if (p === '...') return '<span aria-disabled="true"><span class="' + cell + 'text-gray-700 bg-white cursor-default dark:text-gray-400">...</span></span>';
      if (p === cur) return '<span aria-current="page"><span class="' + cell + 'text-gray-500 bg-white cursor-default">' + p + '</span></span>';
      return '<a href="' + esc(urlFor(p)) + '" class="' + cell + 'text-gray-700 bg-white hover:text-gray-500 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150 dark:text-gray-400 dark:hover:text-gray-300 dark:active:bg-gray-700 dark:focus:border-blue-700" aria-label="Go to page ' + p + '">' + p + '</a>';
    }).join('');
    var edge = 'relative inline-flex items-center px-2 py-2 text-sm font-medium bg-white border border-gray-300 leading-5 dark:bg-gray-800 dark:border-gray-600 ';
    var prev = cur > 1
      ? '<a href="' + esc(urlFor(cur - 1)) + '" rel="prev" class="' + edge + 'text-gray-500 rounded-l-md hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150" aria-label="&laquo; Previous">' + chev.l + '</a>'
      : '<span aria-disabled="true" aria-label="&laquo; Previous"><span class="' + edge + 'text-gray-500 cursor-default rounded-l-md" aria-hidden="true">' + chev.l + '</span></span>';
    var next = cur < last
      ? '<a href="' + esc(urlFor(cur + 1)) + '" rel="next" class="' + edge + '-ml-px text-gray-500 rounded-r-md hover:text-gray-400 focus:z-10 focus:outline-none focus:ring ring-gray-300 focus:border-blue-300 active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150" aria-label="Next &raquo;">' + chev.r + '</a>'
      : '<span aria-disabled="true" aria-label="Next &raquo;"><span class="' + edge + '-ml-px text-gray-500 cursor-default rounded-r-md" aria-hidden="true">' + chev.r + '</span></span>';

    return '<nav role="navigation" aria-label="Pagination Navigation" class="flex items-center justify-between">' +
      '<div class="flex justify-between flex-1 sm:hidden">' + mobile + '</div>' +
      '<div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between"><div>' +
      '<p class="text-sm text-gray-700 leading-5 dark:text-gray-400">Showing <span class="font-medium">' + pg.from + '</span> to <span class="font-medium">' + pg.to + '</span> of <span class="font-medium">' + pg.total + '</span> results</p></div>' +
      '<div><span class="relative z-0 inline-flex rtl:flex-row-reverse shadow-sm rounded-md">' + prev + items + next + '</span></div></div></nav>';
  };
})();
