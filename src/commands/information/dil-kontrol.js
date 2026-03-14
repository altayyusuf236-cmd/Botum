const { cevir } = require("../../../tercuman.js"); // Klasör derinliğine göre noktaları ayarla

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "dil-kontrol",
  description: "Sunucunun şu anki bot dilini gösterir / Shows the current bot language.",
  category: "INFORMATION", // Herkes kullanabilir
  command: {
    enabled: true,
    aliases: ["dilnedir", "language"],
    usage: "",
    minArgsCount: 0,
  },
  slashCommand: {
    enabled: true,
  },

  // 1. NORMAL KULLANIM (!dil-kontrol)
  async messageRun(message, args) {
    // Tercümandan direkt o sunucuya ait mesajı çekiyoruz!
    const cevap = await cevir(message.guild.id, "DIL_KONTROL");
    await message.safeReply(cevap);
  },

  // 2. SLASH KULLANIMI (/dil-kontrol)
  async interactionRun(interaction) {
    const cevap = await cevir(interaction.guild.id, "DIL_KONTROL");
    await interaction.followUp(cevap);
  },
};