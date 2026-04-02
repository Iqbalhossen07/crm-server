const Payment = require("../../models/admin/Payment");

// @desc    Update Payment Status
// @route   PUT /api/admin/payments/:id/status
exports.updatePaymentStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true },
    );

    if (!payment)
      return res
        .status(404)
        .json({ success: false, error: "Payment not found" });

    res
      .status(200)
      .json({ success: true, data: payment, message: "Status updated!" });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
