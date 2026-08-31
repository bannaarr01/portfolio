---
title: "Go Worker Pools: Bounded Concurrency Without Leaking Goroutines"
description: "How to size a worker pool, propagate cancellation with context, and shut down cleanly so no goroutine outlives the request that spawned it."
category: go
publishDate: 2026-08-24
draft: false
tags: ["go", "concurrency", "patterns"]
heroGlyph: go
---

This post exists in a different category to the AWS material, which makes it
the fixture that proves `/blog/category/go/` renders independently of
`/blog/category/aws-cloud/`.

## Why bound anything

An unbounded `go func()` per item is fine until the input is a million rows.
Then you discover that goroutines are cheap but the file descriptors,
database connections, and downstream rate limits they contend for are not.

## The shape

```go
func Process(ctx context.Context, items []Item, workers int) error {
	g, ctx := errgroup.WithContext(ctx)
	in := make(chan Item)

	g.Go(func() error {
		defer close(in)
		for _, it := range items {
			select {
			case in <- it:
			case <-ctx.Done():
				return ctx.Err()
			}
		}
		return nil
	})

	for i := 0; i < workers; i++ {
		g.Go(func() error {
			for it := range in {
				if err := handle(ctx, it); err != nil {
					return err
				}
			}
			return nil
		})
	}

	return g.Wait()
}
```

## The part people get wrong

The producer must select on `ctx.Done()`. Without it, a worker returning an
error cancels the context, the remaining workers stop reading, and the
producer blocks forever on a send that nobody will receive.

## Sizing the pool

For CPU-bound work, `runtime.GOMAXPROCS(0)` is the starting point. For
IO-bound work the right number is whatever the slowest downstream dependency
tolerates, which you find by measurement rather than by arithmetic.
