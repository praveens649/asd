export const errorHandler = (err, req, res, next) => {
  console.error(err);

  if (err.code === "P2002") {
    return res.status(409).json({
      success: false,
      message: "A record with this value already exists",
    });
  }

  if (err.code === "P2025") {
    return res.status(404).json({
      success: false,
      message: "Record not found",
    });
  }

  const statusCode = err.statusCode || 500;

  return res.status(statusCode).json({
    success: false,
    message:
      statusCode === 500
        ? "Internal server error"
        : err.message,
  });
};