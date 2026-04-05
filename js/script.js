//array dan object
const KREDENSIAL = { namapengguna: 'admin', katasandi: 'wikrama123' };
const HARGA_PARKIR = { motor: 3000, mobil: 5000, bus: 10000 };
const BATAS_KAPASITAS = 100;
const JAM_BUKA  = { jam: 4,  menit: 1 };
const JAM_TUTUP = { jam: 22, menit: 1 };

let daftarKendaraan = [];
let totalPenghasilan = 0;
let intervalWaktu = null;


//object Math
function buatId() {
  return Math.floor(Math.random() * 1e9).toString(36).toUpperCase();
}

function formatRupiah(angka) {
  return 'Rp ' + angka.toLocaleString('id-ID');
}

function hitungDurasi(jamMasuk, jamKeluar) {
  const [jM, mM] = jamMasuk.split(':').map(Number);
  const [jK, mK] = jamKeluar.split(':').map(Number);
  let menitMasuk  = jM * 60 + mM;
  let menitKeluar = jK * 60 + mK;
  if (menitKeluar < menitMasuk) menitKeluar += 24 * 60;
  const durasi = Math.ceil((menitKeluar - menitMasuk) / 60);
  return Math.max(1, durasi);
}

function hitungBiaya(durasi, jenisKendaraan) {
  return durasi * HARGA_PARKIR[jenisKendaraan];
}

function cekJamOperasional(jamStr) {
  const [jam, menit] = jamStr.split(':').map(Number);
  const totalMenit = jam * 60 + menit;
  const waktuBuka  = JAM_BUKA.jam * 60 + JAM_BUKA.menit;
  const waktuTutup = JAM_TUTUP.jam * 60 + JAM_TUTUP.menit;
  return totalMenit >= waktuBuka && totalMenit < waktuTutup;
}

//object date ambil jam skrng
function ambilJamSekarang() {
  const sekarang = new Date();
  const jam   = String(sekarang.getHours()).padStart(2, '0');
  const menit = String(sekarang.getMinutes()).padStart(2, '0');
  return `${jam}:${menit}`;
}

function tampilkanNotifikasi(pesan, tipe) {
  const elNotif = document.getElementById('notifikasi');
  if (!elNotif) return;
  elNotif.textContent = pesan;
  elNotif.className = 'notifikasi ' + tipe;
  elNotif.classList.remove('tersembunyi');
  setTimeout(() => elNotif.classList.add('tersembunyi'), 3500);
}

//Landing page

