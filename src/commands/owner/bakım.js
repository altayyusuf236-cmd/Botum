const { EmbedBuilder, ApplicationCommandOptionType } = require("discord.js");

module.exports = {
  name: "bakım",
  description: "Botu bakım moduna alır veya çıkarır.",
  category: "ADMIN",
  userPermissions: ["Administrator"], // Sadece adminler görebilsin (ama kodda sahip kontrolü de var)
  command: {
    enabled: true,
    usage: "<aç/kapat>",
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "durum",
        description: "Bakım modunu aç veya kapat",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "Aç", value: "on" },
          { name: "Kapat", value: "off" },
        ],
      },
    ],
  },

  async messageRun(message, args) {
    const status = args[0];
    if (!status) return message.safeReply("Lütfen bir durum belirtin: `aç` veya `kapat`.");
    
    // bot.js'deki client.isMaintenance değerini değiştiriyoruz
    const client = message.client;
    if (status === "aç") client.isMaintenance = true;
    else client.isMaintenance = false;

    return message.safeReply(`🛡️ Bakım Modu: **${client.isMaintenance ? "AÇIK" : "KAPALI"}**`);
  },

  async interactionRun(interaction) {
    const status = interaction.options.getString("durum");
    const client = interaction.client;

    if (status === "on") client.isMaintenance = true;
    else client.isMaintenance = false;

    // Botun durumunu (presence) değiştir
    client.user.setPresence({
      status: client.isMaintenance ? "dnd" : "online",
    });

    return interaction.followUp(`🛡️ Bakım Modu: **${client.isMaintenance ? "AÇIK" : "KAPALI"}**`);
  },
};