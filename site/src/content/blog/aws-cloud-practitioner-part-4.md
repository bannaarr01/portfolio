---
title: 'AWS Global Infrastructure: Regions, Zones, and Edge Locations'
description: 'AWS Cloud Practitioner study notes on Regions, Availability Zones, CloudFront edge locations, Local Zones, Wavelength Zones, and Direct Connect.'
category: aws-cloud
series: aws-cloud-practitioner-study-notes
part: 4
publishDate: 2026-08-19
draft: false
tags: ['aws', 'global-infrastructure', 'study-notes']
heroGlyph: aws
---

The hierarchy is small enough to memorise and precise enough that the exam
will punish a loose reading of it.

## Regions

A Region is a named geographic area containing multiple Availability Zones.
Regions are isolated from each other by design: nothing replicates between
them unless you configure it to.

### Choosing a Region

Compliance first, then latency to your users, then service availability, then
price. Newer services do not launch everywhere at once, so the third check
catches more people than expected.

## Availability Zones

An AZ is one or more discrete data centres with independent power, cooling,
and networking, connected to sibling AZs over low-latency links. Spreading
across AZs is the standard answer to "how do I survive a data centre failure".

## Edge locations

CloudFront's cache sits at edge locations, of which there are far more than
Regions. Route 53 and AWS Global Accelerator use the same footprint.

## The specialised zones

Local Zones place compute close to a metropolitan area for latency-sensitive
workloads. Wavelength Zones sit inside telecom providers' 5G networks. Both
are extensions of a parent Region rather than Regions in their own right.

## Direct Connect

A dedicated private link between your premises and AWS. It is not part of the
Region hierarchy, but questions about consistent network performance usually
want it as the answer.
