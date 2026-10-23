-- Request-local, fixed client categories only; no identities or session linkage.
CREATE TABLE daily_clients (
 day TEXT NOT NULL CHECK(length(day)=10),
 client TEXT NOT NULL CHECK(client IN ('codex','claude_code','claude_duet','grok_bot','muse','pi','commandcode','other','unknown')),
 method TEXT NOT NULL CHECK(method IN ('initialize','tools/call')),
 tool TEXT NOT NULL CHECK(length(tool) BETWEEN 1 AND 128),
 outcome TEXT NOT NULL CHECK(outcome IN ('success','empty','tool_error','protocol_error')),
 source TEXT NOT NULL CHECK(source IN ('client_info','user_agent','none')),
 topic TEXT NOT NULL CHECK(topic IN ('installation','agents','deployment','testing','webops','retrieval','mcp','unclassified','not_applicable')),
 revision TEXT NOT NULL CHECK(length(revision)=64),
 count INTEGER NOT NULL CHECK(count>=0),
 PRIMARY KEY(day,client,method,tool,outcome,source,topic,revision)
) WITHOUT ROWID;
INSERT INTO analytics_state VALUES ('clients_since',strftime('%Y-%m-%dT%H:%M:%SZ','now'));
