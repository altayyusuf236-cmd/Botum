const LOG_CHANNEL_ID = "1479934586132758701"; 
const OWNER_ID = "1469310778518536265"; // ⚠️ BURAYI KESİN DEĞİŞTİR
const BOT_VERSION = "1.7"; // Full Log + Güvenli Bakım Sistemi

const updateNotes = `**Version ${BOT_VERSION} PRO Update**
- 🛡️ **Bakım Modu:** Sahip hariç tüm interaction ve mesajlar engellenir.
- 📜 **Full Logging:** Silinen/Düzenlenen mesajlar, Rol değişimleri, İsim değişimleri, Timeoutlar, Giriş-Çıkış, Banlar ve Ses logları.
- 🛠️ **Hata Onarımı:** Partials desteği ile eski mesajların silinmesi artık loglanabiliyor.
- ⚡ **Slash:** Otomatik temizleme ve yükleme sistemi optimize edildi.`;

require("dotenv").config();
require("module-alias/register");

const { EmbedBuilder, REST, Routes, ActivityType, Colors, Partials } = require('discord.js');

// Extenders
require("@helpers/extenders/Message");
require("@helpers/extenders/Guild");
require("@helpers/extenders/GuildChannel");

const { initializeMongoose } = require("@src/database/mongoose");
const { BotClient } = require("@src/structures");
const { validateConfiguration } = require("@helpers/Validator");

validateConfiguration();

// ⚠️ LOGLARIN ÇALIŞMASI İÇİN PARTIALS ŞARTTIR
const client = new BotClient({
  partials: [Partials.Message, Partials.Channel, Partials.GuildMember, Partials.User, Partials.Reaction]
});

client.logsEnabled = true; 
client.isMaintenance = false; 

// ====================================================
// 🛑 GLOBAL BAKIM MODU ENGELLEYİCİSİ
// ====================================================
const originalEmit = client.emit;
client.emit = function(event, ...args) {
    if (client.isMaintenance) {
        // Interaction Engelleme
        if (event === 'interactionCreate') {
            const i = args[0];
            if (i.user.id !== OWNER_ID) {
                if (i.isRepliable()) {
                    i.reply({ 
                        embeds: [new EmbedBuilder().setTitle("🛠️ Bakım Modu").setDescription("Bot şu an bakım aşamasındadır. Daha sonra tekrar deneyin.").setColor(Colors.Orange)], 
                        ephemeral: true 
                    }).catch(() => {});
                }
                return false;
            }
        }
        // Prefix Komut Engelleme
        if (event === 'messageCreate') {
            const m = args[0];
            const prefix = client.config?.PREFIX || "!";
            if (m.author && !m.author.bot && m.author.id !== OWNER_ID && m.content.startsWith(prefix)) {
                if (!m.content.startsWith(`${prefix}bakım`)) {
                    m.reply("🛠️ **Bot şu an bakım modunda kanka. Sadece sahibim komut kullanabilir.**").catch(() => {});
                    return false;
                }
            }
        }
    }
    return originalEmit.apply(client, [event, ...args]);
};

// ====================================================
// 🛡️ GELİŞMİŞ LOG FONKSİYONU
// ====================================================
async function sendLog(embed, type = 'info') {
    const timestamp = new Date().toLocaleTimeString('tr-TR', { hour12: false });
    const logColors = { info: '\x1b[36m', success: '\x1b[32m', warn: '\x1b[33m', error: '\x1b[31m', cmd: '\x1b[35m', reset: '\x1b[0m' };
    
    console.log(`${logColors[type] || ''}[${timestamp}] [${type.toUpperCase()}] ${embed.data?.title || 'Log'}${logColors.reset}`);

    if (!client.logsEnabled) return;
    try {
        const channel = client.channels.cache.get(LOG_CHANNEL_ID) || await client.channels.fetch(LOG_CHANNEL_ID).catch(() => null);
        if (channel) await channel.send({ embeds: [embed] }).catch(() => {});
    } catch (err) {}
}

