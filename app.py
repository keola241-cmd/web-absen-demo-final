import os
from flask import Flask, render_template

app = Flask(__name__)

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

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/detail_siswa')
def detail_siswa():
    return render_template('detail_siswa.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)