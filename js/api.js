// Klien API untuk backend Google Apps Script.
// POST memakai text/plain agar browser tidak mengirim preflight CORS (Apps Script tidak mendukungnya).
(function () {
  async function parse(res) {
    var json;
    try { json = await res.json(); } catch (e) { throw { status: 0, message: 'Respons server tidak valid.' }; }
    if (!json.ok) throw { status: json.status || 500, message: json.message || 'Terjadi kesalahan.', errors: json.errors || null };
    return json.data;
  }
  window.api = {
    get: async function (action, params) {
      var q = new URLSearchParams(Object.assign({ action: action }, params || {}));
      var res;
      try { res = await fetch(window.API_URL + '?' + q.toString()); }
      catch (e) { throw { status: 0, message: 'Tidak dapat terhubung ke server.' }; }
      return parse(res);
    },
    post: async function (action, body) {
      var res;
      try {
        res = await fetch(window.API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(Object.assign({ action: action }, body || {}))
        });
      } catch (e) { throw { status: 0, message: 'Tidak dapat terhubung ke server.' }; }
      return parse(res);
    }
  };
  // escape teks dari pengguna sebelum disisipkan ke innerHTML
  window.esc = function (s) {
    return String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  };
  // Menjalankan fn berkala, berhenti sementara saat tab tidak terlihat (hemat kuota Apps Script)
  window.poll = function (fn, ms) {
    setInterval(function () { if (!document.hidden) fn(); }, ms);
    document.addEventListener('visibilitychange', function () { if (!document.hidden) fn(); });
  };
  window.BULAN_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
})();
