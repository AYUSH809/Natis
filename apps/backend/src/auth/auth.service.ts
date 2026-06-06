import { prisma } from "../database/prisma";
import { firebaseAdmin } from "./firebase.service";
import { JwtService } from "./jwt.service";

export class AuthService {
  static async authenticate(firebaseToken: string) {
    const decoded =
      await firebaseAdmin.auth().verifyIdToken(firebaseToken);

    let user = await prisma.user.findUnique({
      where: {
        email: decoded.email!,
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          firebaseUid: decoded.uid,
          email: decoded.email!,
          username:
            decoded.name ||
            decoded.email!.split("@")[0],
          profileImage: decoded.picture,
          providerType: "firebase",
        },
      });
    }

    const jwt = JwtService.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user,
      token: jwt,
    };
  }
}