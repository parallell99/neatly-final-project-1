// middlewares/withMethod.js

/**
 * withMethod
 * จำกัด HTTP method ที่อนุญาตให้ใช้ใน route
 *
 * @param {string|string[]} allowedMethods - method ที่อนุญาต
 * @param {Function} handler - route handler
 */
export function withMethod(allowedMethods, handler) {
    const methods = Array.isArray(allowedMethods)
      ? allowedMethods.map((m) => m.toUpperCase())
      : [allowedMethods.toUpperCase()];
  
    return async function methodMiddleware(req, res) {
      const requestMethod = req.method?.toUpperCase();
  
      if (!methods.includes(requestMethod)) {
        res.setHeader("Allow", methods);
        return res.status(405).json({
          error: "Method Not Allowed",
          allowedMethods: methods,
        });
      }
  
      return handler(req, res);
    };
  }