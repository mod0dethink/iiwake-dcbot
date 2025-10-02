const { Client, GatewayIntentBits } = require('discord.js');
const express = require('express');
const app = express();
app.set('trust proxy', true);

// Renderのスリープ防止用エンドポイント設定
app.get("/", (req, res) => {
  console.log(`[ACCESS] ${new Date().toISOString()} - ${req.method} from ${req.ip} (UA: ${req.get("User-Agent")})`);
  res.send("Bot is alive!");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("server running"));

// discord clientの初期化
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

require('dotenv').config();

const token = process.env.TOKEN;

// fs module
const fs = require("fs");
const DATA_FILE = "iiwake.json";

// jsonをオブジェクトに変換
let iiwakeData = {};
try {
  iiwakeData = JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
} catch (e) {
  iiwakeData = {};
}

// commandを定義
const commands = {

  // !add 指定されたユーザーの言い訳を追加
  add: async (message, args, { member, userId }) => {
    const displayName = member.nickname || member.user.username;
    const excuse = args.slice(2).join(" ");

    if (args.length < 3) {
      return message.reply("使い方: !add @ユーザー 言い訳");
    }

    if (!iiwakeData.users[userId]) {
      iiwakeData.users[userId] = { name: displayName, excuses: [] };
    }
    iiwakeData.users[userId].name = displayName;
    iiwakeData.users[userId].excuses.push(excuse);

    fs.writeFileSync(DATA_FILE, JSON.stringify(iiwakeData, null, 2), "utf-8");
    return message.reply(`「${excuse}」を${displayName}の言い訳に追加`);
  },

  // !list 指定されたユーザーの言い訳一覧を表示
  list: async (message, args, { member, userId }) => {
    const user = iiwakeData.users[userId];
    if (!user || user.excuses.length === 0) {
      return message.reply(`${user ? user.name : member.user.username}の言い訳が空です！`);
    }
    const listMessage = user.excuses.map((item, i) => `${i + 1}. ${item}`).join("\n");
    return message.reply(`${user.name}の言い訳集↓↓:\n${listMessage}`);
  },

  // !clear 引数で指定されたインデックスの言い訳を削除
  clear: async (message, args, { member, userId }) => {
    const user = iiwakeData.users[userId];
    if (!user) {
      return message.reply("そのユーザーの言い訳はまだありません");
    }
    // !clear @user all で全削除
    if(args[2] == "all"){
      user.excuses = [];
      fs.writeFileSync(DATA_FILE, JSON.stringify(iiwakeData, null, 2), "utf-8");
      return message.reply(`${user.name}の言い訳を空にしたよ！`);
    }
    // インデックス指定あり
    if (args.length >= 3) {
      const idx = parseInt(args[2], 10); // 10進数でパース
      if (isNaN(idx) || idx < 1 || idx > user.excuses.length) {
        return message.reply(`インデックスは1～${user.excuses.length}の数字で指定してください`);
      }
      const removed = user.excuses.splice(idx - 1, 1);
      fs.writeFileSync(DATA_FILE, JSON.stringify(iiwakeData, null, 2), "utf-8");
      return message.reply(`${user.name}の言い訳「${removed[0]}」を削除しました`);
    }else{
      // インデックス指定なし
      return message.reply("インデックスを指定してください。例: !clear @ユーザー 2");
    }
  }
};


client.on('clientReady', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  const guildId = process.env.guildId;
  const guild = await client.guilds.fetch(guildId);
  const members = await guild.members.fetch();
  members.forEach(member => {
    // ニックネームがあればそれを、なければユーザー名を表示
    const displayName = member.nickname || member.user.username;
    console.log(`${displayName} (${member.user.id})`);
  });
});

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  // Discordのメッセージを取得して空白区切りで配列に格納している
  const args = message.content.trim().split(/\s+/);
  // コマンド名を小文字化して先頭の!を削除
  const command = args[0].toLowerCase().replace("!", "");

  if (!commands[command]) return; // 未対応コマンドなら無視

  // 共通のユーザーバリデーション
  const userMention = args[1];
  const userIdMatch = userMention?.match(/^<@!?(\d+)>$/);
  const userId = userIdMatch ? userIdMatch[1] : null;

  if (!userId) {
    return message.reply(`使い方: !${command} @ユーザー ...(メンション形式で指定)`);
  }

  let member;
  try {
    member = await message.guild.members.fetch(userId);
  } catch {
    return message.reply("そのユーザーはサーバーに存在しません。");
  }

  // 実際のコマンドを実行
  try {
    await commands[command](message, args, { member, userId });
  } catch (err) {
    console.error(err);
    message.reply("エラーが発生しました。");
  }
});


// Botのログイン
client.login(token);