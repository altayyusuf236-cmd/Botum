require('dotenv').config();
require("module-alias/register");
const express = require('express');
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Şemalar
const Karaliste = require("./src/schemas/karaliste"); 

// Yardımcılar
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { checkForUpdates } = require("@helpers/BotUtils");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

// --- PING SUNUCUSU (Render Kapanmasın Diye) ---
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Bot aktif ve fişek gibi!'));
app.listen(port, () => console.log(`Ping sunucusu ${port} portunda başlatıldı.`));

// Ayarları Doğrula
validateConfiguration();

// Client Oluştur
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

process.on("unhandledRejection", (err) => client.logger.error(`Unhandled exception`, err));

// =====================================================
// 1. SLASH KOMUT ENGELLEYİCİ
// =====================================================
client.on("interactionCreate", async (interaction) => {
    if (interaction.isCommand()) {
        try {
            // Sahibini engellememesi için ID kontrolü (Tırnak içine ID yaz)
            if (interaction.user.id !== "1469310778518536265") { 
                const yasakli = await Karaliste.findOne({ userId: interaction.user.id });
                if (yasakli) {
                    return interaction.reply({ content: "🚫 **Karalistedesin!** Botu kullanamazsın.", ephemeral: true });
                }
            }
        } catch (err) { console.error("Slash Karaliste Hatası:", err); }
    }
});

// =====================================================
// 2. MESAJLAR VE YAPAY ZEKA (AI)
// =====================================================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // --- KARALİSTE KONTROLÜ ---
    try {
        if (message.author.id !== "1469310778518536265") {
            const yasakli = await Karaliste.findOne({ userId: message.author.id });
            if (yasakli) {
                // Eğer bot etiketlendiyse cevap ver, yoksa sus
                const botaEtiket = message.mentions.has(client.user.id);
                if (botaEtiket || message.content.startsWith("!") || message.content.startsWith("/")) {
                     return message.reply("🚫 **Karalistedesin!** Benimle konuşamazsın.");
                }
                return; // Yasaklıysa aşağıya (AI koduna) hiç inme
            }
        }
    } catch (err) { console.error(err); }

    // --- AI (GEMINI) BAŞLANGIÇ ---
    const botaEtiket = message.mentions.has(client.user.id);
    let botaYanit = false;
    
    // Yanıtlanan mesaj kontrolü
    if (message.reference && message.reference.messageId) {
        try {
            const yanitlananMesaj = await message.channel.messages.fetch(message.reference.messageId);
            if (yanitlananMesaj.author.id === client.user.id) {
                botaYanit = true;
            }
        } catch (e) {} 
    }

    // Bot etiketlendiyse veya bota yanıt verildiyse çalış
    if (botaEtiket || botaYanit) {
        let soru = message.content.replace(`<@${client.user.id}>`, '').trim();
        if (!soru) return message.reply("Efendim kanka? Bir şey mi diyecektin?");

        await message.channel.sendTyping();

        try {
            // Gemini API Bağlantısı
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
            // Modeli 1.5 Flash seçtik (Hızlı ve Güncel)
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            // SENİN İSTEDİĞİN SAMİMİ PROMPT
            const prompt = `
            Sen bir yapay zeka değil, Discord sunucumuzun en samimi, en makara üyesisin.
            
            KURALLARIN:
            1. Asla resmi konuşma. "Size nasıl yardımcı olabilirim?" YASAK. "Ne yapıyon kanka?", "Buyur kral" gibi konuş.
            2. Bol emoji kullan, esprili ol, samimi sokak ağzı yapabilirsin.
            3. DİL ALGILA: Sana İngilizce sorulursa İNGİLİZCE cevap ver. Türkçe sorulursa TÜRKÇE.
            4. KİMLİK: Kullanıcı sana cümlenin içinde "Kral", "Jarvis", "Bot", "Mahmut" gibi bir isimle hitap ederse O KİMLİĞE BÜRÜN.
            5. Özel bir isim yoksa kendini "Kanka" olarak tanıt.
            
            Kullanıcının Sorusu: ${soru}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            // Discord mesaj limiti kontrolü
            if (text.length > 2000) {
                return message.reply(text.substring(0, 1990) + "...");
            }
            
            return message.reply(text);

        } catch (hata) {
            console.error("Gemini Hatası:", hata);
            return message.reply(`❌ Kanka bi hata oldu ya: ${hata.message}`);
        }
    }
});

// =====================================================
// 3. BAŞLATMA VE VERİTABANI BAĞLANTISI
// =====================================================
(async () => {
  await checkForUpdates();

  console.log("⏳ Veritabanına (MongoDB) bağlanılıyor...");
  
  // MongoDB Bağlantısı
  mongoose.set('strictQuery', false);
  try {
      await mongoose.connect(process.env.MONGO_CONNECTION);
      console.log("✅✅✅ MONGODB BAĞLANTISI BAŞARILI! ✅✅✅");
  } catch (err) {
      console.error("❌❌❌ MONGODB BAĞLANTISI BAŞARISIZ! Şifreni kontrol et. ❌❌❌", err);
  }

  // Dashboard varsa başlat
  if (client.config.DASHBOARD.enabled) {
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {}
  }

  // Botu Başlat
  await client.login(process.env.TOKEN);
})();