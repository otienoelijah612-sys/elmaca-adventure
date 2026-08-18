import { NextResponse } from "next/server";
import {
  timingSafeEqual,
} from "crypto";

import {
  ADMIN_COOKIE_NAME,
  createAdminSession,
} from "@/lib/admin-auth";

export async function POST(
  request: Request,
) {
  try {
    const body =
      await request.json();

    const submittedPassword =
      String(
        body?.password ?? "",
      );

    const configuredPassword =
      process.env
        .ELMACA_ADMIN_PASSWORD;

    if (
      !configuredPassword
    ) {
      console.error(
        "ELMACA_ADMIN_PASSWORD is not configured.",
      );

      return NextResponse.json(
        {
          error:
            "Admin authentication is not configured.",
        },
        {
          status: 500,
        },
      );
    }

    const submittedBuffer =
      Buffer.from(
        submittedPassword,
      );

    const configuredBuffer =
      Buffer.from(
        configuredPassword,
      );

    const passwordMatches =
      submittedBuffer.length ===
        configuredBuffer.length &&
      timingSafeEqual(
        submittedBuffer,
        configuredBuffer,
      );

    if (
      !passwordMatches
    ) {
      return NextResponse.json(
        {
          error:
            "Incorrect password.",
        },
        {
          status: 401,
        },
      );
    }

    const token =
      createAdminSession();

    const response =
      NextResponse.json({
        success: true,
      });

    response.cookies.set(
      ADMIN_COOKIE_NAME,
      token,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV ===
          "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 12,
      },
    );

    return response;
  } catch (error) {
    console.error(
      "Admin login error:",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Unable to log in.",
      },
      {
        status: 500,
      },
    );
  }
}