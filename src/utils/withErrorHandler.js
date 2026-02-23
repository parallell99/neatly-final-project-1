export function withErrorHandler(handler) {
    return async function (req, res) {
      try {
        await handler(req, res);
      } catch (error) {
        console.error("GLOBAL ERROR:", error);
  
        return res.status(error.status || 500).json({
          error: error.message,
          details: error.details || null,
        });
      }
    };
  }