---
title: "Designing a Read-Heavy Service That Survives Its Own Success"
description: "A long-form walk through caching, replication lag, stampede control, and pagination for a service whose read traffic grows faster than its writes."
category: system-design
publishDate: 2026-08-26
draft: false
tags: ["system-design", "caching", "databases", "reliability", "performance"]
heroGlyph: server
---

Most services that fall over in production do not fall over because a write
path got slow. They fall over because a read path that was cheap at a thousand
requests per minute stayed structurally identical at a hundred thousand, and
nobody re-derived the assumptions underneath it.

This is a long fixture post. It exists so the article template has something
with real structural depth to render: nested headings, code, a wide table, a
blockquote, and enough sections that the table of contents crosses the point
where part numbering needs zero-padding. If you are reading it as content
rather than as a test, the engineering in it is still meant to be correct.

## The shape of the problem

A read-heavy service is one where the ratio of reads to writes is high enough
that read cost dominates every capacity decision you make. Catalogue services,
profile lookups, feed rendering, pricing, and permission checks all land here.
The characteristic failure is not a slow query. It is a query that was always
slow and only became visible once concurrency rose far enough that the
queueing delay in front of it exceeded the service time inside it.

That distinction matters because the two problems have different fixes. A slow
query wants an index. A queueing problem wants fewer arrivals, more servers,
or shorter service time, and adding an index only helps through the third.

## Establish the read and write ratio first

Before choosing any mechanism, write down the actual ratio. Not the ratio you
assume from the domain, the ratio your logs report. Teams routinely guess
100:1 for a workload that measures 6:1, then spend a quarter building cache
infrastructure that saves very little.

### Measuring it without a metrics stack

If you have no instrumentation yet, the database will usually tell you. On
PostgreSQL:

```sql
SELECT
  schemaname,
  relname,
  seq_scan + idx_scan            AS reads,
  n_tup_ins + n_tup_upd + n_tup_del AS writes
FROM pg_stat_user_tables
ORDER BY reads DESC
LIMIT 20;
```

Those counters are cumulative since the last stats reset, so take two samples
an hour apart and diff them. A single reading tells you about the lifetime of
the process, which is rarely the period you care about.

### What a low ratio implies

If reads and writes are within an order of magnitude of each other, caching
buys less than it costs. The invalidation logic, the extra failure mode, and
the operational surface of another stateful system are all real, and they are
worth paying for at 100:1 and usually not at 5:1.

## The latency budget

Give the endpoint a number before you design it. Something like: 95th
percentile under 120 milliseconds at the edge, of which 30 milliseconds is
network and TLS, leaving 90 milliseconds of server time.

Then decompose the 90 into the calls the handler actually makes. A handler
that makes four sequential dependency calls has roughly 22 milliseconds each,
and any dependency whose own p95 exceeds that is a design problem you now
know about in advance rather than after launch.

> A latency budget is useful mainly because it converts an argument about
> taste into an argument about arithmetic. "This feels slow" is hard to
> resolve. "This call has 22 milliseconds and takes 60" is not.

## Caching is a consistency decision

The reason cache design is hard is that it is not really a performance
decision. Choosing a cache is choosing how stale a reader is allowed to be,
and that is a product question wearing infrastructure clothes.

### Cache-aside

The application checks the cache, misses, reads the database, and populates
the cache itself. Simple, and the default for good reason. The cost is that
every caller must implement the pattern correctly, and one caller that forgets
to populate turns into a permanent miss for that key shape.

### Read-through

The cache sits in the read path and fetches on miss. Callers see one
interface. This removes the class of bug above and moves it into whatever
component implements the fetch, which is usually a smaller and better tested
surface.

### Write-through and write-behind

Write-through updates cache and database together, so readers never see a
stale entry the writer just replaced. Write-behind acknowledges the write
after the cache update and persists asynchronously, which is faster and
introduces a window where an acknowledged write is not yet durable. Use
write-behind only where losing that window is genuinely acceptable.