// ====================================================
// 🛠️ BAKIM KOMUTU (Sadece Sahip)
// ====================================================
client.on('messageCreate', async m => {
    const prefix = client.config?.PREFIX || "!";
    if (m.author.id === OWNER_ID && m.content.startsWith(`${prefix}bakım`)) {
        client.isMaintenance = !client.isMaintenance;
        const status = client.isMaintenance ? "AÇILDI 🔴" : "KAPATILDI 🟢";
        client.user.setPresence({
            status: client.isMaintenance ? "dnd" : "online",
            activities: [{ name: client.isMaintenance ? "🛠️ Bakımda" : `${BOT_VERSION}`, type: ActivityType.Watching }]
        });
        await m.reply(`🛡️ **Bakım Modu ${status}**`);
        sendLog(new EmbedBuilder().setTitle("⚙️ Bakım Modu Değişti").setDescription(`Sahibi tarafından bakım modu **${status}** olarak güncellendi.`).setColor(client.isMaintenance ? Colors.Red : Colors.Green).setTimestamp(), 'warn');
    }
});

client.loadCommands("src/commands");
client.loadContexts("src/contexts");
client.loadEvents("src/events");

// ====================================================
// 🛡️ ULTRA LOG SİSTEMİ (TÜM HATALAR GİDERİLDİ)
// ====================================================

// 1. MESAJ SİLME LOGU (Partial Fix)
client.on('messageDelete', async m => {
    if (m.author?.bot) return;
    const embed = new EmbedBuilder().setTitle("🗑️ Mesaj Silindi").setColor(Colors.Red).setTimestamp()
        .addFields(
            { name: "👤 Yazar", value: m.author ? m.author.tag : "Bilinmiyor", inline: true },
            { name: "📍 Kanal", value: `<#${m.channelId}>`, inline: true },
            { name: "📝 İçerik", value: m.content?.substring(0, 1000) || "İçerik yüklenemedi (Eski mesaj)" }
        );
    if (m.attachments.size > 0) embed.addFields({ name: "📁 Ek", value: "Mesajda dosya/resim vardı." });
    await sendLog(embed, 'info');
});

// 2. MESAJ DÜZENLEME LOGU
client.on('messageUpdate', async (o, n) => {
    if (o.author?.bot || o.content === n.content) return;
    await sendLog(new EmbedBuilder().setTitle("📝 Mesaj Düzenlendi").setColor(Colors.Yellow).setTimestamp()
        .addFields(
            { name: "👤 Yazar", value: o.author ? o.author.tag : "Bilinmiyor", inline: true },
            { name: "📍 Kanal", value: `<#${o.channelId}>`, inline: true },
            { name: "⬅️ Eski", value: o.content?.substring(0, 500) || "Bilinmiyor" },
            { name: "➡️ Yeni", value: n.content?.substring(0, 500) || "Bilinmiyor" }
        ), 'info');
});

// 3. ÜYE GÜNCELLEME (ROL, NICK, TIMEOUT)
client.on('guildMemberUpdate', async (oldMember, newMember) => {
    const embed = new EmbedBuilder().setFooter({ text: newMember.user.tag }).setTimestamp();

    // Rol Logu
    if (oldMember.roles.cache.size !== newMember.roles.cache.size) {
        const added = newMember.roles.cache.filter(r => !oldMember.roles.cache.has(r.id));
        const removed = oldMember.roles.cache.filter(r => !newMember.roles.cache.has(r.id));
        embed.setTitle("🎨 Rol Güncellendi").setColor(Colors.Blue);
        if (added.size > 0) embed.addFields({ name: "✅ Verilen Rol", value: added.map(r => `<@&${r.id}>`).join(", ") });
        if (removed.size > 0) embed.addFields({ name: "❌ Alınan Rol", value: removed.map(r => `<@&${r.id}>`).join(", ") });
        return sendLog(embed, 'info');
    }

    // İsim Logu
    if (oldMember.nickname !== newMember.nickname) {
        embed.setTitle("🏷️ İsim Değişti").setColor(Colors.Cyan)
             .addFields({ name: "Eski", value: oldMember.nickname || oldMember.user.username, inline: true }, { name: "Yeni", value: newMember.nickname || newMember.user.username, inline: true });
        return sendLog(embed, 'info');
    }

    // Timeout Logu
    if (!oldMember.isCommunicationDisabled() && newMember.isCommunicationDisabled()) {
        embed.setTitle("⏳ Timeout Atıldı").setColor(Colors.DarkRed).addFields({ name: "Üye", value: `<@${newMember.id}>` }, { name: "Süre", value: `<t:${Math.floor(newMember.communicationDisabledUntilTimestamp / 1000)}:R>` });
        return sendLog(embed, 'error');
    }
});

