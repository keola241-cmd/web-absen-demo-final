const SUPABASE_URL = "https://kqptqnoklfuogpecmeuk.supabase.co";       
const SUPABASE_KEY = "sb_publishable__FMX9980QMs4YayETQ2ruQ_nftCfpJP"; 

const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let tabAktifSekarang = "";
let isProcessing = false;
let cooldownList = {}; 
let kelasTargetHapus = ""; 
let namaTargetHapusVar = ""; // Menyimpan nama user yang akan dihapus

// FUNGSI JAM DIGITAL
function updateJamDigital() {
    const elemJam = document.getElementById('jamDigitalHeader');
    if (!elemJam) return;
    
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    
    elemJam.innerText = `${hh}:${mm}:${ss} WIB`;
}
setInterval(updateJamDigital, 1000);

// FUNGSI LAYAR PENUH (FULLSCREEN)
function toggleFullScreen() {
    const doc = window.document;
    const docEl = doc.documentElement;

    const requestFullscreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    const exitFullscreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
        if (requestFullscreen) {
            requestFullscreen.call(docEl);
        }
        
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(function(error) {
                console.log("Fitur kunci orientasi butuh izin browser:", error);
            });
        }
    } else {
        if (exitFullscreen) {
            exitFullscreen.call(doc);
        }
    }
}

function switchPage(pageId, element) {
    document.querySelectorAll('.page-view').forEach(page => page.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));

    const targetPage = document.getElementById(pageId);
    if (targetPage) targetPage.classList.add('active');
    if (element) element.classList.add('active');

    if (pageId === 'page-siswa' || pageId === 'page-guru') {
        muatDaftarTab();
    }
    toggleSidebar();
}

async function muatDaftarTab() {
    try {
        const { data: tabs, error } = await _supabase
            .from('kelas')
            .select('nama_kelas')
            .order('id', { ascending: true });

        if (error) throw error;

        const containerMenu = document.getElementById('kelasMenuBar');
        if (!containerMenu) return;
        
        containerMenu.innerHTML = '';

        if (tabs && tabs.length > 0) {
            let tabSiswaDimuat = false;

            tabs.forEach((item, index) => {
                const namaTab = item.nama_kelas;
                
                const btnTab = document.createElement('div');
                btnTab.className = 'tab-btn';

                if (index === 0 && !tabAktifSekarang) {
                    btnTab.classList.add('active');
                    tabAktifSekarang = namaTab;
                    tabSiswaDimuat = true;
                } else if (namaTab === tabAktifSekarang) {
                    btnTab.classList.add('active');
                    tabSiswaDimuat = true;
                }

                const spanNama = document.createElement('span');
                spanNama.className = 'tab-label';
                spanNama.innerText = namaTab;
                spanNama.onclick = function() { pilihKelas(namaTab, btnTab); };

                const btnHapus = document.createElement('span');
                btnHapus.className = 'btn-delete-tab';
                btnHapus.innerHTML = '&times;'; 
                btnHapus.title = 'Hapus Kelas';
                btnHapus.onclick = function(e) {
                    e.stopPropagation();
                    hapusKelas(namaTab);
                };

                btnTab.appendChild(spanNama);
                btnTab.appendChild(btnHapus);
                containerMenu.appendChild(btnTab);
            });

            const btnAdd = document.createElement('button');
            btnAdd.className = 'tab-btn btn-add-tab';
            btnAdd.innerText = '+ Tambah Kelas';
            btnAdd.onclick = bukaModalTambahKelas;
            containerMenu.appendChild(btnAdd);

            if (tabSiswaDimuat) {
                muatRekapTab(tabAktifSekarang);
            } else {
                tabAktifSekarang = tabs[0].nama_kelas;
                muatRekapTab(tabAktifSekarang);
            }
        } else {
            const btnAdd = document.createElement('button');
            btnAdd.className = 'tab-btn btn-add-tab';
            btnAdd.innerText = '+ Tambah Kelas';
            btnAdd.onclick = bukaModalTambahKelas;
            containerMenu.appendChild(btnAdd);
            
            tabAktifSekarang = "";
            const tbodySiswa = document.getElementById('tabel_rekap_siswa');
            const tbodyGuru = document.getElementById('tabel_rekap_guru');
            if (tbodySiswa) tbodySiswa.innerHTML = '<tr><td colspan="38" style="text-align:center;">Belum ada kelas. Silakan tambah kelas baru.</td></tr>';
            if (tbodyGuru) tbodyGuru.innerHTML = '<tr><td colspan="38" style="text-align:center;">Belum ada kelas. Silakan tambah kelas baru.</td></tr>';
        }
    } catch (err) {
        console.error("Gagal muat tab:", err.message);
    }
}

