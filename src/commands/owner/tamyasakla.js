const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

// BURAYA KENDİ ID'Nİ YAZ (Tırnaklar kalsın)
const OWNER_ID = "1469310778518536265";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "tam-yasakla",
  description: "Kullanıcıyı botun olduğu TÜM sunuculardan yasaklar (Sadece Sahip).",
  category: "OWNER",
  command: {
    enabled: true,
    usage: "<ID|@kullanici> [sebep]",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "user",
        description: "Yasaklanacak kullanıcı",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "reason",
        description: "Yasaklama sebebi",
        type: ApplicationCommandOptionType.String,
        required: false,
      },
    ],
  },

  async messageRun(message, args) {
    // Sadece sahip kullanabilsin
    if (message.author.id !== OWNER_ID) return message.safeReply("⛔ Bu komutu sadece sahibim kullanabilir.");

    // Senin yapındaki kullanıcı bulma yöntemi
    const match = await message.client.resolveUsers(args[0], true);
    const target = match[0];
    if (!target) return message.safeReply(`No user found matching ${args[0]}`);

    const reason = message.content.split(args[0])[1]?.trim() || "Global Ban: Sahip tarafından yasaklandı.";
    
    // İşlem uzun sürerse kullanıcıya bilgi verelim
    await message.safeReply(`🔨 **${target.tag}** için global ban işlemi başlatılıyor... Lütfen bekle.`);
    
    const response = await globalBan(message.client, target, reason);
    // safeReply bazen düzenlemeye izin vermeyebilir, yeni mesaj atıyoruz
    await message.channel.send(response);
  },

  async interactionRun(interaction) {
    if (interaction.user.id !== OWNER_ID) return interaction.followUp("⛔ Bu komutu sadece sahibim kullanabilir.");

    const target = interaction.options.getUser("user");
    const reason = interaction.options.getString("reason") || "Global Ban: Sahip tarafından yasaklandı.";

    await interaction.followUp(`🔨 **${target.tag}** için global ban işlemi başlatılıyor...`);

    const response = await globalBan(interaction.client, target, reason);
    await interaction.editReply(response);
  },
};

/**
 * @param {import('discord.js').Client} client
 * @param {import('discord.js').User} target
 * @param {string} reason
 */
async function globalBan(client, target, reason) {
  let basarili = [];
  let basarisiz = [];
  
  // Tüm sunucuları gez
  const guilds = client.guilds.cache;

  for (const [id, guild] of guilds) {
    try {
      // Botun o sunucudaki yetkisini kontrol etmeden banlamayı dene, hata verirse catch yakalar
      await guild.members.ban(target.id, { reason: reason });
      basarili.push(guild.name);
    } catch (err) {
      // Hata detayına gerek yok, banlanamadıysa listeye ekle
      basarisiz.push(guild.name);
    }
  }

  // Rapor oluştur
  let sonuc = `✅ **${basarili.length}** sunucudan yasaklandı.\n❌ **${basarisiz.length}** sunucudan yasaklanamadı (Yetki yok veya kullanıcı yok).`;
  
  if (basarili.length > 0) {
    sonuc += `\n\n**Yasaklanan Sunucular:**\n${basarili.slice(0, 10).join(", ")}`;
    if (basarili.length > 10) sonuc += ` ve ${basarili.length - 10} tane daha...`;
  }

  return sonuc;
}