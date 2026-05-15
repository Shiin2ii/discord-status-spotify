# 🎵 Discord Lyrics Status

Tự động hiển thị **lyrics theo thời gian thực** của bài đang phát trên Spotify lên **Discord custom status**.

![demo](https://i.imgur.com/placeholder.png)

---

## ✨ Tính năng

- 🎶 Hiển thị từng dòng lyrics đúng thời điểm lên Discord custom status
- 🔍 Tự fetch lyrics từ [LRCLIB](https://lrclib.net) — miễn phí, không cần API key
- 🪟 Đọc thông tin nhạc qua Windows SMTC — không cần Spotify Premium, không cần API
- ⚡ Không bỏ sót lyrics — dùng queue để gửi tuần tự, tự retry khi bị rate limit
- 🛠️ Lần đầu chạy tự mở trình duyệt để thiết lập token

---

## 🚀 Cách dùng (dành cho người dùng)

1. Tải file `discord-lyrics-status.exe` từ trang [Releases](../../releases)
2. Double-click để chạy
3. Trình duyệt tự mở → nhập Discord User Token → nhấn **Lưu và khởi động**
4. Mở Spotify và phát nhạc — lyrics sẽ hiện trên Discord status

> Token được lưu cục bộ tại `%APPDATA%\discord-lyrics-status\config.json`, không gửi đi đâu.

### Cách lấy Discord User Token

1. Mở [discord.com/app](https://discord.com/app) trên **trình duyệt** (không phải app)
2. Nhấn `F12` → tab **Network**
3. Làm bất kỳ thao tác nào (đổi server, gửi tin nhắn...)
4. Click vào một request bất kỳ → **Request Headers** → tìm `Authorization`
5. Copy giá trị đó (không bao gồm chữ "Authorization:")

---

## 🛠️ Chạy từ source

**Yêu cầu:** Node.js 18+, Windows 10/11, Spotify desktop

```bash
git clone https://github.com/Shiin2ii/discord-status-spotify.git
cd discord-status-spotify
npm install
npm start
```

Hoặc tạo file `.env` thủ công:

```env
DISCORD_USER_TOKEN=your_discord_user_token_here
```

---

## 📦 Build thành .exe

```bash
npm install
npm run build
# → dist/discord-lyrics-status.exe
```

---

## ⚠️ Lưu ý

- Chỉ hỗ trợ **Windows** (dùng SMTC để đọc thông tin nhạc)
- Sử dụng **user token** — không phải bot token. Không chia sẻ token với ai
- Nếu muốn đổi token: xóa `%APPDATA%\discord-lyrics-status\config.json` rồi chạy lại app

---

## 📄 License

MIT
