const { GoogleGenerativeAI } = require("@google/generative-ai");
const { ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "sor",
  description: "Yapay zekaya (Gemini) istediğin her şeyi sor!",
  category: "FUN",
  command: {
    enabled: true,
    aliases: ["yapayzeka", "ai"],
    usage: "<sorun>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "soru",
        description: "Yapay zekaya ne sormak istersin?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const soru = args.join(" ");
    await message.channel.sendTyping();
    const cevap = await yapayZekayaSor(soru, message.author.username);
    // safeReply fonksiyonun yoksa normal reply kullanabilirsin
    try { await message.reply(cevap); } catch(e) { await message.channel.send(cevap); }
  },

  async interactionRun(interaction) {
    const soru = interaction.options.getString("soru");
    await interaction.deferReply(); // İşlem uzun sürerse hata vermesin diye bekletiyoruz
    const cevap = await yapayZekayaSor(soru, interaction.user.username);
    await interaction.followUp(cevap);
  },
};

// YAPAY ZEKA KISMI
async function yapayZekayaSor(soru, kullaniciAdi) {
  // DÜZELTME: Şifreyi kodun içine yazma, .env dosyasından çek
  const apiKey = process.env.GEMINI_API_KEY; 

  if (!apiKey) return "❌ API Key bulunamadı! Lütfen Render veya .env ayarlarını kontrol et.";

  const karakter = `Sen Discord'da takılan, aşırı zeki ama bir o kadar da gevşek, kafası rahat ve komik bir botsun.
  Konuştuğun kişi: ${kullaniciAdi}.
  
  Talimatlar:
  - Asla resmi olma, senli benli konuş.
  - Soruya göre tepkiler ver (şaşır, gül, dalga geç).
  - Kullanıcı sana İngilizce yazdıysa kesinlikle İNGİLİZCE cevap ver. Türkçe yazdıysa TÜRKÇE devam et. Dili sen algıla.
  - Kullanıcı sorusunun içinde sana bir isim taktıysa (Kral, Reis, Bot, Jarvis, Mahmut vb.) o role bürün ve ona göre konuş.
  - Sana isim takılmadıysa kendini "Kanka" olarak gör.
  - Asla "Ben bir yapay zeka dili modeliyim" gibi robotik cümleler kurma. İnsan gibi cevap ver.
  - Cevapların çok uzun olmasın, sohbet eder gibi kısa ve öz yaz.
  Sorulan Soru: ${soru}`;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    // Model ismini güncelledim, pro bazen hata verebiliyor
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent(karakter);
    const response = await result.response;
    return response.text();

  } catch (error) {
    console.error("Yapay Zeka Hatası:", error);
    return `❌ Kanka bir hata oluştu: ${error.message}`;
  }
}