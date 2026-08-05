/**
 * Mirrors MAX_COMMENT_LENGTH in $lib/server/comments. Duplicated rather than
 * imported because the value is needed on a textarea's maxlength attribute,
 * and pulling it from $lib/server would drag the whole comments module —
 * database imports included — into the client bundle.
 */
export const MAX_COMMENT_LENGTH_CLIENT = 2000;
