const { EmbedBuilder } = require("discord.js");
const Karaliste = require("../../schemas/karaliste");

const OWNER_ID = "1469310778518536265";

module.exports = {
  name: "karaliste-goster",
  description: "Yasaklı kullanıcıların listesini gösterir.",
  category: "OWNER",
  command: {
    enabled: true,
  },
  slashCommand: {
    enabled: true,
  },

  async messageRun(message, args) {
    if (message.author.id !== OWNER_ID) return message.safeReply("⛔ Sadece sahibim bakabilir.");
    const embed = await listeGetir();
    await message.safeReply({ embeds: [embed] });
  },

  async interactionRun(interaction) {
    if (interaction.user.id !== OWNER_ID) return interaction.reply({ content: "⛔ Sadece sahibim bakabilir.", ephemeral: true });
    
    await interaction.deferReply();
    const embed = await listeGetir();
    await interaction.followUp({ embeds: [embed] });
  },
};

async function listeGetir() {
  try {
    // Tüm verileri çek
    const tumYasaklilar = await Karaliste.find({});

    const embed = new EmbedBuilder()
      .setTitle("🚫 Karaliste (Blacklist)")
      .setColor("Red")
      .setTimestamp();

    if (tumYasaklilar.length === 0) {
      embed.setDescription("Şu an karalistede kimse yok.");
    } else {
      // Listeyi formatla
      const liste = tumYasaklilar.map((veri, i) => `${i + 1}. <@${veri.userId}> (\`${veri.userId}\`)`).join("\n");
      
      // Discord 4096 karakter sınırını aşarsa kes
      if (liste.length > 4000) {
          embed.setDescription(liste.substring(0, 4000) + "...\n(Liste çok uzun)");
      } else {
          embed.setDescription(liste);
      }
      embed.setFooter({ text: `Toplam ${tumYasaklilar.length} kişi engelli.` });
    }
    return embed;

  } catch (err) {
    console.error(err);
    return new EmbedBuilder().setDescription("❌ Liste getirilirken hata oluştu.");
  }
}