function pilihKelas(namaKelas, element) {
    document.querySelectorAll('#kelasMenuBar .tab-btn').forEach(btn => {
        if (!btn.classList.contains('btn-add-tab')) btn.classList.remove('active');
    });
    if (element) element.classList.add('active');
    
    tabAktifSekarang = namaKelas;
    muatRekapTab(namaKelas);
}

// HAPUS KELAS
function hapusKelas(namaKelas) {
    kelasTargetHapus = namaKelas;
    const teks = document.getElementById('namaKelasHapusTeks');
    if (teks) teks.innerText = namaKelas;
    document.getElementById('modalHapusKelas').classList.add('active');
}

function tutupModalHapusKelas() {
    const modal = document.getElementById('modalHapusKelas');
    if (modal) modal.classList.remove('active');
    kelasTargetHapus = "";
}

async function prosesHapusKelas() {
    if (!kelasTargetHapus) return;

    try {
        const { error } = await _supabase
            .from('kelas')
            .delete()
            .eq('nama_kelas', kelasTargetHapus);

        if (error) throw error;

        tutupModalHapusKelas();

        if (tabAktifSekarang === kelasTargetHapus) {
            tabAktifSekarang = "";
        }

        muatDaftarTab();
    } catch (err) {
        console.error("Gagal menghapus kelas:", err.message);
        tutupModalHapusKelas();
    }
}

// FITUR MODAL KONFIRMASI HAPUS PROFILE
function konfirmasiHapusNama(nama) {
    namaTargetHapusVar = nama;
    const elemNama = document.getElementById('namaTargetHapus');
    if (elemNama) elemNama.innerText = nama;
    
    const modal = document.getElementById('modalHapusNama');
    if (modal) modal.classList.add('active');
}

function tutupModalHapusNama() {
    const modal = document.getElementById('modalHapusNama');
    if (modal) modal.classList.remove('active');
    namaTargetHapusVar = "";
}

async function eksekusiHapusNama() {
    if (!namaTargetHapusVar) return;

    try {
        const { error } = await _supabase
            .from('absensi')
            .delete()
            .eq('nama', namaTargetHapusVar);

        if (error) throw error;

        tutupModalHapusNama();
        muatRekapTab(tabAktifSekarang);
    } catch (err) {
        console.error("Gagal menghapus data:", err.message);
        tutupModalHapusNama();
    }
}

