-- Only fixed categories and public catalog identifiers; no individual events.
CREATE TABLE daily_details (
 day TEXT NOT NULL CHECK(length(day)=10),
 tool TEXT NOT NULL CHECK(length(tool) BETWEEN 1 AND 128),
 topic TEXT NOT NULL CHECK(topic IN ('installation','agents','deployment','testing','webops','retrieval','mcp','unclassified','not_applicable')),
 outcome TEXT NOT NULL CHECK(outcome IN ('success','empty','tool_error','protocol_error')),
 latency TEXT NOT NULL CHECK(latency IN ('under_10ms','10_49ms','50_199ms','200ms_plus')),
 revision TEXT NOT NULL CHECK(length(revision)=64),
 item TEXT NOT NULL CHECK(length(item)<=128),
 profile TEXT NOT NULL CHECK(length(profile)<=128),
 results TEXT NOT NULL CHECK(results IN ('zero','1_5','6_20','21_plus','not_applicable')),
 count INTEGER NOT NULL CHECK(count>=0),
 PRIMARY KEY(day,tool,topic,outcome,latency,revision,item,profile,results)
) WITHOUT ROWID;
CREATE TABLE analytics_state (key TEXT PRIMARY KEY, value TEXT NOT NULL) WITHOUT ROWID;
INSERT INTO analytics_state VALUES ('details_since',strftime('%Y-%m-%dT%H:%M:%SZ','now'));
INSERT INTO analytics_state VALUES ('history_since',strftime('%Y-%m-%dT%H:%M:%SZ','now'));
