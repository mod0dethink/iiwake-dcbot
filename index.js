const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
require('dotenv').config();

// ボットのトークンを.envファイルから取得 
const token = process.env.TOKEN;

// リストを保存する配列
let myList = [];

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(' ');
  const command = args[0].toLowerCase();

  // !add コマンド
  if (command === '!add') {
    const item = args.slice(1).join(' ');
    if (!item) {
      return message.reply('追加する内容を入力してね！');
    }
    myList.push(item);
    message.reply(`「${item}」を言い訳に追加したよ！`);
  }

  // !list コマンド
  if (command === '!list') {
    if (myList.length === 0) {
      return message.reply('言い訳が空です！');
    }
    const listMessage = myList.map((item, index) => `${index + 1}. ${item}`).join('\n');
    message.reply(`📋 言い訳一覧:\n${listMessage}`);
  }

  // !clear コマンド
  if (command === '!clear') {
    myList = [];
    message.reply('言い訳を空にしたよ！');
  }
});

client.login(token);
