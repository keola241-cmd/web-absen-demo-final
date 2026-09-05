import os
from flask import Flask, render_template, jsonify
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

# --- API ENDPOINTS UNTUK AMBIL DATA SUPABASE ---
@app.route('/api/kelas')
def get_kelas():
    if not supabase:
        return jsonify([])
    response = supabase.table('kelas').select('*').execute()
    return jsonify(response.data)

@app.route('/api/absensi')
def get_absensi():
    if not supabase:
        return jsonify([])
    response = supabase.table('absensi').select('*').execute()
    return jsonify(response.data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