## Choosing a cache key

Cache keys are a schema. Treat them like one.

- Include a version prefix, so a shape change is a deploy rather than a
  flush: `v3:user:1234:profile`.
- Include every input that affects the value. Locale, currency, and
  permission scope are the three most commonly forgotten.
- Do not include anything that varies per request but not per value, such as
  a trace identifier. That is how you get a cache with a zero percent hit
  rate and a very confident owner.

A key that omits an input does not produce a cache miss. It produces a
correct-looking response containing another user's data, which is why this
list is short and worth re-reading.

## Stampedes and how they actually happen

The textbook stampede is a popular key expiring and a thousand concurrent
requests all missing at once, all querying the database, all writing the same
value back. The database sees a thousand identical queries where it expected
one.

The version that actually bites is subtler. Keys written at the same time
expire at the same time. A deploy that warms a cache, a cron job that
populates a batch, or a Redis restart all create cohorts of keys with
synchronised expiry, and the stampede arrives on a schedule.

Two mitigations, applied together:

```go
// 1. Jitter the TTL so cohorts decorrelate.
ttl := base + time.Duration(rand.Int63n(int64(base/4)))

// 2. Collapse concurrent misses onto one fetch.
var group singleflight.Group

func (c *Cache) Get(ctx context.Context, key string) ([]byte, error) {
	if v, ok := c.redis.Get(ctx, key); ok {
		return v, nil
	}
	v, err, _ := group.Do(key, func() (any, error) {
		val, err := c.origin.Fetch(ctx, key)
		if err != nil {
			return nil, err
		}
		c.redis.Set(ctx, key, val, jitter(c.ttl))
		return val, nil
	})
	if err != nil {
		return nil, err
	}
	return v.([]byte), nil
}
```

`singleflight` deduplicates within one process. Across a fleet of fifty
processes you still get fifty origin fetches instead of fifty thousand, which
is usually sufficient. If it is not, a short distributed lock on the key is
the next step, with a timeout so a crashed holder cannot wedge the key
permanently.

## Read replicas and the replication lag tax

Replicas move read load off the primary and hand you a new correctness
problem in exchange. A user who writes and then immediately reads may hit a
replica that has not applied the write yet, and the interface appears to have
lost their change.

The usual fixes, in increasing order of cost:

1. Route reads that follow a write from the same session to the primary for a
   short window. Cheap, covers the common case, needs session affinity.
2. Track the write position and require the replica to have applied at least
   that position, falling back to the primary if it has not. On PostgreSQL
   this is `pg_current_wal_lsn()` compared against
   `pg_last_wal_replay_lsn()`.
3. Read from the primary for anything the user can observe as their own
   action, and use replicas only for aggregate or third-party views.

Whichever you choose, alert on replication lag as a first-class signal.
Silent lag growth turns a correctness guarantee into a coin flip without
producing a single error.

## Denormalisation and the write amplification it buys

Precomputing a read shape at write time converts an expensive join into a
single key lookup. The cost is write amplification: one logical write becomes
several physical writes, and every additional copy is a place the data can
diverge.

Denormalise when the read is hot, the write is rare, and the divergence is
detectable. A materialised view with a scheduled refresh and a consistency
check that runs nightly is a reasonable middle position, because it fails
loudly rather than quietly.

## Pagination that survives deep offsets

`LIMIT 20 OFFSET 100000` asks the database to produce a hundred thousand and
twenty rows and discard all but twenty. It gets slower linearly with depth,
and it produces duplicate or missing rows when the underlying data changes
between page requests.

Keyset pagination fixes both:

```sql
SELECT id, title, published_at
FROM articles
WHERE (published_at, id) < ($1, $2)
ORDER BY published_at DESC, id DESC
LIMIT 20;
```

The tuple comparison requires a matching composite index on
`(published_at DESC, id DESC)`. The tradeoff is that you lose the ability to
jump to an arbitrary page number, which almost no user does and almost every
specification asks for.

