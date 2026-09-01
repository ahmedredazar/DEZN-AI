DEZN AI — STANDALONE WEBSITE

ده موقع مستقل بالكامل، مش صفحة داخل موقع DEZN القديم.

الملفات الرئيسية:
- index.html       واجهة الموقع
- assets/          CSS + JavaScript + لوجو DEZN
- server.js        Backend واتصال OpenAI
- .env             مفتاح API
- package.json

التشغيل:
1. افتح Terminal داخل مجلد المشروع.
2. npm install
3. انسخ .env.example إلى .env
4. ضع مفتاحك:
   OPENAI_API_KEY=YOUR_KEY
5. npm start
6. افتح http://localhost:3000

يمكن رفع المشروع على استضافة تدعم Node.js ليصبح موقعًا مستقلًا بدومين خاص.
لا تضع API Key داخل assets/app.js.
