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

# --- API ENDPOINTS UNTUK AMBIL/HAPUS DATA SUPABASE ---
@app.route('/api/kelas', methods=['GET', 'POST'])
def handle_kelas():
    if not supabase:
        return jsonify([])

    if request.method == 'GET':
        response = supabase.table('kelas').select('*').order('id', desc=False).execute()
        return jsonify(response.data)

    if request.method == 'POST':
        payload = request.json or {}
        response = supabase.table('kelas').insert(payload).execute()
        return jsonify(response.data), 201

@app.route('/api/kelas/<path:nama_kelas>', methods=['DELETE'])
def delete_kelas(nama_kelas):
    if not supabase:
        return jsonify({'error': 'Database tidak terhubung'}), 500

    try:
        response = supabase.table('kelas').delete().eq('nama_kelas', nama_kelas).execute()
        return jsonify({'message': f'Kelas {nama_kelas} berhasil dihapus', 'data': response.data}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 400

@app.route('/api/absensi', methods=['GET', 'POST'])
def handle_absensi():
    if not supabase:
        return jsonify([])

    if request.method == 'GET':
        response = supabase.table('absensi').select('*').execute()
        return jsonify(response.data)

    if request.method == 'POST':
        payload = request.json or {}
        response = supabase.table('absensi').insert(payload).execute()
        return jsonify(response.data), 201

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