## Backpressure at the edge

When a dependency degrades, a service without backpressure converts a slow
dependency into an outage. Requests queue, memory grows, garbage collection
pauses lengthen, and the service fails at something unrelated to the original
problem.

Bound the queue. Set a concurrency limit per dependency, reject over the limit
with a 503 and a `Retry-After`, and set client timeouts shorter than the
upstream's own timeout so retries do not stack. A load shedder that returns
errors quickly is a better neighbour than one that accepts everything and
answers nothing.

## Send less over the wire

Serialisation and transfer are part of the latency budget and are usually the
part nobody has looked at. A handler that assembles its response in 8
milliseconds and then serialises 400 kilobytes of JSON has not been optimised,
it has been measured in the wrong place.

### Trim the response shape

Return the fields the caller uses. A sparse fieldset parameter, or separate
summary and detail representations, removes more bytes than any compression
setting. This is also the change that most often reveals a client quietly
depending on a field nobody documented, so ship it behind a flag.

### Compression is not free either

Gzip at level 9 on a large payload can cost more CPU than the transfer time it
saves on a fast connection. Level 4 to 6 is the usual sweet spot, and Brotli
at level 4 beats gzip at level 6 on both size and speed for text. Measure on
your own payloads rather than trusting a benchmark run on someone else's.

### Idempotency makes retries safe

Once clients retry, every non-idempotent write becomes a duplicate risk.
Accept an `Idempotency-Key` header on writes, store the key with the response
for a bounded window, and replay the stored response on a repeat. Retries then
stop being a correctness hazard and become the ordinary traffic they should
have been.

## What to measure

| Signal | Where it lives | Healthy | Investigate | Page |
|---|---|---|---|---|
| Cache hit rate | Redis / app metrics | > 92% | 80 to 92% | < 80% sustained 10 min |
| Origin fetch rate | App metrics | Flat | Rising with traffic | Step change after deploy |
| Replication lag | Database | < 500 ms | 0.5 to 5 s | > 5 s for 2 min |
| Endpoint p95 | Edge / RUM | < 120 ms | 120 to 300 ms | > 300 ms for 5 min |
| Endpoint p99 | Edge / RUM | < 400 ms | 400 ms to 1 s | > 1 s for 5 min |
| Connection pool saturation | App metrics | < 60% | 60 to 85% | > 85% for 2 min |
| Shed request rate | Load shedder | 0 | Any sustained | > 1% of traffic |

The table is deliberately wider than the prose column. On a narrow viewport it
should scroll inside its own container rather than forcing the page body to
scroll sideways, which is one of the things this fixture is here to check.

## Failure modes worth rehearsing

Design reviews catch design problems. Operational problems need rehearsal.

### Cache cold start

Restart the cache in a staging environment under production-shaped load and
watch what the origin does. If the database saturates, your warmup path is
the real capacity limit and the steady-state numbers are fiction.

### Replica promotion

Promote a replica during business hours in staging. Measure how long
connection pools take to notice, how many requests fail during the switch,
and whether any code path silently kept a stale connection.

### Dependency brownout

Inject 2 seconds of latency into a downstream call rather than failing it
outright. Slow dependencies are harder to survive than dead ones, because
nothing trips a circuit breaker configured only for errors.

## When to stop optimising

Stop when the next change costs more in complexity than it returns in
capacity or latency, measured against the budget you wrote down at the start.
A service that meets its p95 target with a 92% cache hit rate and one replica
does not need a second cache tier. It needs to be left alone so the team can
work on something else.

Further reading worth the time: Marc Brooker on
[timeouts and retries](https://brooker.co.za/blog/), and the AWS Builders'
Library entry on
[caching challenges and strategies](https://aws.amazon.com/builders-library/caching-challenges-and-strategies/).
Both are more careful about failure modes than most conference talks on the
same subject.
