---
layout: ../../layouts/PostLayout.astro
title: Astro as a Foundation for Fast, Clear Personal Sites
date: 2026-02-27
channel: BUILD_SYSTEM
readTime: 5m
excerpt: Why I moved to Astro for this site, what improved in authoring speed, and where component islands actually simplify maintenance.
---

I moved this site to Astro for one reason above all others: clarity. The project does not need a client-heavy architecture to publish fast pages with a strong layout system and a small amount of interactivity.

Astro gives me a clean split between authored content, shared layout, and the few places that actually need JavaScript.

## What Improved Immediately

- Shared chrome moved into a single layout.
- Static content became easier to refactor into data-backed pages.
- Build output stayed small and predictable.

## Where Astro Actually Helps

For a personal site, islands are useful when interaction is specific and bounded. A theme menu or an interactive featured-project panel is a good fit. An always-hydrated application shell is not.

## Why Content In Markdown Matters

Once articles live in Markdown, writing and publishing become independent from page scaffolding. That separation keeps the site easier to grow over time.

The strongest architectural choice is usually the one that reduces unnecessary decisions later. For this site, Astro did exactly that.