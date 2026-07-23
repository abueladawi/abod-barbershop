
const express = require('express');
const path = require('path');
const app = express();
const PORT = 3000;

// Middleware للقراءة من البيانات المرسلة بتنسيق JSON والـ Form
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// مشاركة الملفات الثابتة (مثل ملف HTML)
app.use(express.static(path.join(__dirname, 'public')));

// قائمة المواعيد (في الذاكرة)
let bookings = [];

// API للحصول على كل الحجوزات
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

// API لإضافة حجز جديد
app.post('/api/bookings', (req, res) => {
    const { clientName, phone, service, date, time } = req.body;

    if (!clientName || !phone || !date || !time) {
        return res.status(400).json({ message: 'الرجاء تعبئة جميع الحقول المطلوبة' });
    }

    // التحقق من تعارض المواعيد
    const exists = bookings.some(b => b.date === date && b.time === time);
    if (exists) {
        return res.status(400).json({ message: 'هذا الموعد محجوز بالكامل، اختر وقتاً آخر!' });
    }

    const newBooking = {
        id: Date.now(),
        clientName,
        phone,
        service: service || 'حلاقة شعر',
        date,
        time
    };

    bookings.push(newBooking);
    res.status(201).json({ message: 'تم حجز الموعد بنجاح!', booking: newBooking });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});