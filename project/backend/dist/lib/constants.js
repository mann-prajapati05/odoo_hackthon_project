export const VIRTUAL_WAREHOUSE_SHORT_CODE = "VRT";
export const VIRTUAL_VENDOR_LOCATION_SHORT_CODE = "VRT-VENDOR";
export const VIRTUAL_CUSTOMER_LOCATION_SHORT_CODE = "VRT-CUSTOMER";
export const REF_PREFIX = {
    RECEIPT: "RCP",
    DELIVERY: "DEL",
    TRANSFER: "TRF",
    ADJUSTMENT: "ADJ",
};
export const COOKIE_REFRESH_NAME = "refreshToken";
export const REFRESH_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
};
