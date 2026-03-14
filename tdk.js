const tdk = require('tdk-sdk');

module.exports = {
    name: "tdk",
    description: "TDK'da kelime arar.",
    run: async (client, message, args) => {
        // Kullanıcı kelime yazmadıysa uyar
        const kelime = args[0];
        if (!kelime) return message.reply("Lütfen aramak istediğin kelimeyi yaz! Örnek: `!tdk araba`");

        try {
            // TDK'da kelimeyi ara
            const result = await tdk.sozlukAra(kelime);

            if (!result || !result.word) {
                return message.reply(`❌ **${kelime}** kelimesi TDK'da bulunamadı.`);
            }

            // Discord'a atılacak mesajı hazırlıyoruz
            let cevap = `📕 **Kelime:** ${result.word}\n\n`;

            if (result.means && result.means.length > 0) {
                cevap += `**Anlamlar:**\n`;
                // Sadece ilk 3 anlamı alalım ki Discord'un karakter sınırını aşmasın
                result.means.slice(0, 3).forEach((anlam, index) => {
                    cevap += `${index + 1}. ${anlam}\n`;
                });
            }

            // Mesajı Discord'a gönder
            message.reply(cevap);

        } catch (error) {
            console.error(error);
            message.reply("Kelimeyi ararken sistemsel bir hata oluştu.");
        }
    }
};