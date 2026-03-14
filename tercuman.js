const mongoose = require('mongoose');
const tr = require('./languages/tr.json');
const en = require('./languages/en.json');

// Sunucuların dilini kaydedeceğimiz Mongoose Şeması
const DilSema = new mongoose.Schema({
  guildId: String,
  language: { type: String, default: 'tr' }
});

// Eğer model daha önce veritabanında oluştuysa onu kullan, yoksa yeni oluştur
const DilModel = mongoose.models.DilAyarlari || mongoose.model('DilAyarlari', DilSema);

module.exports = {
  // 1. Çeviri Yapma Fonksiyonu (Bot kelimeleri okurken kullanır)
  cevir: async (guildId, anahtarKelime) => {
    try {
      // Veritabanından sunucunun dilini bul
      let sunucuAyar = await DilModel.findOne({ guildId: guildId });
      let secilenDil = sunucuAyar ? sunucuAyar.language : "tr"; // Bulamazsa varsayılan TR olsun

      if (secilenDil === "tr") return tr[anahtarKelime] || `[HATA: ${anahtarKelime} bulunamadı]`;
      if (secilenDil === "en") return en[anahtarKelime] || `[ERROR: ${anahtarKelime} not found]`;
    } catch (error) {
      console.error("Tercüman Hatası:", error);
      return tr[anahtarKelime]; 
    }
  },

  // 2. Veritabanına Kaydetme Fonksiyonu (/dil komutu kullanır)
  diliKaydet: async (guildId, yeniDil) => {
    try {
      // Sunucuyu bul, varsa güncelle, yoksa yeni kayıt aç (upsert: true)
      await DilModel.findOneAndUpdate(
        { guildId: guildId },
        { language: yeniDil },
        { upsert: true, new: true }
      );
      return true;
    } catch (error) {
      console.error("Veritabanı Kayıt Hatası:", error);
      return false;
    }
  }
};