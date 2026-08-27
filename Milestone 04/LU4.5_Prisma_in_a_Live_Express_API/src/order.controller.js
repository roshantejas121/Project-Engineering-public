const prisma = require('./lib/db');

function parseId(value) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function apiError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

async function purchaseItem(req, res) {
  const userId = parseId(req.body.userId);
  const productId = parseId(req.body.productId);

  if (!userId || !productId) {
    return res.status(400).json({
      error: 'userId and productId must be positive integers',
    });
  }

  try {
    const [user, product] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId } }),
      prisma.product.findUnique({ where: { id: productId } }),
    ]);

    if (!user) {
      throw apiError('User not found', 404);
    }

    if (!product) {
      throw apiError('Product not found', 404);
    }

    if (product.stock < 1) {
      throw apiError('Product is out of stock', 409);
    }

    const [order] = await prisma.$transaction([
      prisma.order.create({
        data: { userId, productId, quantity: 1 },
      }),
      prisma.product.update({
        where: { id: productId },
        data: { stock: { decrement: 1 } },
      }),
    ]);

    return res.status(201).json({ order });
  } catch (err) {
    return res.status(err.statusCode || 500).json({ error: err.message });
  }
}

async function getOrdersByUser(req, res) {
  const userId = parseId(req.params.userId);

  if (!userId) {
    return res.status(400).json({ error: 'User id must be a positive integer' });
  }

  try {
    const orders = await prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return res.json(orders);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = { purchaseItem, getOrdersByUser };
