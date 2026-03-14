const { ApplicationCommandOptionType } = require("discord.js");
const { cevir, diliKaydet } = require("../../../tercuman.js"); // Tercümanı ve Kaydediciyi çekiyoruz

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "dil",
  description: "Sunucunun bot dilini değiştirir (Sadece Yöneticiler).",
  category: "ADMIN",
  userPermissions: ["ManageGuild"],
  command: {
    enabled: true,
    usage: "<tr|en>",
    minArgsCount: 1,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "secim",
        description: "Sunucu için hangi dili kullanmak istiyorsunuz?",
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: "🇹🇷 Türkçe", value: "tr" },
          { name: "🇬🇧 English", value: "en" }
        ]
      }
    ],
  },

  async messageRun(message, args) {
    const secilenDil = args[0].toLowerCase();
    if (secilenDil !== "tr" && secilenDil !== "en") {
      return message.safeReply("❌ Geçerli bir dil girin / Enter a valid language: `tr` | `en`");
    }

    const response = await islemYap(message.guild.id, secilenDil);
    await message.safeReply(response);
  },

  async interactionRun(interaction) {
    const secilenDil = interaction.options.getString("secim");
    const response = await islemYap(interaction.guild.id, secilenDil);
    await interaction.followUp(response);
  },
};

// Asıl İşlemi Yapan Yer
async function islemYap(guildId, secilenDil) {
  // 1. Veritabanına Kaydet!
  const kayitBasarili = await diliKaydet(guildId, secilenDil);

  // 2. Eğer hata çıkarsa
  if (!kayitBasarili) return "❌ Veritabanına bağlanırken bir hata oluştu!";

  // 3. Başarılıysa doğru dildeki mesajı çek ve at!
  const mesaj = await cevir(guildId, "DIL_BASARILI");
  return mesaj;
}