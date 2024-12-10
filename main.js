const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const token = process.env.BOT_TOKEN;
const bot = new TelegramBot(token, { polling: true });
const adminChatId = process.env.ADMIN_CHAT_ID;

let userState = {};

bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '👋 Привіт! Як до тебе звертатись? 😊');
  userState[chatId] = { step: 'name' };
});

bot.on('message', (msg) => {
  const chatId = msg.chat.id;

  if (userState[chatId] && userState[chatId].step) {
    switch (userState[chatId].step) {
      case 'name':
        const userName = msg.chat.username || msg.chat.first_name;
        userState[chatId].name = userName;

        bot.sendMessage(chatId, '📱 Тепер, якщо хочеш, поділися своїми контактами, або напиши "Пропустити", щоб продовжити без контактів:', {
          reply_markup: {
            keyboard: [
              [{ text: '📞 Надіслати контакт', request_contact: true }],
              [{ text: 'Пропустити' }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });

        userState[chatId].step = 'contacts';
        break;

      case 'contacts':
        if (msg.contact) {
          userState[chatId].contacts = msg.contact.phone_number;
          bot.sendMessage(chatId, 'Дякую! 🙌 Яке питання ти хочеш поставити? ✍️');
        } else if (msg.text.toLowerCase() === 'пропустити') {
          bot.sendMessage(chatId, 'Окей, давай без контактів! 💬 Яке питання ти хочеш поставити?');
        } else {
          bot.sendMessage(chatId, '❗ Будь ласка, скористайтеся кнопкою для надсилання контакту або натисни "Пропустити".');
        }
        
        userState[chatId].step = 'question';
        break;

      case 'question':
        userState[chatId].question = msg.text;

        bot.sendMessage(
            adminChatId,
            `🔔 Нове питання від *@${userState[chatId].name}*!\n📞 Контакти: ${userState[chatId].contacts || 'Не надано'}\n❓ Питання: ${userState[chatId].question}`,
            { parse_mode: 'Markdown' }
        );

        bot.sendMessage(chatId, 'Дякую! 🙏 Я передав твоє запитання) 💬');

        delete userState[chatId];
        break;

      default:
        bot.sendMessage(chatId, '⚠️ Будь ласка, напиши /start, щоб розпочати заново.');
        break;
    }
  }
});
