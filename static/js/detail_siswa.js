document.addEventListener('DOMContentLoaded', () => {
    // 1. Ambil data dari Parameter URL yang dikirim dari tabel rekap
    const urlParams = new URLSearchParams(window.location.search);
    const nama = urlParams.get('nama') || 'Siswa Tanpa Nama';
    const kelas = urlParams.get('kelas') || '-';
    const jk = urlParams.get('jk') || '-';
    const tepat = parseInt(urlParams.get('tepat')) || 0;
    const telat = parseInt(urlParams.get('telat')) || 0;
    const izin = parseInt(urlParams.get('izin')) || 0;

    // 2. Tampilkan Nama, Kelas & Jenis Kelamin
    if (document.getElementById('detailNamaSiswa')) document.getElementById('detailNamaSiswa').innerText = nama;
    if (document.getElementById('detailKelasSiswa')) document.getElementById('detailKelasSiswa').innerText = `Kelas ${kelas}`;
    if (document.getElementById('detailGenderSiswa')) document.getElementById('detailGenderSiswa').innerText = `👤 Jenis Kelamin: ${jk}`;

    // 3. Kalkulasi Kehadiran (Standar 22 Hari Kerja Efektif per Bulan)
    const TOTAL_HARI_EFEKTIF = 22; 
    const totalMasuk = tepat + telat;
    const tidakMasuk = Math.max(0, TOTAL_HARI_EFEKTIF - (totalMasuk + izin));
    const persentase = Math.round((totalMasuk / TOTAL_HARI_EFEKTIF) * 100);

    // 4. Render Kartu UI & Progress Bar
    if (document.getElementById('valTepat')) document.getElementById('valTepat').innerText = `${tepat} Hari`;
    if (document.getElementById('valTelat')) document.getElementById('valTelat').innerText = `${telat} Hari`;
    if (document.getElementById('valIzin')) document.getElementById('valIzin').innerText = `${izin} Hari`;
    if (document.getElementById('valAlpha')) document.getElementById('valAlpha').innerText = `${tidakMasuk} Hari`;

    if (document.getElementById('textPersentase')) document.getElementById('textPersentase').innerText = `${persentase}%`;
    if (document.getElementById('barFill')) document.getElementById('barFill').style.width = `${Math.min(100, persentase)}%`;

    // 5. Render Grafik Donut (Chart.js) dengan label "Tidak Masuk"
    const canvasChart = document.getElementById('grafikKehadiran');
    if (canvasChart && typeof Chart !== 'undefined') {
        new Chart(canvasChart, {
            type: 'doughnut',
            data: {
                labels: ['Tepat Waktu', 'Terlambat', 'Izin/Sakit', 'Tidak Masuk'],
                datasets: [{
                    data: [tepat, telat, izin, tidakMasuk],
                    backgroundColor: ['#10b981', '#f59e0b', '#3b82f6', '#ef4444'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: '#cbd5e1', font: { family: 'Poppins' } }
                    }
                }
            }
        });
    }

    // 6. Load Foto Profil Tersimpan dari LocalStorage
    const savedPhoto = localStorage.getItem(`foto_${nama}_${kelas}`);
    if (savedPhoto && document.getElementById('imgFotoSiswa')) {
        document.getElementById('imgFotoSiswa').src = savedPhoto;
    }
});

// === FUNGSI PREVIEW & SIMPAN FOTO PROFIL ===
function pratinjauFoto(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const resultData = e.target.result;
            document.getElementById('imgFotoSiswa').src = resultData;

            const urlParams = new URLSearchParams(window.location.search);
            const nama = urlParams.get('nama');
            const kelas = urlParams.get('kelas');
            if (nama && kelas) {
                localStorage.setItem(`foto_${nama}_${kelas}`, resultData);
            }
        };
        reader.readAsDataURL(file);
    }
}