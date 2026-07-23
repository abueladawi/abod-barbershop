const express = require('express');
const path = require('path');
const https = require('https');
const app = express();
const PORT = process.env.PORT || 3000;

// بيانات تلغرام الخاصة بك
const TELEGRAM_TOKEN = "8845074713:AAGm4fMg5mAwQK_AHAnLlz6vvh8RLier8eY"; 
const TELEGRAM_CHAT_ID = "7733816137"; 

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let bookings = [];

const WORKING_HOURS = [
    "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30", 
    "16:00", "16:30", "17:00", "17:30", 
    "18:00", "18:30", "19:00", "19:30"
];

app.get('/api/available-slots', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'التاريخ مطلوب' });

    const bookedTimes = bookings.filter(b => b.date === date).map(b => b.time);
    const availableSlots = WORKING_HOURS.filter(time => !bookedTimes.includes(time));
    res.json(availableSlots);
});

app.post('/api/bookings', (req, res) => {
    const { clientName, phone, service, date, time } = req.body;

    if (!clientName || !phone || !service || !date || !time) {
        return res.status(400).json({ message: 'جميع الحقول مطلوبة!' });
    }

    const isAlreadyBooked = bookings.some(b => b.date === date && b.time === time);
    if (isAlreadyBooked) {
        return res.status(400).json({ message: 'هذا الوقت تم حجزه مؤخراً، اختر وقتاً آخر.' });
    }

    const newBooking = { id: Date.now(), clientName, phone, service, date, time };
    bookings.push(newBooking);

    // إرسال إشعار فوري إلى تلغرام بطريقة مضمونة 100%
    const messageText = encodeURIComponent(
        `✂️ *حجز جديد في الصالون!*\n\n` +
        `👤 *الاسم:* ${clientName}\n` +
        `📞 *الهاتف:* ${phone}\n` +
        `💈 *الخدمة:* ${service}\n` +
        `📅 *التاريخ:* ${date}\n` +
        `⏰ *الوقت:* ${time}`
    );

    const telegramUrl = `https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage?chat_id=${TELEGRAM_CHAT_ID}&text=${messageText}&parse_mode=Markdown`;

    https.get(telegramUrl, (apiRes) => {
        console.log('Telegram response status:', apiRes.statusCode);
    }).on('error', (e) => {
        console.error('Error sending Telegram message:', e);
    });

    res.json({ message: 'تم تسجيل الحجز بنجاح!', booking: newBooking });
});

app.get('/api/admin/bookings', (req, res) => {
    res.json(bookings);
});

app.delete('/api/admin/bookings/:id', (req, res) => {
    const id = Number(req.params.id);
    bookings = bookings.filter(b => b.id !== id);
    res.json({ message: 'تم حذف الحجز' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
