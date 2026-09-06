import os
from flask import Flask, render_template, jsonify, request
from supabase import create_client, Client

app = Flask(__name__)

# --- KONFIGURASI SUPABASE ---
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

# Inisialisasi client Supabase jika Environment Variable tersedia
supabase: Client = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# --- PEMERIKSA STATUS VERCEL / LOKAL ---
@app.before_request
def check_status():
    if os.environ.get("WEB_ACTIVE", "TRUE").upper() != "TRUE":
        return """
        <div style="text-align:center; padding:50px; font-family:sans-serif;">
            <h1 style="color:red;">Akses Ditangguhkan ⚠️</h1>
            <p>Masa aktif aplikasi telah berakhir / menunggu konfirmasi pembayaran.</p>
            <p>Silakan hubungi Admin/Developer untuk mengaktifkan kembali.</p>
        </div>
        """, 403

# --- ROUTE HALAMAN ---
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/detail_siswa')
def detail_siswa():
    return render_template('detail_siswa.html')

@app.route('/detail_guru')
def detail_guru():
    return render_template('detail_guru.html')

# --- API ENDPOINTS UNTUK AMBIL & SIMPAN DATA SUPABASE ---
@app.route('/api/kelas')
def get_kelas():
    if not supabase:
        return jsonify([])
    
    # 1. Coba ambil dari tabel 'kelas'
    response = supabase.table('kelas').select('*').execute()
    data = response.data

    # 2. OTOMATISASI FALLBACK: Jika tabel 'kelas' masih kosong, 
    # langsung tarik nama kelas unik dari riwayat tabel 'absensi'
    if not data:
        absensi_resp = supabase.table('absensi').select('kelas').execute()
        if absensi_resp.data:
            unique_kelas = set(item['kelas'] for item in absensi_resp.data if item.get('kelas'))
            data = [{"nama_kelas": k} for k in sorted(unique_kelas)]

    return jsonify(data)

@app.route('/api/absensi', methods=['GET', 'POST'])
def handle_absensi():
    if not supabase:
        return jsonify([])

    # Ambil semua data absensi (GET)
    if request.method == 'GET':
        response = supabase.table('absensi').select('*').execute()
        return jsonify(response.data)

    # Simpan absensi baru (POST) & OTOMATIS daftarkan kelas baru jika belum ada
    if request.method == 'POST':
        payload = request.json or {}
        nama_kelas = payload.get('kelas')

        if nama_kelas:
            # Cek apakah kelas sudah terdaftar di tabel kelas
            cek_kelas = supabase.table('kelas').select('*').eq('nama_kelas', nama_kelas).execute()
            if not cek_kelas.data:
                # Otomatis daftarkan kelas baru
                supabase.table('kelas').insert({'nama_kelas': nama_kelas}).execute()

        # Simpan data absensi
        response = supabase.table('absensi').insert(payload).execute()
        return jsonify(response.data), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
