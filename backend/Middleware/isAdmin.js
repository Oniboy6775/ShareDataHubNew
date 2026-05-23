const isAdmin = (req, res, next) => {
  const adminId = process.env.ADMIN_ID;
  if (!adminId || req.user?.userId !== adminId) {
    return res.status(403).json({ msg: "Access denied. Admins only." });
  }
  next();
};

module.exports = isAdmin;
