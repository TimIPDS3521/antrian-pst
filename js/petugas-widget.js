// Widget foto petugas + modal (setara partials/petugas-widget.blade.php)
window.renderPetugasWidget = function (container, petugas, size) {
  size = size || 'lg';
  var dimensi = size === 'sm' ? 'w-9 h-9' : 'w-12 h-12 md:w-14 md:h-14';
  var border = size === 'sm' ? 'border-2 border-white' : 'border-2 border-[#7a2418]';
  var huruf = size === 'sm' ? 'text-sm' : 'text-lg';
  if (!petugas) { container.innerHTML = ''; return; }
  var inisial = esc((petugas.nama || '?').charAt(0).toUpperCase());
  var foto = petugas.foto ? esc(petugas.foto) : '';

  function avatar(fallbackCls, imgCls) {
    return foto
      ? '<img src="' + foto + '" alt="' + esc(petugas.nama) + '" class="w-full h-full object-cover" referrerpolicy="no-referrer"' +
        ' onerror="this.style.display=\'none\'; this.nextElementSibling.classList.remove(\'hidden\');">' +
        '<div class="hidden absolute inset-0 bg-[#7a2418]/10 text-[#7a2418] font-semibold ' + fallbackCls + ' items-center justify-center">' + inisial + '</div>'
      : '<div class="w-full h-full bg-[#7a2418]/10 flex items-center justify-center text-[#7a2418] font-semibold ' + fallbackCls + '">' + inisial + '</div>';
  }

  container.innerHTML =
    '<button onclick="document.getElementById(\'modalPetugas\').classList.remove(\'hidden\')"' +
    ' class="' + dimensi + ' rounded-full overflow-hidden ' + border + ' shadow-sm bg-white flex-shrink-0 relative">' +
    avatar(huruf) + '</button>' +
    '<div id="modalPetugas" onclick="if(event.target===this) this.classList.add(\'hidden\')"' +
    ' class="hidden fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">' +
    '<div class="bg-white rounded-2xl p-6 max-w-xs w-full text-center relative shadow-xl">' +
    '<button onclick="document.getElementById(\'modalPetugas\').classList.add(\'hidden\')"' +
    ' class="absolute top-3 right-3 text-slate-400 hover:text-slate-600 text-lg leading-none">&times;</button>' +
    '<div class="w-24 h-24 rounded-full overflow-hidden mx-auto mb-4 border-4 border-[#7a2418]/10 relative">' +
    avatar('text-3xl').replace(/font-semibold/g, 'font-bold') + '</div>' +
    '<p class="text-xs text-slate-400 uppercase tracking-wide mb-1">Petugas Bertugas Hari Ini</p>' +
    '<p class="font-semibold text-slate-800">' + esc(petugas.nama) + '</p>' +
    '<p class="text-sm text-slate-500">NIP: ' + esc(petugas.nip) + '</p>' +
    '</div></div>';
};
