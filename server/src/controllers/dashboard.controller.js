import { getDashboardStats } from "../services/dashboard.service.js";

export const getStats = async (req, res, next) => {
  try {
    const stats = await getDashboardStats(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        stats,
      },
    });
  } catch (error) {
    next(error);
  }
};