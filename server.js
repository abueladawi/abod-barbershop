const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// تخزين الحجوزات مؤقتاً في الذاكرة
let bookings = [];

// أوقات العمل المتاحة يومياً (من 10 صباحاً حتى 8 مساءً)
const WORKING_HOURS = [
    "10:00", "10:30", "11:00", "11:30", 
    "12:00", "12:30", "13:00", "13:30", 
    "14:00", "14:30", "15:00", "15:30", 
    "16:00", "16:30", "17:00", "17:30", 
    "18:00", "18:30", "19:00", "19:30"
];

// جلب الأوقات المتاحة لتاريخ معين
app.get('/api/available-slots', (req, res) => {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'التاريخ مطلوب' });

    // معرفة الأوقات المحجوزة في هذا التاريخ
    const bookedTimes = bookings.filter(b => b.date === date).map(b => b.time);
    
    // إرجاع الأوقات الشاغرة فقط
    const availableSlots = WORKING_HOURS.filter(time => !bookedTimes.includes(time));
    res.json(availableSlots);
});

// إضافة حجز جديد
app.post('/api/bookings', (req, res) => {
    const { clientName, phone, service, date, time } = req.body;

    if (!clientName || !phone || !service || !date || !time) {
        return res.status(400).json({ message: 'جميع الحقول مطلوبة!' });
    }

    // التأكد من عدم حجز نفس الوقت مرتين
    const isAlreadyBooked = bookings.some(b => b.date === date && b.time === time);
    if (isAlreadyBooked) {
        return res.status(400).json({ message: 'هذا الوقت تم حجزه مؤخراً، اختر وقتاً آخر.' });
    }

    const newBooking = { id: Date.now(), clientName, phone, service, date, time };
    bookings.push(newBooking);

    res.json({ message: 'تم تسجل الحجز بنجاح!', booking: newBooking });
});

// جلب الحجوزات للحلاق فقط
app.get('/api/admin/bookings', (req, res) => {
    res.json(bookings);
});

// حذف حجز من قبل الحلاق
app.delete('/api/admin/bookings/:id', (req, res) => {
    const id = Number(req.params.id);
    bookings = bookings.filter(b => b.id !== id);
    res.json({ message: 'تم حذف الحجز' });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
