-- One row per day and language. No IPs, user agents or identifiers are ever stored.
CREATE TABLE IF NOT EXISTS daily (
  day    TEXT    NOT NULL,             -- YYYY-MM-DD (UTC)
  lang   TEXT    NOT NULL,
  views  INTEGER NOT NULL DEFAULT 0,   -- page loads
  visits INTEGER NOT NULL DEFAULT 0,   -- first page load in a browser tab session
  PRIMARY KEY (day, lang)
) STRICT;
