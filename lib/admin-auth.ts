import {
    createHmac,
    timingSafeEqual,
  } from "crypto";
  
  export const ADMIN_COOKIE_NAME =
    "elmaca_admin_session";
  
  const SESSION_DURATION_SECONDS =
    60 * 60 * 12; // 12 hours
  
  function getAdminPassword() {
    const password =
      process.env.ELMACA_ADMIN_PASSWORD;
  
    if (!password) {
      throw new Error(
        "ELMACA_ADMIN_PASSWORD is not configured.",
      );
    }
  
    return password;
  }
  
  function createSignature(
    expiry: string,
  ) {
    return createHmac(
      "sha256",
      getAdminPassword(),
    )
      .update(
        `elmaca-admin:${expiry}`,
      )
      .digest("hex");
  }
  
  export function createAdminSession() {
    const expiry =
      Math.floor(
        Date.now() / 1000,
      ) +
      SESSION_DURATION_SECONDS;
  
    const expiryString =
      String(expiry);
  
    const signature =
      createSignature(
        expiryString,
      );
  
    return `${expiryString}.${signature}`;
  }
  
  export function verifyAdminSession(
    token: string | undefined,
  ) {
    if (!token) {
      return false;
    }
  
    const parts =
      token.split(".");
  
    if (parts.length !== 2) {
      return false;
    }
  
    const [
      expiry,
      signature,
    ] = parts;
  
    const expiryNumber =
      Number(expiry);
  
    if (
      !Number.isFinite(
        expiryNumber,
      )
    ) {
      return false;
    }
  
    if (
      expiryNumber <
      Math.floor(
        Date.now() / 1000,
      )
    ) {
      return false;
    }
  
    const expectedSignature =
      createSignature(expiry);
  
    const actualBuffer =
      Buffer.from(signature);
  
    const expectedBuffer =
      Buffer.from(
        expectedSignature,
      );
  
    if (
      actualBuffer.length !==
      expectedBuffer.length
    ) {
      return false;
    }
  
    return timingSafeEqual(
      actualBuffer,
      expectedBuffer,
    );
  }
  
  export function getAdminTokenFromRequest(
    request: Request,
  ) {
    const cookieHeader =
      request.headers.get(
        "cookie",
      );
  
    if (!cookieHeader) {
      return undefined;
    }
  
    const cookies =
      cookieHeader
        .split(";")
        .map((item) =>
          item.trim(),
        );
  
    const adminCookie =
      cookies.find((item) =>
        item.startsWith(
          `${ADMIN_COOKIE_NAME}=`,
        ),
      );
  
    if (!adminCookie) {
      return undefined;
    }
  
    return decodeURIComponent(
      adminCookie.slice(
        `${ADMIN_COOKIE_NAME}=`.length,
      ),
    );
  }
  
  export function isAdminRequest(
    request: Request,
  ) {
    const token =
      getAdminTokenFromRequest(
        request,
      );
  
    return verifyAdminSession(
      token,
    );
  }