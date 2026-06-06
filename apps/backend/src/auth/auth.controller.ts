import { Request, Response } from "express";
import { AuthService } from "./auth.service";

export class AuthController {
    static async login(
        req: Request,
        res: Response
    ) {
        try {
            const { firebaseToken } = req.body;

            const result =
                await AuthService.authenticate(
                    firebaseToken
                );

            return res.json(result);
        } catch (error) {
            console.error(error);

            return res.status(500).json({
                message: "Authentication failed",
            });
        }
    }
}