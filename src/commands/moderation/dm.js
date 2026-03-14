const { ApplicationCommandOptionType } = require("discord.js");

/**
 * @type {import("@structures/Command")}
 */
module.exports = {
  name: "dm",
  description: "Belirtilen kullanıcıya bot üzerinden özel mesaj gönderir.",
  category: "ADMIN",
  botPermissions: ["SendMessages"],
  userPermissions: ["Administrator"], // Sadece yöneticiler kullanabilir
  command: {
    enabled: true,
    usage: "<ID|@kullanıcı> <mesaj>",
    minArgsCount: 2,
  },
  slashCommand: {
    enabled: true,
    options: [
      {
        name: "kullanici",
        description: "Mesajın gönderileceği kişi",
        type: ApplicationCommandOptionType.User,
        required: true,
      },
      {
        name: "mesaj",
        description: "Gönderilecek mesaj",
        type: ApplicationCommandOptionType.String,
        required: true,
      },
    ],
  },

  // PREFIX İLE KULLANIM (!dm @kisi naber)
  async messageRun(message, args) {
    // Kullanıcıyı bul
    const target = await message.guild.resolveMember(args[0], true);
    if (!target) return message.safeReply(`❌ Kullanıcı bulunamadı: ${args[0]}`);

    // Mesajı birleştir
    const dmMessage = args.slice(1).join(" ");

    try {
      await target.user.send(`🔔 **${message.guild.name}** sunucusundan bir mesajın var:\n\n${dmMessage}`);
      await message.safeReply(`✅ Mesaj başarıyla **${target.user.username}** adlı kullanıcıya gönderildi!`);
    } catch (error) {
      await message.safeReply(`❌ **${target.user.username}** adlı kullanıcının DM kutusu kapalı! Mesaj gönderilemedi.`);
    }
  },

  // SLASH İLE KULLANIM (/dm kullanici: @kisi mesaj: naber)
  async interactionRun(interaction) {
    const user = interaction.options.getUser("kullanici");
    const dmMessage = interaction.options.getString("mesaj");

    try {
      await user.send(`🔔 **${interaction.guild.name}** sunucusundan bir mesajın var:\n\n${dmMessage}`);
      // Senin botun altyapısı otomatik beklemeye alıyor, o yüzden followUp kullanıyoruz
      await interaction.followUp(`✅ Mesaj başarıyla **${user.username}** adlı kullanıcıya gönderildi!`);
    } catch (error) {
      await interaction.followUp(`❌ **${user.username}** adlı kullanıcının DM kutusu kapalı! Mesaj gönderilemedi.`);
    }
  },
};