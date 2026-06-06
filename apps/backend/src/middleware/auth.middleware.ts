import { Request, Response, NextFunction } from "express";
import { JwtService } from "../auth/jwt.service";

export interface AuthRequest extends Request {
    user?: any;
}

export async function authMiddleware(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Unauthorized",
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = JwtService.verifyToken(token);

        req.user = decoded;

        next();
    } catch (error) {
        return res.status(401).json({
            message: "Invalid token",
        });
    }
}