// MEMUAT REKAP DATA (GURU & SISWA)
async function muatRekapTab(namaTab) {
    const elemTabAktif = document.getElementById('stat-tab-aktif');
    if (elemTabAktif) elemTabAktif.innerText = namaTab || 'Semua Data';

    const tbodySiswa = document.getElementById('tabel_rekap_siswa');
    const tbodyGuru = document.getElementById('tabel_rekap_guru');
    
    if (tbodySiswa) tbodySiswa.innerHTML = '<tr><td colspan="38" style="text-align:center;">Memuat data...</td></tr>';
    if (tbodyGuru) tbodyGuru.innerHTML = '<tr><td colspan="38" style="text-align:center;">Memuat data...</td></tr>';

    const pageGuru = document.getElementById('page-guru');
    const isGuruPage = (pageGuru && pageGuru.classList.contains('active')) || 
                      (namaTab && String(namaTab).toLowerCase().includes('guru'));
    
    const filterBulanElem = document.getElementById(isGuruPage ? 'filterBulanGuru' : 'filterBulanSiswa');
    const filterTahunElem = document.getElementById(isGuruPage ? 'filterTahunGuru' : 'filterTahunSiswa');

    const bulanSel = filterBulanElem ? parseInt(filterBulanElem.value, 10) : (new Date().getMonth() + 1);
    const tahunSel = filterTahunElem ? parseInt(filterTahunElem.value, 10) : new Date().getFullYear();

    try {
        let query = _supabase.from('absensi').select('*');

        if (isGuruPage) {
            query = query.or('role.ilike.%guru%,role.ilike.%karyawan%');
        } else if (namaTab) {
            query = query.eq('kelas', namaTab);
        }

        const { data, error } = await query;

        if (error) throw error;

        if (tbodySiswa) tbodySiswa.innerHTML = '';
        if (tbodyGuru) tbodyGuru.innerHTML = '';

        if (!data || data.length === 0) {
            const pesanKosong = '<tr><td colspan="38" style="text-align:center;">Belum ada data untuk ditampilkan.</td></tr>';
            if (isGuruPage && tbodyGuru) tbodyGuru.innerHTML = pesanKosong;
            if (!isGuruPage && tbodySiswa) tbodySiswa.innerHTML = pesanKosong;
            const elemTotal = document.getElementById('stat-total-siswa');
            if (elemTotal) elemTotal.innerText = 0;
            return;
        }

        const rekapMap = {};
        data.forEach(row => {
            if (!rekapMap[row.nama]) {
                rekapMap[row.nama] = { 
                    nama: row.nama, 
                    gender: row.gender || '-', 
                    kelas: row.kelas || '-',
                    tepat: 0, 
                    telat: 0,
                    harian: {} 
                };
            }

            if (row.tanggal) {
                const parts = row.tanggal.split('-');
                const thn = parseInt(parts[0], 10);
                const bln = parseInt(parts[1], 10);
                const tgl = parseInt(parts[2], 10);

                if (bln === bulanSel && thn === tahunSel) {
                    if (row.status_kehadiran === 'tepat' || row.status_kehadiran === 'pegawai') {
                        rekapMap[row.nama].harian[tgl] = 'H';
                        rekapMap[row.nama].tepat++;
                    } else if (row.status_kehadiran === 'telat') {
                        rekapMap[row.nama].harian[tgl] = 'T';
                        rekapMap[row.nama].telat++;
                    }
                }
            }
        });

        const rekapArray = Object.values(rekapMap);
        const elemTotal = document.getElementById('stat-total-siswa');
        if (elemTotal) elemTotal.innerText = rekapArray.length;

        rekapArray.forEach((item, index) => {
            const tr = document.createElement('tr');
            const totalHadir = item.tepat + item.telat;

            let kolomTanggalHTML = '';
            for (let i = 1; i <= 31; i++) {
                const st = item.harian[i];
                if (st === 'H') {
                    kolomTanggalHTML += `<td style="background-color: #064e3b; color: #34d399; font-weight: bold; text-align: center;">H</td>`;
                } else if (st === 'T') {
                    kolomTanggalHTML += `<td style="background-color: #78350f; color: #fbbf24; font-weight: bold; text-align: center;">T</td>`;
                } else {
                    kolomTanggalHTML += `<td style="text-align: center; color: var(--text-sub);">-</td>`;
                }
            }

            const urlDetail = isGuruPage ? '/detail_guru' : '/detail_siswa';
            const valKelas = item.kelas || namaTab || '-';

            tr.innerHTML = `
                <td>${index + 1}</td>
                <td>
                    <div style="display: flex; align-items: center; justify-content: space-between; gap: 8px;">
                        <a href="${urlDetail}?nama=${encodeURIComponent(item.nama)}&kelas=${encodeURIComponent(valKelas)}&jk=${encodeURIComponent(item.gender)}&tepat=${item.tepat}&telat=${item.telat}" 
                           style="color: var(--text-title); text-decoration: underline; font-weight: 600;">
                            ${item.nama}
                        </a>
                        <button onclick="konfirmasiHapusNama('${item.nama.replace(/'/g, "\\'")}')" 
                                title="Hapus ${item.nama}" 
                                style="background: none; border: none; color: #ef4444; font-size: 16px; font-weight: bold; cursor: pointer; padding: 0 4px; line-height: 1;">
                            &times;
                        </button>
                    </div>
                </td>
                <td>${item.gender}</td>
                ${kolomTanggalHTML}
                <td><span class="badge badge-success">${item.tepat}</span></td>
                <td><span class="badge badge-warning">${item.telat}</span></td>
                <td><strong>${totalHadir}</strong></td>
            `;

            if (isGuruPage && tbodyGuru) {
                tbodyGuru.appendChild(tr);
            } else if (tbodySiswa) {
                tbodySiswa.appendChild(tr);
            }
        });

    } catch (err) {
        const pesanErr = `<tr><td colspan="38" style="text-align:center; color:red;">Gagal: ${err.message}</td></tr>`;
        if (tbodySiswa) tbodySiswa.innerHTML = pesanErr;
        if (tbodyGuru) tbodyGuru.innerHTML = pesanErr;
    }
}

