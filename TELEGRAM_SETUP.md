# Telegram Setup Guide

This guide will walk you through setting up Telegram Cloud Storage for Oxygen.

## Prerequisites

- A Telegram account
- Access to a Telegram client (mobile app, desktop app, or web)

## Step 1: Create a Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Start a conversation with BotFather by clicking `/start`
3. Send the command `/newbot`
4. Follow the prompts:
   - Choose a name for your bot (e.g., "Oxygen Storage Bot")
   - Choose a username for your bot (must end in `bot`, e.g., `oxygen_storage_bot`)
5. BotFather will provide you with a **bot token** that looks like:
   ```
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
6. **Save this token** - you'll need it for the `TELEGRAM_BOT_TOKEN` environment variable

## Step 2: Create a Private Channel or Group

You have two options:

### Option A: Private Channel (Recommended for Storage)

1. In Telegram, click the menu (☰) and select **"New Channel"**
2. Choose a name for your channel (e.g., "Oxygen Video Storage")
3. Set it to **Private**
4. Add yourself as a member
5. You can add the bot later

### Option B: Private Group (Alternative)

1. In Telegram, click the menu (☰) and select **"New Group"**
2. Choose a name for your group (e.g., "Oxygen Storage")
3. Add yourself as a member
4. Set it to **Private**

## Step 3: Add Bot to Channel/Group

1. Open your channel/group
2. Click on the channel/group name at the top
3. Select **"Administrators"** or **"Add Members"**
4. Search for your bot by its username (e.g., `@oxygen_storage_bot`)
5. Add the bot
6. **Important**: Make the bot an **Administrator** with the following permissions:
   - ✅ Post Messages
   - ✅ Edit Messages
   - ✅ Delete Messages
   - ✅ Manage Messages (optional, but recommended)

## Step 4: Get Chat ID

You need to get the Chat ID of your channel/group. There are several methods:

### Method 1: Using @userinfobot (Easiest)

1. Add **@userinfobot** to your channel/group
2. The bot will automatically send a message with the chat ID
3. The chat ID will be a negative number (e.g., `-1001234567890`)
4. **Save this number** - you'll need it for the `TELEGRAM_CHAT_ID` environment variable

### Method 2: Using Telegram API

1. Send a message to your channel/group
2. Visit this URL in your browser (replace `YOUR_BOT_TOKEN` with your actual bot token):
   ```
   https://api.telegram.org/botYOUR_BOT_TOKEN/getUpdates
   ```
3. Look for the `chat` object in the response
4. Find the `id` field - this is your chat ID

### Method 3: Using @RawDataBot

1. Add **@RawDataBot** to your channel/group
2. The bot will send you the raw data including the chat ID

## Step 5: Optional - Create Separate Database Channel

For better organization, you can create a separate channel/group for database files:

1. Follow Steps 2-4 to create another private channel/group
2. Name it something like "Oxygen Database"
3. Add your bot as an administrator
4. Get the chat ID using one of the methods above
5. Use this for the `TELEGRAM_DB_CHAT_ID` environment variable

If you don't set `TELEGRAM_DB_CHAT_ID`, it will use the same channel as `TELEGRAM_CHAT_ID`.

## Step 6: Configure Environment Variables

Add the following environment variables to your `.env.local` file (for local development) and Vercel (for production):

```env
# Telegram Bot Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_DB_CHAT_ID=your_db_chat_id_here  # Optional, defaults to TELEGRAM_CHAT_ID
```

### For Local Development (.env.local)

Create or edit `.env.local` in the `web` directory:

```bash
cd web
nano .env.local  # or use your preferred editor
```

Add the environment variables above.

### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add each variable:
   - `TELEGRAM_BOT_TOKEN`
   - `TELEGRAM_CHAT_ID`
   - `TELEGRAM_DB_CHAT_ID` (optional)

## Step 7: Test the Setup

### Test Upload

1. Start your development server:
   ```bash
   cd web
   npm run dev
   ```

2. The bot should automatically initialize when the server starts
3. Try uploading a file through your application
4. Check your Telegram channel/group - you should see the file appear

### Test Download

1. Try downloading a file that was uploaded
2. The file should be accessible through the application

## Troubleshooting

### Bot Not Responding

- **Check bot token**: Make sure `TELEGRAM_BOT_TOKEN` is correct
- **Check bot permissions**: Ensure the bot is an administrator with proper permissions
- **Check chat ID**: Verify `TELEGRAM_CHAT_ID` is correct (should be negative for groups/channels)

### Files Not Appearing

- **Check bot permissions**: Bot needs "Post Messages" permission
- **Check chat ID**: Make sure you're using the correct chat ID
- **Check logs**: Look for error messages in your server logs

### "Chat not found" Error

- **Verify chat ID**: The chat ID must be correct
- **Check bot membership**: The bot must be added to the channel/group
- **Check permissions**: The bot must have admin permissions

### "Unauthorized" Error

- **Verify bot token**: The token must be correct and active
- **Check token format**: Should be `numbers:letters` format

## Security Best Practices

1. **Never commit tokens**: Never commit `.env.local` or environment variables to git
2. **Use private channels**: Always use private channels/groups for storage
3. **Limit bot permissions**: Only give the bot the minimum permissions needed
4. **Rotate tokens**: If a token is compromised, revoke it in BotFather and create a new one
5. **Monitor usage**: Regularly check your channel/group for unexpected files

## Additional Resources

- [Telegram Bot API Documentation](https://core.telegram.org/bots/api)
- [BotFather Commands](https://core.telegram.org/bots#6-botfather)
- [Telegram API Getting Started](https://core.telegram.org/api)

## Next Steps

After setting up Telegram storage, you can also configure Streamtape storage for additional redundancy. See the main README for Streamtape setup instructions.

