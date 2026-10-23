-- Aggregate marginals only: no events, identities, raw text, or precise timestamps.
CREATE TABLE IF NOT EXISTS daily_metrics (
  day TEXT NOT NULL CHECK(length(day) = 10),
  dimension TEXT NOT NULL CHECK(dimension IN ('calls','tool','outcome','topic','item','profile','results','latency','revision','search_outcome')),
  value TEXT NOT NULL CHECK(length(value) BETWEEN 1 AND 128),
  count INTEGER NOT NULL DEFAULT 1 CHECK(count >= 0),
  PRIMARY KEY(day, dimension, value)
) WITHOUT ROWID;
