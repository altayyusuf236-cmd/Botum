const { ApplicationCommandOptionType, EmbedBuilder } = require("discord.js");

// BURAYA KENDİ ID'Nİ YAZ (Tırnaklar kalsın)
const OWNER_ID = "1469310778518536265";

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "geribildirim",
  description: "Bot sahibine öneri veya hata bildirimi gönderir",
  category: "UTILITY",
  command: {
    enabled: true,
    usage: "<mesaj>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "mesaj",
        description: "İletmek istediğin mesaj nedir?",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  async messageRun(message, args) {
    const mesaj = args.join(" ");
    const response = await sendFeedback(message.author, message.guild, mesaj, message.client);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const mesaj = interaction.options.getString("mesaj");
    const response = await sendFeedback(interaction.user, interaction.guild, mesaj, interaction.client);
    await interaction.followUp(response);
  },
};

/**
 * @param {import('discord.js').User} author
 * @param {import('discord.js').Guild} guild
 * @param {string} content
 * @param {import('discord.js').Client} client
 */
async function sendFeedback(author, guild, content, client) {
  try {
    const owner = await client.users.fetch(OWNER_ID);
    if (!owner) return "❌ Bot sahibine ulaşılamadı (ID hatası).";

    const embed = new EmbedBuilder()
      .setTitle("📢 Yeni Geri Bildirim")
      .setColor("Blue")
      .addFields(
        { name: "👤 Gönderen", value: `${author.tag} (\`${author.id}\`)`, inline: true },
        { name: "🏠 Sunucu", value: `${guild ? guild.name : "DM"}`, inline: true },
        { name: "📝 Mesaj", value: content }
      )
      .setTimestamp();

    await owner.send({ embeds: [embed] });
    return "✅ Geri bildirimin sahibime iletildi kanka, teşekkürler!";

  } catch (err) {
    console.error("Geri bildirim hatası:", err);
    return "❌ Mesaj gönderilirken bir hata oluştu. Sahibim DM kutusunu kapatmış olabilir.";
  }
}