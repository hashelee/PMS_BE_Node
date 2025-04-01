export const authenticateUser = (req, res, next) => {
    const token = req.header("Authorization");
    if (!token) return res.status(401).json({ message: "Access Denied. No Token Provided." });
  
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
  
      if (req.path.includes("/pharmacy") && req.user.role !== "pharmacy") {
        return res.status(403).json({ message: "Forbidden: Pharmacy access only" });
      }
  
      if (req.path.includes("/user") && req.user.role !== "user") {
        return res.status(403).json({ message: "Forbidden: User access only" });
      }
  
      next();
    } catch (err) {
      res.status(401).json({ message: "Invalid Token" });
    }
  };  