const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "gduyuru",
  description: "Botun bulunduğu herhangi bir sunucuya uzaktan duyuru atar.",
  category: "OWNER", // Bu sayede sadece config.js'deki Owner'lar kullanabilir!
  command: {
    enabled: true,
    usage: "<sunucu_id> <kanal_id_veya_isim> <mesaj>",
    minArgsCount: 3,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "sunucu_id",
        description: "Duyurunun gönderileceği sunucunun ID numarası.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "kanal",
        description: "Kanalın ID numarası veya tam ismi (Örn: genel-sohbet).",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
      {
        name: "mesaj",
        description: "Göndermek istediğiniz duyuru mesajı.",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  // 1. NORMAL MESAJ KULLANIMI (!gduyuru)
  async messageRun(message, args) {
    const targetGuildId = args[0];
    const targetChannelInput = args[1];
    const duyuruMesaji = args.slice(2).join(" ");

    const response = await gonder(message.client, message.author, targetGuildId, targetChannelInput, duyuruMesaji);
    await message.safeReply(response);
  },

  // 2. SLASH KOMUT KULLANIMI (/gduyuru)
  async interactionRun(interaction) {
    const targetGuildId = interaction.options.getString("sunucu_id");
    const targetChannelInput = interaction.options.getString("kanal");
    const duyuruMesaji = interaction.options.getString("mesaj");

    const response = await gonder(interaction.client, interaction.user, targetGuildId, targetChannelInput, duyuruMesaji);
    await interaction.followUp(response); // Senin altyapın deferReply kullandığı için followUp ile cevaplıyoruz
  },
};

/**
 * Ana Gönderim Fonksiyonu (İki komut türü de burayı kullanır)
 */
async function gonder(client, author, targetGuildId, targetChannelInput, duyuruMesaji) {
  // Sunucuyu Bul
  const targetGuild = client.guilds.cache.get(targetGuildId);
  if (!targetGuild) {
    return "❌ Bot belirttiğin ID'ye sahip bir sunucuda bulunmuyor!";
  }

  // Kanalı Bul (İsimle veya ID ile)
  const targetChannel =
    targetGuild.channels.cache.get(targetChannelInput) ||
    targetGuild.channels.cache.find((c) => c.name.toLowerCase() === targetChannelInput.toLowerCase());

  if (!targetChannel) {
    return `❌ **${targetGuild.name}** sunucusunda belirttiğin isimde/ID'de bir kanal bulunamadı!`;
  }

  // Metin kanalı mı kontrol et
  if (!targetChannel.isTextBased()) {
    return "❌ Belirttiğin kanal bir metin kanalı değil (Ses veya Kategori kanalı olamaz).";
  }

  // Embed Mesajı Oluştur
  const embed = new EmbedBuilder()
    .setColor("#068ADD") // Botunun varsayılan mavi/cyan rengi
    .setTitle("📢 Sistem Duyurusu")
    .setDescription(duyuruMesaji)
    .setFooter({ text: "Bot Yöneticisi Tarafından Gönderildi", iconURL: author.displayAvatarURL() })
    .setTimestamp();

  // Gönder ve Sonuç Döndür
  try {
    await targetChannel.send({ embeds: [embed] });
    return `✅ Duyuru başarıyla **${targetGuild.name}** sunucusundaki **#${targetChannel.name}** kanalına fırlatıldı! 🚀`;
  } catch (error) {
    console.error(error);
    return `❌ Mesaj gönderilemedi. O sunucuda mesaj yazma yetkim yok galiba.`;
  }
}