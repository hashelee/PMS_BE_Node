import jwt from "jsonwebtoken";

const extractBearerToken = (req) => {
  const authHeader = req.header("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.split(" ")[1]; // Extract the token after "Bearer"
};

export const authenticateUser = (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) return res.status(401).json({ message: "Access Denied. No Token Provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.user.role !== "user") {
      return res.status(403).json({ message: "Forbidden: User access only" });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid Token" });
  }
};

export const authenticatePharmacy = (req, res, next) => {
  const token = extractBearerToken(req);

  if (!token) return res.status(401).json({ message: "Access Denied. No Token Provided." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    if (req.user.role !== "pharmacy") {
      return res.status(403).json({ message: "Forbidden: Pharmacy access only" });
    }

    next();
  } catch (err) {
    console.log(err);
    res.status(401).json({ message: "Invalid Token" });
  }
};