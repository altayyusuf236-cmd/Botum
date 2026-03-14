const { ApplicationCommandOptionType } = require("discord.js");
const Karaliste = require("../../schemas/karaliste"); // Şema yolunu doğru gösterdik

// BURAYA KENDİ ID'Nİ YAZ
const OWNER_ID = "1469310778518536265";

module.exports = {
  name: "karaliste",
  description: "Kullanıcıyı karalisteye ekler veya çıkarır (Sadece Sahip).",
  category: "OWNER",
  command: {
    enabled: true,
    usage: "<ekle/cikar> <ID|@kullanici>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "islem",
        description: "Ne yapmak istiyorsun?",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "Ekle", value: "add" },
          { name: "Çıkar", value: "remove" },
        ],
      },
      {
        name: "kullanici",
        description: "Hedef kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    if (message.author.id !== OWNER_ID) return message.safeReply("⛔ Sadece sahibim kullanabilir.");

    const islem = args[0].toLowerCase();
    const match = await message.client.resolveUsers(args[1], true);
    const target = match[0];

    if (!target) return message.safeReply("❌ Kullanıcı bulunamadı.");
    
    // İşlem fonksiyonunu çağır
    const sonuc = await karalisteIslem(target.id, islem);
    await message.safeReply(sonuc);
  },

  async interactionRun(interaction) {
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "⛔ Sadece sahibim kullanabilir.", ephemeral: true });

    const islem = interaction.options.getString("islem");
    const target = interaction.options.getUser("kullanici");

    await interaction.deferReply();
    const sonuc = await karalisteIslem(target.id, islem);
    await interaction.followUp(sonuc);
  },
};

// Veritabanı işlemleri
async function karalisteIslem(userId, type) {
  try {
    const data = await Karaliste.findOne({ userId: userId });

    if (type === "add" || type === "ekle") {
      if (data) return `⚠️ <@${userId}> zaten karalistede ekli.`;
      
      await Karaliste.create({ userId: userId });
      return `✅ <@${userId}> başarıyla **karalisteye alındı** ve veritabanına kaydedildi.`;
    } 
    
    else if (type === "remove" || type === "cikar") {
      if (!data) return `⚠️ <@${userId}> zaten karalistede değil.`;
      
      await Karaliste.deleteOne({ userId: userId });
      return `✅ <@${userId}> karalisteden **silindi**. Artık botu kullanabilir.`;
    } 
    
    else {
      return "❌ Geçersiz işlem! 'ekle' veya 'cikar' yaz.";
    }

  } catch (err) {
    console.error(err);
    return "❌ Veritabanı hatası oluştu.";
  }
}