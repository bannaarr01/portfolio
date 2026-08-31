---
title: "AWS Disaster Recovery Strategies: RTO, RPO, and the Four Recovery Patterns"
description: "Detailed study notes explaining RTO, RPO, backup and restore, pilot light, warm standby, and active-active DR."
category: aws-cloud
publishDate: 2026-08-21
draft: false
tags: ["aws", "reliability", "disaster-recovery"]
heroGlyph: shield
---

This one is not part of the study-notes series. It sits in the same category,
which makes it the post that proves category pages list series and non-series
articles together.

## The two numbers

Recovery time objective is how long you can be down. Recovery point objective
is how much data you can afford to lose. Every DR pattern is a point on the
curve between those two numbers and what you are willing to pay.

## Backup and restore

Cheapest, slowest. Snapshots go to S3 or a cross-Region copy, and recovery
means provisioning infrastructure from scratch. RTO in hours, RPO in hours.

## Pilot light

A minimal core of the system runs continuously in the recovery Region, usually
the database replica and nothing else. Compute is provisioned on failover.
RTO in tens of minutes.

## Warm standby

A scaled-down but functional copy of the whole system runs in the second
Region. Failover is a traffic switch followed by a scale-up. RTO in minutes.

## Multi-site active-active

Both Regions serve production traffic. RTO approaches zero and so does RPO,
and the cost is a full second environment plus the work of keeping data
consistent across it.

## Picking one

The pattern is chosen by the business, not by the platform team. Ask what an
hour of downtime costs. If nobody can answer, that is the finding to report
before you build anything.