function bukaModalTambahKelas() { document.getElementById('modalTambahKelas').classList.add('active'); }
function tutupModalTambahKelas() { 
    document.getElementById('modalTambahKelas').classList.remove('active'); 
    document.getElementById('namaKelasBaru').value = '';
}

async function prosesTambahKelas() {
    const namaKelas = document.getElementById('namaKelasBaru').value.trim();
    if (!namaKelas) return;

    try {
        const { error } = await _supabase.from('kelas').insert([{ nama_kelas: namaKelas }]);
        if (error) throw error;

        tutupModalTambahKelas();
        tabAktifSekarang = namaKelas;
        muatDaftarTab();
    } catch (err) {
        console.error("Gagal menambahkan kelas:", err.message);
    }
}

async function onScanSuccess(decodedText) {
    if (isProcessing) return;
    isProcessing = true;
    playBeep();

    try { scanner.pause(true); } catch (e) {}

    const useVoice = document.getElementById('voiceToggle') ? document.getElementById('voiceToggle').checked : true;
    const dataSplit = decodedText.split('|').map(s => s.trim());

    if (dataSplit.length < 4) {
        tampilPesan("⚠️ Format QR Code Salah!", "#ef4444", useVoice);
        return resetScanner();
    }

    const [id_user, nama, kelas, role] = dataSplit;
    const gender = dataSplit[4] || '-';

    const skrg = Math.floor(Date.now() / 1000);
    if (cooldownList[id_user] && (skrg - cooldownList[id_user]) < 60) {
        const sisa = 60 - (skrg - cooldownList[id_user]);
        tampilPesan(`⚠️ ${nama} baru saja scan! Tunggu ${sisa} detik.`, "#f59e0b", useVoice);
        return resetScanner();
    }

    const d = new Date();
    const jam = String(d.getHours()).padStart(2, '0');
    const menit = String(d.getMinutes()).padStart(2, '0');
    const waktuTeks = `${jam}:${menit}`;
    const tglTeks = d.toISOString().split('T')[0];

    // Penentuan status kehadiran berdasarkan jam batas 07:00
    let statusKehadiran = "tepat";
    const jamBatas = "07:00"; 

    // Jika waktu scan lewat dari 07:00 (mulai 07:01), otomatis telat
    if (waktuTeks > jamBatas) {
        statusKehadiran = "telat";
    }

    try {
        const { error } = await _supabase.from('absensi').insert([{
            user_id: id_user,
            nama: nama,
            kelas: kelas,
            role: role,
            gender: gender,
            tanggal: tglTeks,
            waktu: waktuTeks,
            status_kehadiran: statusKehadiran
        }]);

        if (error) throw error;

        cooldownList[id_user] = skrg;
        const msg = statusKehadiran === "telat" ? `⚠️ ${nama} Terlambat (${waktuTeks})!` : `✅ Berhasil Absen, Selamat Datang ${nama}`;
        const warna = statusKehadiran === "telat" ? "#f59e0b" : "#10b981";

        tampilPesan(msg, warna, useVoice);
        tambahItemKeDaftar({ nama, kelas, role, gender, waktu: waktuTeks });

    } catch (err) {
        tampilPesan("⚠️ Gagal Simpan Data: " + err.message, "#ef4444", useVoice);
    }

    resetScanner();
}

function tampilPesan(msg, color, useVoice) {
    const textPesan = document.getElementById('pesan_hasil');
    if (textPesan) {
        textPesan.innerText = msg;
        textPesan.style.color = color;
    }
    if (useVoice) bicara(msg);
}

function resetScanner() {
    setTimeout(() => {
        isProcessing = false;
        try { scanner.resume(); } catch (e) {}
    }, 3000);
}

async function muatDaftarHadir() {
    const tglTeks = new Date().toISOString().split('T')[0];
    try {
        const { data, error } = await _supabase
            .from('absensi')
            .select('*')
            .eq('tanggal', tglTeks)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const listAbsen = document.getElementById('daftar_absen');
        if (listAbsen) {
            listAbsen.innerHTML = '';
            if (data) {
                data.forEach(siswa => tambahItemKeDaftar(siswa));
            }
        }
    } catch (err) {
        console.error("Gagal muat riwayat:", err.message);
    }
}

