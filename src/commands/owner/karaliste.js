const { ApplicationCommandOptionType } = require("discord.js");
const Karaliste = require("../../schemas/karaliste"); // Dosya yoluna dikkat et

// KENDİ ID'Nİ BURAYA YAZ
const OWNER_ID = "1469310778518536265";

module.exports = {
  name: "karaliste",
  description: "Kullanıcıyı karalisteye ekler veya çıkarır.",
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
        description: "İşlem türü",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "Ekle", value: "ekle" },
          { name: "Çıkar", value: "cikar" },
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

  // !karaliste komutu için
  async messageRun(message, args) {
    if (message.author.id !== OWNER_ID) return message.reply("⛔ Sadece sahibim kullanabilir.");

    const islem = args[0].toLowerCase();
    const target = message.mentions.users.first() || await message.client.users.fetch(args[1]).catch(() => null);

    if (!target) return message.reply("❌ Kullanıcı bulunamadı.");

    const sonuc = await islemYap(target.id, islem);
    await message.reply(sonuc);
  },

  // /karaliste komutu için (DÜZELTİLDİ)
  async interactionRun(interaction) {
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "⛔ Sadece sahibim kullanabilir.", ephemeral: true });

    // Hata vermemesi için işlemi bekletiyoruz (Düşünüyor...)
    await interaction.deferReply();

    const islem = interaction.options.getString("islem");
    const target = interaction.options.getUser("kullanici");

    const sonuc = await islemYap(target.id, islem);
    
    // deferReply kullandığımız için editReply kullanmalıyız
    await interaction.editReply(sonuc);
  },
};

// Ortak İşlem Fonksiyonu
async function islemYap(userId, type) {
  try {
    const data = await Karaliste.findOne({ userId: userId });

    // Ekleme İşlemi
    if (type === "ekle" || type === "add") {
      if (data) return `⚠️ <@${userId}> zaten karalistede ekli.`;
      
      await Karaliste.create({ userId: userId });
      return `✅ <@${userId}> başarıyla **karalisteye alındı**.`;
    } 
    
    // Çıkarma İşlemi
    else if (type === "cikar" || type === "remove") {
      if (!data) return `⚠️ <@${userId}> zaten karalistede değil.`;
      
      await Karaliste.deleteOne({ userId: userId });
      return `✅ <@${userId}> karalisteden **çıkarıldı**.`;
    }
    
    return "❌ Geçersiz işlem.";

  } catch (err) {
    console.error(err);
    return `❌ Bir hata oluştu: ${err.message}`;
  }
}