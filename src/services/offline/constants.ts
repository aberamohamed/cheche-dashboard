/** Session id stored on an offline order payload; replaced with a real session at sync time. */
export const OFFLINE_SESSION_PLACEHOLDER = 'OFFLINE_PENDING_SESSION';

/** Prefix for provisional order/receipt numbers generated while offline. */
export const OFFLINE_ORDER_PREFIX = 'OFF';

/** How long synced sales are kept locally (for the Offline Sales Report) before being purged. */
export const SYNCED_SALE_RETENTION_DAYS = 30;

/** Warn the operator once the offline backlog crosses this size. */
export const OFFLINE_BACKLOG_WARN_THRESHOLD = 50;
