<div align="center">

# 🎵 Discord Lyrics Status

**Hiển thị lyrics Spotify theo thời gian thực lên Discord custom status của bạn.**

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows-lightgrey.svg)]()
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-green.svg)]()

**Ngôn ngữ:** [English](README.md) · Tiếng Việt

[Tải về](#-tải-về) · [Cách hoạt động](#️-cách-hoạt-động) · [Chạy từ source](#️-chạy-từ-source) · [Build](#-build-exe)

</div>

---

## Giới thiệu

Discord Lyrics Status đọc thông tin bài đang phát từ Spotify qua Windows System Media Transport Controls (SMTC), tự động tìm và tải lyrics có timestamp từ [LRCLIB](https://lrclib.net), rồi cập nhật Discord custom status từng dòng — đúng thời điểm với nhạc.

Không cần Spotify API. Không cần Spotify Premium. Chỉ cần Discord User Token là xài được.

---

## ✨ Tính năng

- **Lyrics realtime** — mỗi dòng hiện đúng thời điểm theo file LRC
- **Không cần cấu hình** — lần đầu chạy tự mở trình duyệt để nhập token
- **Không bỏ sót dòng nào** — dùng queue tuần tự, tự retry khi bị rate limit
- **Không cần cài thêm gì** — phân phối dưới dạng file `.exe` standalone
- **Lyrics miễn phí** — [LRCLIB](https://lrclib.net), không cần API key
- **Không cần Spotify API** — đọc playback qua Windows SMTC, dùng được với tài khoản free

---

## 📥 Tải về

Vào trang [**Releases**](../../releases) và tải file `discord-lyrics-status.exe`.

> Yêu cầu Windows 10 hoặc 11. Không cần cài thêm phần mềm nào.

---

## 🚀 Bắt đầu nhanh

1. **Tải** `discord-lyrics-status.exe` từ trang [Releases](../../releases)
2. **Chạy** file `.exe` — lần đầu trình duyệt sẽ tự mở
3. **Nhập Discord User Token** rồi nhấn *Lưu và khởi động*
4. **Phát nhạc** trên Spotify — lyrics sẽ hiện lên Discord status theo thời gian thực

Token của bạn được lưu cục bộ tại `%APPDATA%\discord-lyrics-status\config.json`, không gửi đi đâu ngoài API của Discord.

---

## 🔑 Lấy Discord User Token

> **Cảnh báo:** User token cho phép truy cập toàn bộ tài khoản Discord của bạn. Không chia sẻ với bất kỳ ai.

1. Mở [discord.com/app](https://discord.com/app) trên **trình duyệt** (không phải app desktop)
2. Nhấn `F12` mở DevTools → vào tab **Network**
3. Thực hiện bất kỳ thao tác nào (đổi server, gửi tin nhắn...)
4. Click vào một request bất kỳ → **Request Headers** → tìm header `Authorization`
5. Copy giá trị đó — đó là user token của bạn

---

## ⚙️ Cách hoạt động

```
Spotify (desktop)
      │
      ▼
Windows SMTC          ← đọc tên bài, nghệ sĩ, vị trí phát
      │
      ▼
LRCLIB API            ← tải lyrics có timestamp (miễn phí, không cần key)
      │
      ▼
LyricScheduler        ← fire từng dòng đúng thời điểm bằng setTimeout
      │
      ▼
Discord PATCH API     ← cập nhật custom status, queue & retry khi rate limit
```

---

## 🛠️ Chạy từ source

**Yêu cầu:** Node.js 18+, Windows 10/11, Spotify desktop app

```bash
git clone https://github.com/Shiin2ii/discord-status-spotify.git
cd discord-status-spotify
npm install
npm start
```

Hoặc tạo file `.env` để bỏ qua bước setup trên trình duyệt:

```env
DISCORD_USER_TOKEN=your_discord_user_token_here
```

---

## 📦 Build `.exe`

Tạo file executable standalone với Node.js được bundle bên trong — máy đích không cần cài Node.js.

```bash
npm install
npm run build
# Output: dist/discord-lyrics-status.exe
```

---

## 🗂️ Cấu trúc project

```
src/
├── index.js       — vòng lặp chính, poll & điều phối
├── spotify.js     — đọc playback từ Windows SMTC qua PowerShell
├── lyrics.js      — fetch & cache lyrics từ LRCLIB
├── scheduler.js   — fire từng dòng lyrics đúng thời điểm
├── status.js      — cập nhật Discord custom status (queue + retry)
├── config.js      — đọc/ghi token từ AppData
└── setup.js       — UI setup lần đầu trên trình duyệt (Express)
build.mjs          — build script dùng esbuild + pkg
```

---

## ❓ FAQ

**Có cần Spotify Premium không?**
Không. App đọc từ Windows SMTC, không dùng Spotify API.

**Dùng cái này có bị ban Discord không?**
Dùng user token vi phạm ToS của Discord. Tự chịu trách nhiệm khi sử dụng.

**Làm sao đổi token?**
Xóa file `%APPDATA%\discord-lyrics-status\config.json` rồi chạy lại app.

**Không thấy lyrics / lyrics sai?**
LRCLIB có thể chưa có bài đó. App sẽ hiển thị tên bài và nghệ sĩ thay thế.

---

## 📄 Giấy phép

[MIT](LICENSE) © [Shiin2ii](https://github.com/Shiin2ii)
