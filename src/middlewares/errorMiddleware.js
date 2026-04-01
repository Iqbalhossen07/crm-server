const errorHandler = (err, req, res, next) => {
  // ডেভেলপার কনসোলে লাল রঙে এরর প্রিন্ট হবে
  console.log(err.stack.red || err.stack);

  // সরাসরি err থেকে statusCode এবং message নিন
  const statusCode = err.statusCode || 500;
  const message = err.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    error: message, // ফ্রন্টএন্ড এই 'error' কি-টাই খুঁজবে
  });
};

module.exports = errorHandler;