function tambahItemKeDaftar(siswa) {
    const listAbsen = document.getElementById('daftar_absen');
    if (!listAbsen) return;
    const item = document.createElement('li');
    const genderInfo = siswa.gender ? ` - ${siswa.gender}` : '';
    item.innerText = `[${siswa.waktu || ''}] ${siswa.nama || ''} - Kelas ${siswa.kelas || ''} (${siswa.role || ''}${genderInfo})`;
    listAbsen.prepend(item);
}

function filterTabelSiswa() {
    const input = document.getElementById('searchSiswa').value.toLowerCase();
    document.querySelectorAll('#tabel_rekap_siswa tr').forEach(row => {
        const nama = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
        row.style.display = nama.includes(input) ? '' : 'none';
    });
}

function filterTabelGuru() {
    const input = document.getElementById('searchGuru').value.toLowerCase();
    document.querySelectorAll('#tabel_rekap_guru tr').forEach(row => {
        const nama = row.cells[1] ? row.cells[1].textContent.toLowerCase() : '';
        row.style.display = nama.includes(input) ? '' : 'none';
    });
}

function exportKeCSV(tableId, filename) {
    const table = document.getElementById(tableId);
    if (!table) return;
    let csv = [];
    table.querySelectorAll('tr').forEach(row => {
        let rowData = [];
        row.querySelectorAll('th, td').forEach(cell => {
            rowData.push(`"${cell.innerText.replace(/(\r\n|\n|\r)/gm, " ").trim()}"`);
        });
        csv.push(rowData.join(','));
    });
    
    const csvContent = "\uFEFF" + csv.join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `${filename}_${tabAktifSekarang || 'rekap'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function toggleSidebar() {
    const sb = document.getElementById('sidebar');
    const ov = document.getElementById('overlay');
    if (sb) sb.classList.toggle('active');
    if (ov) ov.classList.toggle('active');
}

function switchTheme(checkbox) {
    const theme = checkbox.checked ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
}

function switchVoice(checkbox) { localStorage.setItem('useVoice', checkbox.checked); }
function switchVolume(val) {
    localStorage.setItem('appVolume', val);
    if (document.getElementById('volumeLabel')) document.getElementById('volumeLabel').innerText = Math.round(val * 100) + '%';
}

function playBeep() {
    try {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const vol = parseFloat(localStorage.getItem('appVolume') ?? '1.0');
        if (vol <= 0) return;
        osc.type = 'sine';
        osc.frequency.setValueAtTime(850, ctx.currentTime);
        gain.gain.setValueAtTime(vol * 0.8, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.18);
    } catch (e) {}
}

function bicara(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let suara = new SpeechSynthesisUtterance(text);
        suara.lang = 'id-ID';
        suara.volume = parseFloat(localStorage.getItem('appVolume') ?? '1.0');
        window.speechSynthesis.speak(suara);
    }
}

let scanner = null;
document.addEventListener('DOMContentLoaded', () => {
    updateJamDigital(); // Jalankan langsung saat halaman siap

    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (document.getElementById('themeToggle')) document.getElementById('themeToggle').checked = (savedTheme === 'light');

    const savedVoice = localStorage.getItem('useVoice');
    if (savedVoice !== null && document.getElementById('voiceToggle')) {
        document.getElementById('voiceToggle').checked = (savedVoice === 'true');
    }

    const savedVolume = localStorage.getItem('appVolume') ?? '1.0';
    if (document.getElementById('volumeRange')) {
        document.getElementById('volumeRange').value = savedVolume;
        switchVolume(savedVolume);
    }

    const dSekarang = new Date();
    const thnSekarang = dSekarang.getFullYear();
    const blnSekarang = dSekarang.getMonth() + 1;

    ['filterTahunSiswa', 'filterTahunGuru'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel) {
            sel.innerHTML = '';
            for (let y = thnSekarang - 2; y <= thnSekarang + 2; y++) {
                const opt = document.createElement('option');
                opt.value = y;
                opt.innerText = y;
                if (y === thnSekarang) opt.selected = true;
                sel.appendChild(opt);
            }
        }
    });

    if (document.getElementById('filterBulanSiswa')) document.getElementById('filterBulanSiswa').value = blnSekarang;
    if (document.getElementById('filterBulanGuru')) document.getElementById('filterBulanGuru').value = blnSekarang;

    muatDaftarHadir();
    muatDaftarTab();

    if (document.getElementById('reader')) {
        scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: 250 });
        scanner.render(onScanSuccess);
    }
});
