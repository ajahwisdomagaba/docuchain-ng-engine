// src/bot/telegramBot.ts
import { Bot } from 'grammy';

const token = process.env.TELEGRAM_BOT_TOKEN;
const isValidToken = token && token !== 'your-telegram-bot-token';

export const bot = isValidToken ? new Bot(token) : null;

export const startTelegramBot = () => {
  if (!bot) {
    console.log('⚠️ Telegram Bot Token is missing or placeholder. Bot polling skipped.');
    return;
  }

  // Define commands & handlers here if bot is initialized
  bot.command('start', (ctx) => ctx.reply('Welcome to DocuChain NG Bot!'));

  bot.start({
    onStart: () => console.log('🤖 Telegram bot active.'),
  }).catch((err) => {
    console.error('Telegram bot error:', err.message);
  });
};