// 4. BAN LOGLARI
client.on('guildBanAdd', async ban => {
    await sendLog(new EmbedBuilder().setTitle("🚫 Üye Yasaklandı").setDescription(`**${ban.user.tag}** sunucudan yasaklandı.`).setColor(Colors.DarkRed).setTimestamp(), 'error');
});

// 5. GİRİŞ-ÇIKIŞ LOGLARI
client.on('guildMemberAdd', async m => {
    await sendLog(new EmbedBuilder().setTitle("📥 Üye Katıldı").setDescription(`${m.user.tag} sunucuya girdi.`).setColor(Colors.Green).setTimestamp(), 'success');
});
client.on('guildMemberRemove', async m => {
    await sendLog(new EmbedBuilder().setTitle("📤 Üye Ayrıldı").setDescription(`${m.user.tag} sunucudan ayrıldı.`).setColor(Colors.Orange).setTimestamp(), 'warn');
});

// 6. SES LOGLARI
client.on('voiceStateUpdate', (o, n) => {
    if (!o.channelId && n.channelId) sendLog(new EmbedBuilder().setTitle("🎤 Sese Bağlandı").setDescription(`${n.member.user.tag} -> <#${n.channelId}> kanalına girdi.`).setColor(Colors.Green), 'info');
    else if (o.channelId && !n.channelId) sendLog(new EmbedBuilder().setTitle("🎤 Sesten Ayrıldı").setDescription(`${o.member.user.tag} -> <#${o.channelId}> kanalından çıktı.`).setColor(Colors.Red), 'info');
});

// ====================================================
// 🚀 READY EVENT
// ====================================================
client.once('ready', async () => {
    console.log(`\x1b[32m[✅] Bot ${client.user.tag} olarak giriş yaptı!\x1b[0m`);
    
    const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);
    try {
        const commandData = [];
        client.commands.forEach(cmd => {
            if (cmd.slashCommand?.enabled) commandData.push(cmd.slashCommand.data.toJSON());
        });
        await rest.put(Routes.applicationCommands(client.user.id), { body: commandData });
        console.log(`\x1b[32m[✅] ${commandData.length} Slash komutu yüklendi.\x1b[0m`);
    } catch (err) { console.error(err); }

    const channel = client.channels.cache.get(LOG_CHANNEL_ID);
    if (channel) channel.send({ embeds: [new EmbedBuilder().setTitle("🚀 Bot Aktif!").setDescription(updateNotes).setColor(Colors.Green).setTimestamp()] }).catch(() => {});
});

// ... (üstteki log ve event kısımları aynı kalsın)

(async () => {
  try {
      console.log('\x1b[36m[🔄] Başlatma işlemi başlıyor...\x1b[0m');
      
      // MongoDB'yi her halükarda bağla
      await initializeMongoose();
      console.log('\x1b[32m[✅] MongoDB bağlantısı başarılı!\x1b[0m');

      // Dashboard'u başlat (Render Portunu bu kullanacak)
      if (client.config.DASHBOARD.enabled) {
          console.log('\x1b[36m[🌐] Dashboard hazırlanıyor...\x1b[0m');
          const { launch } = require("@root/dashboard/app");
          await launch(client); // Dashboard burada çalışacak ve Port scanning hatasını çözecek
      } else {
          // Eğer dashboard kapalıysa Render hata vermesin diye boş bir server aç
          const express = require('express');
          const dummyApp = express();
          dummyApp.get('/', (req, res) => res.send('Bot Aktif (Dashboard Kapalı)'));
          dummyApp.listen(process.env.PORT || 3000);
      }
      
      console.log('\x1b[36m[🔑] Discord API\'ye bağlanılıyor...\x1b[0m');
      await client.login(process.env.BOT_TOKEN);
      
  } catch (error) {
      console.error('\x1b[31m[🚨] Kritik Başlatma Hatası:\x1b[0m', error);
      process.exit(1);
  }
})();