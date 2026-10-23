"""Exercise actual SQLite semantics: atomic increments, bounds and retention."""
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta, timezone
c=sqlite3.connect(':memory:')
c.executescript(Path('migrations/0001_analytics.sql').read_text())
query='INSERT INTO daily_metrics(day,dimension,value,count) VALUES(?,?,?,1) ON CONFLICT(day,dimension,value) DO UPDATE SET count=count+1'
today=datetime.now(timezone.utc).date()
for _ in range(100): c.execute(query,(str(today),'tool','get_kujo_overview'))
assert c.execute('SELECT count FROM daily_metrics').fetchone()[0]==100
for age in (29,30,31): c.execute(query,(str(today-timedelta(days=age)),'calls','tool'))
cutoff=str(today-timedelta(days=29))
assert len(c.execute('SELECT day FROM daily_metrics WHERE day >= ?', (cutoff,)).fetchall())==2
c.execute('DELETE FROM daily_metrics WHERE day < ?', (cutoff,))
assert c.execute('SELECT COUNT(*) FROM daily_metrics').fetchone()[0]==2
for dimension,value in [('request','raw'),('tool','x'*129)]:
 try: c.execute(query,(str(today),dimension,value))
 except sqlite3.IntegrityError: pass
 else: raise AssertionError('schema accepted invalid dimensions')
print('SQLite aggregation, atomic upsert, schema bounds and 30-day retention passed')
