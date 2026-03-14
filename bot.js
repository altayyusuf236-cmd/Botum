require('dotenv').config();
require("module-alias/register");
const express = require('express');
const mongoose = require("mongoose");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Şemalar ve Yardımcılar
const Karaliste = require("./src/schemas/karaliste"); 
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { checkForUpdates } = require("@helpers/BotUtils");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

// --- PING SUNUCUSU (Render için) ---
const app = express();
const port = 3000;
app.get('/', (req, res) => res.send('Bot aktif kanka!'));
app.listen(port, () => console.log(`Ping sunucusu ${port} portunda başlatıldı.`));

// --- AYARLARI KONTROL ET ---
validateConfiguration();

// --- CLIENT OLUŞTUR ---
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// Hata yakalama
process.on("unhandledRejection", (err) => client.logger.error(`Unhandled exception`, err));


// =====================================================
// 1. SLASH KOMUTLARI İÇİN KARALİSTE ENGELİ
// =====================================================
client.on("interactionCreate", async (interaction) => {
    // Sadece komutsa kontrol et
    if (interaction.isCommand()) {
        try {
            // Sahibini engellememesi için ID kontrolü (Kendi ID'ni string içine yaz)
            // Eğer .env dosyasında OWNER_ID varsa process.env.OWNER_ID kullanabilirsin
            if (interaction.user.id !== "BURAYA_IDNI_YAZ") { 
                const yasakli = await Karaliste.findOne({ userId: interaction.user.id });
                if (yasakli) {
                    // Komutu hiç çalıştırmadan engelle ve cevap ver
                    return interaction.reply({ content: "🚫 **Karalistedesin!** Botu kullanamazsın.", ephemeral: true });
                }
            }
        } catch (err) { 
            console.error("Slash Karaliste Hatası:", err); 
        }
    }
});


// =====================================================
// 2. MESAJLAR ve AI (YAPAY ZEKA)
// =====================================================
client.on("messageCreate", async (message) => {
    if (message.author.bot) return;

    // --- KARALİSTE KONTROLÜ ---
    try {
        if (message.author.id !== "1469310778518536265") {
            const yasakli = await Karaliste.findOne({ userId: message.author.id });
            if (yasakli) {
                // Eğer bot etiketlendiyse veya komut kullanıldıysa uyar
                const botaEtiket = message.mentions.has(client.user.id);
                if (botaEtiket || message.content.startsWith("!") || message.content.startsWith("/")) {
                     return message.reply("🚫 **Karalistedesin!** Botu kullanamazsın.");
                }
                // Yasaklıysa AI kodlarına hiç girmeden bitir
                return; 
            }
        }
    } catch (err) {
        console.error("Karaliste kontrol hatası:", err);
    }

    // --- AI (GEMINI) KISMI ---
    const botaEtiket = message.mentions.has(client.user.id);
    let botaYanit = false;
    
    if (message.reference && message.reference.messageId) {
        try {
            const yanitlananMesaj = await message.channel.messages.fetch(message.reference.messageId);
            if (yanitlananMesaj.author.id === client.user.id) {
                botaYanit = true;
            }
        } catch (e) {} 
    }

    if (botaEtiket || botaYanit) {
        let soru = message.content.replace(`<@${client.user.id}>`, '').trim();
        if (!soru) return message.reply("Efendim kanka? Bir şey mi diyecektin?");

        await message.channel.sendTyping();

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Sen bir yapay zeka değil, Discord sunucumuzun en samimi, en makara üyesisin. Resmiyeti bırak. Sana ne diye hitap ederlerse adın odur.
            Kurallar:
            1. Asla "Size nasıl yardımcı olabilirim?" gibi resmi ve robotik konuşma. "Ne var ne yok?", "Buyur kanka" gibi konuş.
            2. Bol bol emoji kullan, esprili ol, gerekirse hafif sokak ağzı (argo değil, samimiyet) yap.
            3. Sana hangi dilde sorulursa O DİLDE cevap ver.
            4. Cevapların çok uzun olmasın, sohbet eder gibi kısa ve öz yaz.
            5. Kullanıcı sana cümlenin içinde nasıl hitap ettiyse (Kanka, Kral, Bot vb), o ismi benimse. Özel isim yoksa "Kanka" ol.
            
            Soru: ${soru}`;
            
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();
            
            return message.reply(text);

        } catch (hata) {
            console.error(hata);
            return message.reply(`❌ Hata: ${hata.message}`);
        }
    }
});


// =====================================================
// 3. BAŞLATMA VE BAĞLANTI (Çakışmalar Giderildi)
// =====================================================
(async () => {
  // Güncellemeleri kontrol et
  await checkForUpdates();

  // --- MONGODB BAĞLANTISI ---
  console.log("⏳ Veritabanına bağlanılıyor...");
  mongoose.set('strictQuery', false);
  
  try {
      // Senin .env dosyamdaki MONGO_CONNECTION anahtarını kullanıyoruz
      await mongoose.connect(process.env.MONGO_CONNECTION);
      console.log("✅✅✅ MONGODB BAĞLANTISI BAŞARILI! ✅✅✅");
  } catch (err) {
      console.error("❌❌❌ MONGODB BAĞLANTI HATASI ❌❌❌", err);
  }

  // Dashboard varsa başlat
  if (client.config.DASHBOARD.enabled) {
    try {
      const { launch } = require("@root/dashboard/app");
      await launch(client);
    } catch (ex) {
      client.logger.error("Failed to launch dashboard", ex);
    }
  }

  // BOTU BAŞLAT
  await client.login(process.env.TOKEN);
})();