function inisialisasiLanding() {
  const tombolHamburger = document.getElementById('tombolHamburger');
  if (!tombolHamburger) return;

  //event dom tmbl
  tombolHamburger.addEventListener('click', function () {
    const navTautan = document.querySelector('.nav-tautan');
    navTautan.classList.toggle('aktif');
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (tautan) {
    tautan.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

//login

function inisialisasiLogin() {
  const formLogin = document.getElementById('formLogin');
  if (!formLogin) return;

  if (sessionStorage.getItem('sudahLogin') === 'ya') {
    window.location.href = 'admin.html';
    return;
  }

  //event dom login
  formLogin.addEventListener('submit', function (e) {
    e.preventDefault();
    const namapengguna = document.getElementById('namapengguna').value.trim();
    const katasandi    = document.getElementById('katasandi').value;
    const elPesan      = document.getElementById('pesanError');

    if (namapengguna === KREDENSIAL.namapengguna && katasandi === KREDENSIAL.katasandi) {
      sessionStorage.setItem('sudahLogin', 'ya');
      window.location.href = 'admin.html';
    } else {
      elPesan.textContent = 'Nama pengguna atau pw salah';
    }
  });

  document.getElementById('namapengguna').addEventListener('input', function () {
    document.getElementById('pesanError').textContent = '';
  });
}

//admin

function cekSesiAdmin() {
  if (sessionStorage.getItem('sudahLogin') !== 'ya') {
    window.location.href = 'login.html';
  }
}

//object date update waktu
function updateWaktu() {
  const sekarang = new Date();
  const jam    = String(sekarang.getHours()).padStart(2, '0');
  const menit  = String(sekarang.getMinutes()).padStart(2, '0');
  const detik  = String(sekarang.getSeconds()).padStart(2, '0');
  const hari   = String(sekarang.getDate()).padStart(2, '0');
  const bulan  = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tahun  = sekarang.getFullYear();

  const elWaktu = document.getElementById('waktuHidup');
  if (elWaktu) elWaktu.textContent = `${jam}:${menit}:${detik}`;

  const elTanggal = document.getElementById('tanggalHidup');
  if (elTanggal) elTanggal.textContent = `${hari}/${bulan}/${tahun}`;

  if (jam === '22' && menit === '01' && detik === '00') {
    resetOtomatisParkir();
  }

  const statusEl = document.getElementById('statusParkir');
  if (statusEl) {
    if (cekJamOperasional(`${jam}:${menit}`)) {
      statusEl.textContent = 'Buka';
      statusEl.className   = 'badge-status badge-hijau';
    } else {
      statusEl.textContent = 'Tutup';
      statusEl.className   = 'badge-status badge-merah';
    }
  }
}

function resetOtomatisParkir() {
  daftarKendaraan  = [];
  totalPenghasilan = 0;
  renderTabel();
  updateStatistik();
  tampilkanNotifikasi('Parkir bakal reset otomatis di jam 22.01', 'info');
}

//function tambah kendaraan
function tambahKendaraan(plat, jenis, jamMasuk) {
  //array object crud
  const objKendaraan = {
    id:             buatId(),
    platNomor:      plat.toUpperCase(),
    jenisKendaraan: jenis,
    jamMasuk:       jamMasuk,
    jamKeluar:      null,
    tanggalKeluar:  null,
    durasi:         null,
    totalBiaya:     null,
    status:         'parkir',
    tanggal:        new Date().toLocaleDateString('id-ID')
  };
  daftarKendaraan.push(objKendaraan);
  return objKendaraan;
}

//function keluar parkir
function keluarParkir(id) {
  const indeks = daftarKendaraan.findIndex(function (k) { return k.id === id; });
  if (indeks === -1) return;

  const kendaraan = daftarKendaraan[indeks];
  const jamKeluar = ambilJamSekarang();

  //object date tangggal keluar
  const sekarang  = new Date();
  const hari      = String(sekarang.getDate()).padStart(2, '0');
  const bulan     = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tahun     = sekarang.getFullYear();
  const tanggalKeluar = `${hari}/${bulan}/${tahun}`;

  const durasi = hitungDurasi(kendaraan.jamMasuk, jamKeluar);
  const biaya  = hitungBiaya(durasi, kendaraan.jenisKendaraan);

  daftarKendaraan[indeks].jamKeluar     = jamKeluar;
  daftarKendaraan[indeks].tanggalKeluar = tanggalKeluar;
  daftarKendaraan[indeks].durasi        = durasi;
  daftarKendaraan[indeks].totalBiaya    = biaya;
  daftarKendaraan[indeks].status        = 'keluar';

  totalPenghasilan += biaya;

  tampilkanNotifikasi(
    kendaraan.platNomor + ' keluar - Durasi: ' + durasi + ' jam, Biaya: ' + formatRupiah(biaya),
    'sukses'
  );
  renderTabel();
  updateStatistik();
}

//function hapus
function hapusKendaraan(id) {
  const kendaraan = daftarKendaraan.find(function (k) { return k.id === id; });
  if (!kendaraan) return;

  // Kotak Dialog
  const konfirmasi = confirm('Hapus data kendaraan dengan plat ' + kendaraan.platNomor + '?');
  if (!konfirmasi) return;

  if (kendaraan.status === 'keluar' && kendaraan.totalBiaya) {
    totalPenghasilan -= kendaraan.totalBiaya;
    if (totalPenghasilan < 0) totalPenghasilan = 0;
  }

  daftarKendaraan = daftarKendaraan.filter(function (k) { return k.id !== id; });
  tampilkanNotifikasi('kendaraan sudah dihapus', 'sukses');
  renderTabel();
  updateStatistik();
}

//function hapus semua
function hapusSemua() {
  if (daftarKendaraan.length === 0) {
    tampilkanNotifikasi('ga ada kendaraan buat dihapus', 'gagal');
    return;
  }

  //kotak dialog/confirm
  const konfirmasi = confirm('Hapus semua data kendaraan?');
  if (!konfirmasi) return;

  daftarKendaraan  = [];
  totalPenghasilan = 0;
  tampilkanNotifikasi('Semua data kendaraan sudah dihapus', 'sukses');
  renderTabel();
  updateStatistik();
}

function bukaEditKendaraan(id) {
  const kendaraan = daftarKendaraan.find(function (k) { return k.id === id; });
  if (!kendaraan || kendaraan.status === 'keluar') return;

  document.getElementById('editId').value       = id;
  document.getElementById('editPlat').value     = kendaraan.platNomor;
  document.getElementById('editJenis').value    = kendaraan.jenisKendaraan;
  document.getElementById('editJamMasuk').value = kendaraan.jamMasuk;

  document.getElementById('modalEdit').classList.remove('tersembunyi');
  document.getElementById('lapisanModal').classList.remove('tersembunyi');
}

function tutupModalEdit() {
  document.getElementById('modalEdit').classList.add('tersembunyi');
  document.getElementById('lapisanModal').classList.add('tersembunyi');
}

//function edit
function simpanEditKendaraan(id, platBaru, jenisBaru, jamMasukBaru) {
  const indeks = daftarKendaraan.findIndex(function (k) { return k.id === id; });
  if (indeks === -1) return;

  //object string primary key cek
  const platUpper = platBaru.toUpperCase();
  const adaDuplikat = daftarKendaraan.some(function (k, i) {
    return i !== indeks && k.platNomor === platUpper && k.status === 'parkir';
  });

  if (adaDuplikat) {
    tampilkanNotifikasi('Plat nomor sudah ada dan masih parkir', 'gagal');
    return;
  }

  daftarKendaraan[indeks].platNomor      = platUpper;
  daftarKendaraan[indeks].jenisKendaraan = jenisBaru;
  daftarKendaraan[indeks].jamMasuk       = jamMasukBaru;

  tutupModalEdit();
  tampilkanNotifikasi('Data kendaraan berhasil di perbarui', 'sukses');
  renderTabel();
}

//object string cari kendaraan
function cariKendaraan(kataCari) {
  const kataUpper = kataCari.toUpperCase();
  return daftarKendaraan.filter(function (k) {
    return k.platNomor.includes(kataUpper);
  });
}

function updateStatistik() {
  const sedangParkir = daftarKendaraan.filter(function (k) { return k.status === 'parkir'; }).length;
  const sudahKeluar  = daftarKendaraan.filter(function (k) { return k.status === 'keluar'; }).length;

  document.getElementById('jumlahParkir').textContent    = sedangParkir;
  document.getElementById('jumlahKeluar').textContent    = sudahKeluar;
  document.getElementById('totalPenghasilan').textContent = formatRupiah(totalPenghasilan);
  document.getElementById('infoKapasitas').textContent   = sedangParkir + ' / ' + BATAS_KAPASITAS;
}

function renderTabel(data) {
  const isiTabel = document.getElementById('isiTabel');
  if (!isiTabel) return;

  const dataRender = data || daftarKendaraan;

  if (dataRender.length === 0) {
    isiTabel.innerHTML = '<tr class="baris-kosong"><td colspan="10">Belum ada data kendaraan</td></tr>';
    return;
  }

  isiTabel.innerHTML = dataRender.map(function (kendaraan, indeks) {
    const kelasStatus = kendaraan.status === 'parkir' ? 'badge-hijau' : 'badge-abu';
    const teksStatus  = kendaraan.status === 'parkir' ? 'Parkir' : 'Keluar';

    //object string jenis kendaraan
    const jenisCapital = kendaraan.jenisKendaraan.charAt(0).toUpperCase() + kendaraan.jenisKendaraan.slice(1);

    const tombolAksi = kendaraan.status === 'parkir'
      ? '<button class="tombol-aksi tombol-edit" onclick="bukaEditKendaraan(\'' + kendaraan.id + '\')">Edit</button>'
        + '<button class="tombol-aksi tombol-keluar-aksi" onclick="keluarParkir(\'' + kendaraan.id + '\')">Keluar</button>'
      : '';

    return '<tr>'
      + '<td>' + (indeks + 1) + '</td>'
      + '<td><strong>' + kendaraan.platNomor + '</strong></td>'
      + '<td>' + jenisCapital + '</td>'
      + '<td>' + kendaraan.jamMasuk + '</td>'
      + '<td>' + (kendaraan.jamKeluar || '-') + '</td>'
      + '<td>' + (kendaraan.tanggalKeluar || '-') + '</td>'
      + '<td>' + (kendaraan.durasi ? kendaraan.durasi + ' jam' : '-') + '</td>'
      + '<td>' + (kendaraan.totalBiaya ? formatRupiah(kendaraan.totalBiaya) : '-') + '</td>'
      + '<td><span class="badge-status ' + kelasStatus + '">' + teksStatus + '</span></td>'
      + '<td class="sel-aksi">' + tombolAksi
        + '<button class="tombol-aksi tombol-hapus" onclick="hapusKendaraan(\'' + kendaraan.id + '\')">Hapus</button>'
      + '</td>'
      + '</tr>';
  }).join('');
}

//function admin
function inisialisasiAdmin() {
  cekSesiAdmin();

  const inputJamMasuk = document.getElementById('jamMasuk');
  if (inputJamMasuk) inputJamMasuk.value = ambilJamSekarang();

  updateWaktu();
  intervalWaktu = setInterval(updateWaktu, 1000);

  //event dom situasi pas mau submit tambah kendaraan
  const formParkir = document.getElementById('formParkir');
  if (formParkir) {
    formParkir.addEventListener('submit', function (e) {
      e.preventDefault();
      const plat     = document.getElementById('platNomor').value.trim();
      const jenis    = document.getElementById('jenisKendaraan').value;
      const jamMasuk = document.getElementById('jamMasuk').value;

      if (!plat || !jenis || !jamMasuk) {
        tampilkanNotifikasi('Semua data kendaraan harus diisi', 'gagal');
        return;
      }

      if (!cekJamOperasional(jamMasuk)) {
        tampilkanNotifikasi('Parkir tutup pukul 22:01 - 04:01', 'gagal');
        return;
      }

      const jumlahParkir = daftarKendaraan.filter(function (k) { return k.status === 'parkir'; }).length;
      if (jumlahParkir >= BATAS_KAPASITAS) {
        tampilkanNotifikasi('Kapasitas penuh (' + BATAS_KAPASITAS + ' kendaraan). Tidak bisa menambah', 'gagal');
        return;
      }

      //object string
      const platUpper = plat.toUpperCase();
      const sudahAda  = daftarKendaraan.some(function (k) {
        return k.platNomor === platUpper && k.status === 'parkir';
      });

      if (sudahAda) {
        tampilkanNotifikasi('Plat ' + platUpper + ' sudah ada dan masih parkir', 'gagal');
        return;
      }

      const kendaraan = tambahKendaraan(plat, jenis, jamMasuk);
      tampilkanNotifikasi('Kendaraan ' + kendaraan.platNomor + ' berhasil ditambahkan', 'sukses');

      formParkir.reset();
      document.getElementById('jamMasuk').value = ambilJamSekarang();

      renderTabel();
      updateStatistik();
    });
  }

  //event dom situasi pas mau submit edit kendaraan
  const formEdit = document.getElementById('formEdit');
  if (formEdit) {
    formEdit.addEventListener('submit', function (e) {
      e.preventDefault();
      const id           = document.getElementById('editId').value;
      const platBaru     = document.getElementById('editPlat').value.trim();
      const jenisBaru    = document.getElementById('editJenis').value;
      const jamMasukBaru = document.getElementById('editJamMasuk').value;

      if (!platBaru || !jenisBaru || !jamMasukBaru) {
        tampilkanNotifikasi('Semua data kendaraan harus diisi', 'gagal');
        return;
      }
      if (!cekJamOperasional(jamMasukBaru)) {
        tampilkanNotifikasi('Jam masuk di luar jam parkir', 'gagal');
        return;
      }
      simpanEditKendaraan(id, platBaru, jenisBaru, jamMasukBaru);
    });
  }

  //event dom
  const tombolTutup = document.getElementById('tutupModal');
  if (tombolTutup) tombolTutup.addEventListener('click', tutupModalEdit);

  const lapisanModal = document.getElementById('lapisanModal');
  if (lapisanModal) lapisanModal.addEventListener('click', tutupModalEdit);

  //event dom hapus semua
  const tombolHapusSemua = document.getElementById('tombolHapusSemua');
  if (tombolHapusSemua) tombolHapusSemua.addEventListener('click', hapusSemua);

  //event dom cari kendaraan
  const inputCari = document.getElementById('cariPlat');
  if (inputCari) {
    inputCari.addEventListener('input', function () {
      const hasil = cariKendaraan(this.value);
      renderTabel(this.value.trim() ? hasil : null);
    });
  }

  //event dom logout
  const tombolLogout = document.getElementById('tombolLogout');
  if (tombolLogout) {
    tombolLogout.addEventListener('click', function () {
      //kotak dialog/confirm
      const konfirmasi = confirm('kamu yakin ingin keluar?');
      if (konfirmasi) {
        clearInterval(intervalWaktu);
        sessionStorage.removeItem('sudahLogin');
        window.location.href = 'login.html';
      }
    });
  }

  renderTabel();
  updateStatistik();
}


//event dom cek halaman
document.addEventListener('DOMContentLoaded', function () {
  const kelasHalaman = document.body.className;

  if (kelasHalaman.includes('landingpage')) {
    inisialisasiLanding();
  } else if (kelasHalaman.includes('halaman-login')) {
    inisialisasiLogin();
  } else if (kelasHalaman.includes('halaman-admin')) {
    inisialisasiAdmin();
  }
});