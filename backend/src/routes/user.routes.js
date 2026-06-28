const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middlewares/auth.middleware');
const bcrypt = require('bcryptjs');
const prisma = require('../config/prisma');
const { decryptOrderTickets, decryptTickets } = require('../utils/privacy');

router.get('/me', authenticate, async (req, res) => {
  const user = { ...req.user };
  delete user.passwordHash;
  res.json({ success: true, data: user });
});

router.put('/me', authenticate, async (req, res, next) => {
  try {
    const { fullName, dateOfBirth, avatarUrl, phone, companyName, hotline, licenseNumber, address, email } = req.body;
    
    const isCustomer = !!req.user.customer?.id;
    const isOperator = !!req.user.busOperator?.id;
    const isStaff = !!req.user.staff?.id;
    const isAdmin = !!req.user.admin?.id;

    if (phone !== undefined && phone !== '' && typeof phone !== 'string') {
      return res.status(400).json({ success: false, message: 'So dien thoai khong hop le.' });
    }

    const transactions = [];

    if (phone !== undefined) {
      transactions.push(
        prisma.user.update({
          where: { id: req.user.id },
          data: { phone: phone === '' ? null : phone },
        })
      );
    }

    if (email !== undefined) {
      if (email !== '') {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing && existing.id !== req.user.id) {
          return res.status(400).json({ success: false, message: 'Email đã được sử dụng bởi tài khoản khác.' });
        }
      }
      transactions.push(
        prisma.user.update({
          where: { id: req.user.id },
          data: { email: email === '' ? null : email },
        })
      );
    }

    if (isCustomer) {
      if (fullName !== undefined && (!String(fullName).trim() || String(fullName).length > 100)) {
        return res.status(400).json({ success: false, message: 'Ho ten khong hop le.' });
      }
      const parsedDateOfBirth = dateOfBirth ? new Date(dateOfBirth) : undefined;
      transactions.push(
        prisma.customer.update({
          where: { userId: req.user.id },
          data: { fullName, dateOfBirth: parsedDateOfBirth, avatarUrl },
        })
      );
    } else if (isOperator) {
      if (companyName !== undefined && (!String(companyName).trim() || String(companyName).length > 100)) {
        return res.status(400).json({ success: false, message: 'Ten cong ty khong hop le.' });
      }
      transactions.push(
        prisma.busOperator.update({
          where: { userId: req.user.id },
          data: { companyName, hotline, licenseNumber, address },
        })
      );
    } else if (isStaff) {
      if (fullName !== undefined && (!String(fullName).trim() || String(fullName).length > 100)) {
        return res.status(400).json({ success: false, message: 'Ho ten khong hop le.' });
      }
      transactions.push(
        prisma.staff.update({
          where: { userId: req.user.id },
          data: { fullName, address },
        })
      );
    } else if (isAdmin) {
      if (fullName !== undefined && (!String(fullName).trim() || String(fullName).length > 100)) {
        return res.status(400).json({ success: false, message: 'Ho ten khong hop le.' });
      }
      transactions.push(
        prisma.admin.update({
          where: { userId: req.user.id },
          data: { fullName },
        })
      );
    }

    await prisma.$transaction(transactions);

    const updated = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { 
        customer: true, 
        busOperator: true,
        staff: true,
        admin: true,
        userRoles: { include: { role: true } } 
      },
    });

    const data = { ...updated };
    delete data.passwordHash;
    res.json({ success: true, message: 'Cap nhat thong tin thanh cong.', data });
  } catch (err) { next(err); }
});

router.put('/me/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mat khau moi phai co it nhat 6 ky tu.' });
    }
    const valid = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!valid) return res.status(400).json({ success: false, message: 'Mat khau hien tai khong dung.' });
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ success: true, message: 'Doi mat khau thanh cong.' });
  } catch (err) { next(err); }
});

router.get('/me/tickets', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Chi khach hang moi co the xem ve ca nhan.' });
    }
    const tickets = await prisma.ticketDetail.findMany({
      where: { order: { customerId } },
      include: {
        tripSeat: { include: { trip: { include: { route: true } }, seatLayout: true } },
        order: true,
        review: { select: { id: true, rating: true, isApproved: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, data: decryptTickets(tickets) });
  } catch (err) { next(err); }
});

router.get('/me/locked-seats', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) return res.status(403).json({ success: false, message: 'Chỉ khách hàng mới có ghế đang giữ.' });
    const lockedSeats = await prisma.tripSeat.findMany({
      where: {
        lockedBy: customerId,
        status: 'PROCESSING',
        lockExpiresAt: { gt: new Date() }
      },
      include: {
        trip: { include: { route: true, vehicle: true } },
        seatLayout: true
      },
      orderBy: { lockedAt: 'desc' },
    });
    res.json({ success: true, data: lockedSeats });
  } catch (err) { next(err); }
});

router.get('/me/invoices', authenticate, authorize('CUSTOMER'), async (req, res, next) => {
  try {
    const customerId = req.user.customer?.id;
    if (!customerId) {
      return res.status(403).json({ success: false, message: 'Chi khach hang moi co the xem hoa don.' });
    }

    const invoices = await prisma.order.findMany({
      where: { customerId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            method: true,
            gateway: true,
            gatewayTxnId: true,
            status: true,
            amount: true,
            paidAt: true,
            refundedAt: true,
            refundAmount: true,
            createdAt: true,
          },
        },
        ticketDetails: {
          include: {
            tripSeat: {
              include: {
                seatLayout: { select: { seatCode: true, floor: true } },
                trip: {
                  include: {
                    route: {
                      include: {
                        operator: { select: { id: true, companyName: true, hotline: true } },
                      },
                    },
                    vehicle: {
                      select: {
                        id: true,
                        licensePlate: true,
                        vehicleType: { select: { name: true, seatCount: true } },
                      },
                    },
                  },
                },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ success: true, data: invoices.map(decryptOrderTickets) });
  } catch (err) { next(err); }
});

router.delete('/me', authenticate, async (req, res, next) => {
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: req.user.id },
        select: { customer: { select: { id: true } } },
      });

      if (user?.customer?.id) {
        await tx.customer.update({
          where: { id: user.customer.id },
          data: {
            fullName: 'Anonymized user',
            dateOfBirth: null,
            avatarUrl: null,
          },
        });
        await tx.ticketDetail.updateMany({
          where: { order: { customerId: user.customer.id } },
          data: { passengerName: 'Anonymized passenger', passengerPhone: null },
        });
        await tx.review.updateMany({
          where: { customerId: user.customer.id },
          data: { comment: null },
        });
      }

      await tx.auditLog.updateMany({
        where: { userId: req.user.id },
        data: { ipAddress: null, userAgent: null, details: null },
      });

      await tx.user.update({
        where: { id: req.user.id },
        data: {
          isActive: false,
          isAnonymized: true,
          email: null,
          phone: null,
          passwordHash: 'ANONYMIZED',
        },
      });
    });
    res.json({ success: true, message: 'Tai khoan da duoc xoa.' });
  } catch (err) { next(err); }
});

module.exports = router;
