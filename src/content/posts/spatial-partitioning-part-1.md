---
title: "Spatial Partitioning in a Shmup - Part 1: The Broad Phase"
date: 2026-04-14
time: 10:40
channel: GAME_DEV
readTime: 7m
excerpt: "Why naive collision detection breaks down in shmups, and how a simple grid-based broad phase eliminates most unnecessary checks before they ever happen."
---

## What is a Shmup?

A **shmup (shoot ‘em up)** is basically controlled chaos. You’ve got enemies, bullets, particles—everything moving all the time—and a lot of it needs to interact.

Which means you end up doing a lot of collision checks.

---

## Where Things Start to Break

At first, collision detection is straightforward. Loop through your objects, check them against each other, and you’re done.

That works… until you have more than a handful of things on screen.

Now you’ve got hundreds of bullets, enemies spawning in waves, maybe pickups, maybe effects. And suddenly your “simple” collision code is doing way more work than you expected.

Most of that work doesn’t even matter.

---

## The Problem (and Why It’s Wasteful)

Here’s the kind of logic most people start with:

```cpp
for (auto* a : objects)
{
    for (auto* b : objects)
    {
        CheckCollision(a, b);
    }
}
```

That’s **O(n²)**. Double your objects, you’re doing about four times the checks.

But the real issue isn’t just the math—it’s what you’re actually checking.

I use this analogy with students:

> If I wanted to see which of my students are holding hands, I wouldn’t check Jim in my room with Lisa across the hall.

There’s no chance they’re interacting. That check is pointless.

But this code does exactly that. It checks everything against everything, regardless of where things are.

Seeing it makes it obvious:

<broad-phase-comparison-demo
  ball-count="12"
  sector-size="80">
</broad-phase-comparison-demo>

On the left, everything is connected. On the right, once space is divided up, those connections collapse into small, local groups. Same objects, same movement—just far less wasted work.

---

## Broad Phase vs Narrow Phase

Collision detection is usually split into two parts:

- **Broad phase**: figure out *which objects might collide*  
- **Narrow phase**: do the actual collision test  

This article is entirely about the first part.

We’re not changing how collisions are tested—we’re just deciding *which pairs are worth testing at all*.

---

## What the Broad Phase Should Do

We don’t need faster collision checks.

We need fewer of them.

The broad phase is just a filter. Its job is to throw away as many impossible pairs as possible before we even think about running real collision logic.

---

## A Simple Broad Phase: A Grid

For a shmup, a uniform grid is usually enough.

You divide the screen into fixed-size sectors, and each object is associated with the sectors it overlaps. From there, collision checks only happen within those sectors.

You’re not changing the rules of collision—you’re just limiting where collisions are allowed to be considered.

---

## How This Fits Into a Real System

In my case, the `Level` owns a grid of sectors:

```cpp
std::vector<GameObject*>* m_pSectors;
```

Each sector is just a list of nearby objects.

Every frame, the grid is rebuilt:
- sectors are cleared  
- objects update  
- each object registers which sectors it belongs to  

By the time everything has moved, the grid represents a snapshot of the world, organized by proximity.

---

## Building the Grid

At a high level, the grid is defined once, and reused every frame.

```cpp
Level::Level()
{
    m_sectorSize.X = 64;
    m_sectorSize.Y = 64;

    m_sectorCount.X = (Game::GetScreenWidth() / (int)m_sectorSize.X) + 1;
    m_sectorCount.Y = (Game::GetScreenHeight() / (int)m_sectorSize.Y) + 1;

    m_totalSectorCount = m_sectorCount.X * m_sectorCount.Y;

    m_pSectors = new std::vector<GameObject *>[m_totalSectorCount];
}
```

Each frame, it’s cleared and repopulated as objects move:

```cpp
void Level::Update(const GameTime *pGameTime)
{
    // Clear sectors
    for (unsigned int i = 0; i < m_totalSectorCount; i++)
    {
        m_pSectors[i].clear();
    }

    // Update objects (internally registers with sectors)
    m_gameObjectIt = m_gameObjects.begin();
    for (; m_gameObjectIt != m_gameObjects.end(); m_gameObjectIt++)
    {
        GameObject *pGameObject = (*m_gameObjectIt);
        pGameObject->Update(pGameTime);
    }

    // Loop through sectors and check collisions
    if (m_pCollisionManager)
    {
        for (unsigned int i = 0; i < m_totalSectorCount; i++)
        {
            if (m_pSectors[i].size() > 1)
            {
                CheckCollisions(m_pSectors[i]);
            }
        }
    }
}
```

The structure itself is simple. The tricky part is how objects get inserted.

---

## Assigning Objects to Sectors

This is where most issues show up.

You can’t just assign an object to a single sector based on its position. Objects have size, which means they can overlap multiple sectors at once. If you ignore that, you’ll miss collisions near the edges.

Instead, you calculate the bounds of the object, convert those bounds into sector coordinates, and insert the object into every sector it overlaps.

```cpp
void Level::UpdateSectorPosition(GameObject *pGameObject)
{
    // Get the bounding box of the object
    Vector2 position = pGameObject->GetPosition();
    Vector2 halfDimensions = pGameObject->GetHalfDimensions();

    // Calculate the min and max sector coordinates
    int minX = (int)(position.X - halfDimensions.X - 0.5f);
    int maxX = (int)(position.X + halfDimensions.X + 0.5f);
    int minY = (int)(position.Y - halfDimensions.Y - 0.5f);
    int maxY = (int)(position.Y + halfDimensions.Y + 0.5f);

    // Clamp to valid sector range
    minX = (int)Math::Clamp(0, m_sectorCount.X - 1, minX / (int)m_sectorSize.X);
    maxX = (int)Math::Clamp(0, m_sectorCount.X - 1, maxX / (int)m_sectorSize.X);
    minY = (int)Math::Clamp(0, m_sectorCount.Y - 1, minY / (int)m_sectorSize.Y);
    maxY = (int)Math::Clamp(0, m_sectorCount.Y - 1, maxY / (int)m_sectorSize.Y);

    // Insert the object into all overlapping sectors
    for (int x = minX; x <= maxX; x++)
    {
        for (int y = minY; y <= maxY; y++)
        {
            int index = y * (int)m_sectorCount.X + x;
            m_pSectors[index].push_back(pGameObject);
        }
    }
}
```

The important detail here is that objects are inserted into a range of sectors, not just one.

That’s what keeps collisions from slipping through at the boundaries. If two objects overlap visually, they’ll share at least one sector, and that’s enough for the broad phase to catch them.

It’s a small detail, but it’s the part that makes the system reliable.

---

## Choosing a Sector Size

Sector size matters more than people expect.

If sectors are too large, you’re back to checking everything against everything. If they’re too small, objects get duplicated across sectors and you lose efficiency that way.

It’s easier to see than explain:

<sector-sizing-demo
  ball-count="24"
  min-radius="6"
  max-radius="18"
  sector-size="50">
</sector-sizing-demo>

There’s usually a sweet spot that lines up with the average size of your objects.

Though, the real win isn’t just reducing comparisons—it’s avoiding work entirely. Most sectors are empty. Many contain only a single object. Only a small number actually contain multiple objects, and those are the only ones that need collision checks (the red lines).

If a sector has fewer than two objects, it can be skipped completely. That’s where a lot of the savings come from.

---

## What This Doesn’t Do

At this point, we haven’t actually *checked* a single collision. All we’ve done is narrow down the list of candidates.

That’s the entire job of the broad phase:

---

## Next: The Narrow Phase

Once you have a much smaller set of potential collisions, you still need to determine whether objects actually intersect.

That’s what we’ll cover in Part 2.