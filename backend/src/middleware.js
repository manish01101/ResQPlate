import jwt from "jsonwebtoken";

const middleware = (req, res, next) => {
  const authHeaders = req.headers["authorization"];
  if (!authHeaders) {
    return res.status(401).json({ message: "header is missing" });
  }
  const token = authHeaders.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded) {
      return res
        .status(401)
        .json({ message: "error occured while verifying token" });
    }
    // console.log(decoded);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: "error occured" });
  }
};

export default middleware;
