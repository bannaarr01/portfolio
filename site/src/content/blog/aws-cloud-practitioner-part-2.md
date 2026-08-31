---
title: "Cloud Computing Models and Deployment Strategies"
description: "AWS Cloud Practitioner study notes on IaaS, PaaS, SaaS, public cloud, hybrid, on-premises, and multi-cloud deployments."
category: aws-cloud
series: aws-cloud-practitioner-study-notes
part: 2
publishDate: 2026-08-14
draft: false
tags: ["aws", "cloud-fundamentals", "study-notes"]
heroGlyph: cloud
---

Two axes get confused constantly in exam questions: *what layer you rent* and
*where the hardware lives*. They are independent, and questions frequently
combine them to see whether you have noticed.

## The service models

IaaS gives you the virtual machine and leaves the operating system to you.
PaaS hands over the runtime and keeps you out of patching. SaaS gives you the
finished application and no infrastructure surface at all.

### Where the boundary moves

EC2 is IaaS. Elastic Beanstalk sits at PaaS because it manages the platform
underneath your deployable artifact. WorkMail is SaaS. The useful test is to
ask what you are still responsible for patching.

## The deployment models

Public cloud means everything runs on provider infrastructure. Hybrid keeps
some workloads on-premises and connects them, usually over Direct Connect or a
site-to-site VPN. On-premises with virtualisation is sometimes marketed as
private cloud, which the exam accepts.

## Why hybrid persists

Data residency rules, latency-bound machinery, and depreciation schedules on
hardware that still has years left on it. Hybrid is rarely a technical
preference and usually a constraint someone inherited.
