// ==========================================
// 0. DNS FIX (RENDER BAĞLANTI DONMASINI ÇÖZER)
// ==========================================
const dns = require('node:dns');
dns.setDefaultResultOrder('ipv4first');

// ==========================================
// 1. MODÜLLER VE KÜTÜPHANELER (SADECE GEREKLİ OLANLAR)
// ==========================================
require('dotenv').config();
const express = require('express');
const { Client, GatewayIntentBits, Partials } = require('discord.js'); // Discord.js'in kendisini kullanacağız
// const { BotClient } = require("@src/structures"); // Özel BotClient'ı geçici olarak kullanmayacağız

// ==========================================
// 2. RENDER PORT DİNLEYİCİ (EN ÜSTTE OLMALI)
// ==========================================
const app = express();
const PORT = process.env.PORT || 10000; 

app.get('/', (req, res) => res.send('Bot Aktif ve Test Modunda! ✅'));
app.listen(PORT, () => {
  console.log(`[RENDER] 🌐 Web sunucusu ${PORT} portunda aktif!`);
});

// ==========================================
// 3. CLIENT OLUŞTURMA (INTENTLERİ ZORLA TANIMLA)
// ==========================================
// NOT: BotClient yerine direkt Discord.Client kullanıyoruz test için.
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildPresences, // Botun yeşil yanması için kritik
    GatewayIntentBits.GuildVoiceStates,
    // Ek intenter varsa buraya ekleyebilirsin
  ],
  partials: [
    Partials.Channel,
    Partials.GuildMember,
    Partials.Message,
    Partials.User,
    Partials.Reaction
  ],
});

// ==========================================
// 4. DISCORD'A GİRİŞ DENEMESİ
// ==========================================
async function botuBaslat() {
    console.log(">>> [DEBUG TEST] Discord'a giriş başlatılıyor...");

    try {
        if (!process.env.BOT_TOKEN) {
            console.error("❌ [HATA] RENDER ENVIRONMENT İÇİNDE BOT_TOKEN EKSİK!");
        } else {
            console.log("🟡 [DEBUG TEST] Token bulundu, Discord'un kapısı çalınıyor...");
            await client.login(process.env.BOT_TOKEN);
            console.log(`✅✅✅ [DEBUG TEST] BAŞARILI! BOT GİRİŞ YAPTI: ${client.user.tag} ✅✅✅`);
            // Botun yeşil yanması için "ready" event'i tetiklenmeli
            client.once("ready", () => {
                console.log(`🎉 [DEBUG TEST] CLIENT READY: ${client.user.tag} 🎉`);
            });
        }
    } catch (err) {
        console.error("❌❌❌ [HATA] Discord'a giriş yapılamadı! HATA:", err.message);
        console.error(err); // Detaylı hatayı görmek için
    }
}

botuBaslat();