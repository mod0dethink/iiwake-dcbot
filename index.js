const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
require('dotenv').config();

const token = process.env.TOKEN;

// fs module
const fs = require("fs");
const DATA_FILE = "iiwake.json";

// 言い訳データの読み込み
let iiwakeData = {};
try {
  iiwakeData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
} catch (e) {
  iiwakeData = {};
}

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('messageCreate', message => {
  if (message.author.bot) return;

  const args = message.content.trim().split(' ');
  const command = args[0].toLowerCase();

  // !add ユーザー名 言い訳
  if (command === '!add') {
    if (args.length < 3) {
      return message.reply('使い方: !add ユーザー名 言い訳');
    }
    const user = args[1];
    const excuse = args.slice(2).join(' ');

    if (!iiwakeData[user]) {
      iiwakeData[user] = [];
    }
    iiwakeData[user].push(excuse);

    // 保存
    fs.writeFileSync(DATA_FILE, JSON.stringify(iiwakeData, null, 2), "utf-8");
    message.reply(`「${excuse}」を${user}の言い訳に追加`);
  }

  // !list ユーザー名
  if (command === '!list') {
    if (args.length < 2) {
      return message.reply('使い方: !list ユーザー名');
    }
    const user = args[1];
    const excuses = iiwakeData[user] || [];
    if (excuses.length === 0) {
      return message.reply(`${user}の言い訳が空です！`);
    }
    const listMessage = excuses.map((item, index) => `${index + 1}. ${item}`).join('\n');
    message.reply(`${user}の言い訳集↓↓:\n${listMessage}`);
  }

  // !clear ユーザー名
  if (command === '!clear') {
    if (args.length < 2) {
      return message.reply('使い方: !clear ユーザー名');
    }
    const user = args[1];
    iiwakeData[user] = [];
    fs.writeFileSync(DATA_FILE, JSON.stringify(iiwakeData, null, 2), "utf-8");
    message.reply(`${user}の言い訳を空にしたよ！`);
  }
});

client.login(token);
