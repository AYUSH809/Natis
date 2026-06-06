import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export class JwtService {
    static generateToken(payload: object) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: "7d",
        });
    }

    static verifyToken(token: string) {
        return jwt.verify(token, JWT_SECRET);
    }
}