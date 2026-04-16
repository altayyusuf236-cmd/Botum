require('dotenv').config();
const { GoogleGenerativeAI } = require("@google/generative-ai");
const mongoose = require("mongoose");
const Karaliste = require("./src/schemas/karaliste"); 

const express = require('express');
const app = express();
const port = 3000;

app.get('/', (req, res) => res.send('Bot su an aktif ve calisiyor!'));

app.listen(port, () => console.log(`Ping sunucusu ${port} portunda baslatildi.`));

require("dotenv").config();
require("module-alias/register");

// register extenders
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { checkForUpdates } = require("@helpers/BotUtils");
const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

validateConfiguration();

// initialize client
const client = new BotClient();
client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// find unhandled promise rejections
process.on("unhandledRejection", (err) => client.logger.error(`Unhandled exception`, err));

(async () => {
  // check for updates
  await checkForUpdates();

  // start the dashboard
  if (client.config.DASHBOARD.enabled) {
    client.logger.log("Launching dashboard");
    try {
      const { launch } = require("@root/dashboard/app");

      // let the dashboard initialize the database
      await launch(client);
    } catch (ex) {
      client.logger.error("Failed to launch dashboard", ex);
    }
  } else {
    // initialize the database
    await initializeMongoose();
  }

  // start the client
  await client.login(process.env.BOT_TOKEN);
})();


client.on("messageCreate", async (message) => {
    if (message.author.bot) return;
    
        // --- BURAYI if (message.author.bot) return; SATIRININ ALTINA YAPIŞTIR ---
    
    // Veritabanından kontrol et: Bu kişi yasaklı mı?
    try {
        const yasakli = await Karaliste.findOne({ userId: message.author.id });
        
        // Eğer yasaklıysa:
        if (yasakli) {
            return message.reply("🚫 **Karalistedesin!** Botu kullanamazsın.");
        }
    } catch (err) {
        console.error("Karaliste kontrol hatası:", err);
    }
    // ------------------------------------------------------------------------

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
            // DÜZELTME: Şifreyi buraya elle yazma, Environment'ten çekiyoruz
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
            
            // gemini-pro yerine gemini-1.5-flash daha hızlıdır ve hatasız çalışır
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const prompt = `Sen bir yapay zeka değil, Discord sunucumuzun en samimi, en makara üyesisin. Resmiyeti bırak. Sana ne diye hitap ederlerse adın odur.
            Kurallar:
            1. Asla "Size nasıl yardımcı olabilirim?" gibi resmi ve robotik konuşma. "Ne var ne yok?", "Buyur kanka" gibi konuş.
            2. Bol bol emoji kullan, esprili ol, gerekirse hafif sokak ağzı (argo değil, samimiyet) yap.
            3. Sana hangi dilde sorulursa O DİLDE cevap ver. (İngilizce sorana İngilizce, Türkçe sorana Türkçe).
            4. Cevapların çok uzun olmasın, sohbet eder gibi kısa ve öz yaz.
            5. Kullanıcı sana cümlenin içinde nasıl hitap ettiyse (örneğin: Kanka, Kral, Bot, Jarvis, Mahmut), o ismi ve o kimliği benimse.
            6. Eğer özel bir isim verilmediyse, kendini "Kanka" olarak tanıt.
            
            
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

// --- BURAYI DOSYANIN EN ALTINA YAPIŞTIR ---

mongoose.set('strictQuery', false);
mongoose.connect(process.env.MONGO_CONNECTION)
    .then(() => console.log("✅ Veritabanına (MongoDB) bağlandı!"))
    .catch((err) => console.error("❌ Veritabanı bağlantı hatası:", err));

client.login(process.env.BOT_TOKEN);