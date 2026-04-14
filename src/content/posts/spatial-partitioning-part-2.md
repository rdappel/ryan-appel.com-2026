---
title: "Spatial Partitioning in a Shmup - Part 2: The Narrow Phase"
date: 2026-04-14
time: 15:15:13
channel: GAME_DEV
readTime: 8m
excerpt: "How narrow phase collision checks confirm real overlaps after broad phase filtering, using AABB and circle tests in a shmup-friendly pipeline."
---

# Spatial Partitioning in a Shmup – Part 2: The Narrow Phase

> This is Part 2 of the series. Read [Part 1: The Broad Phase](/archive/spatial-partitioning-part-1/) first.

## The Grid Did Its Job

In Part 1, the grid reduced the number of comparisons by limiting collision checks to nearby objects.

That solved the broad phase problem.

But it didn’t solve collision detection itself.

Being in the same sector does **not** mean two objects are touching. It only means they’re close enough that checking them is worth the cost.

The narrow phase is where that final decision gets made.

## Broad Phase vs Narrow Phase

The broad phase asks:

> Which pairs are worth considering?

The narrow phase asks:

> Are these two objects actually overlapping?

The broad phase is allowed to overestimate.  
The narrow phase removes false positives.

## A Sector Is Not a Collision

Two objects can share a sector and still be nowhere near each other.

- one object is in the top-left
- one is in the bottom-right
- both get grouped together
- neither is actually touching

So once a sector gives us candidates, we still need real checks.

---

## AABB vs AABB

For a lot of shmup objects, axis-aligned bounding boxes are enough.

If each object has:
- position
- half width
- half height

then overlap is just checking for separation on either axis.

```cpp
bool IntersectsAABB(const GameObject* a, const GameObject* b)
{
    Vector2 aPos = a->GetPosition();
    Vector2 aHalf = a->GetHalfDimensions();

    Vector2 bPos = b->GetPosition();
    Vector2 bHalf = b->GetHalfDimensions();

    if (aPos.X + aHalf.X < bPos.X - bHalf.X) return false;
    if (aPos.X - aHalf.X > bPos.X + bHalf.X) return false;
    if (aPos.Y + aHalf.Y < bPos.Y - bHalf.Y) return false;
    if (aPos.Y - aHalf.Y > bPos.Y + bHalf.Y) return false;

    return true;
}
```

<collision-aabb-demo
  fixed-width="140"
  fixed-height="90"
  movable-width="120"
  movable-height="70"
/>

Try it: drag the green box toward the blue center box. You can also click the demo and use arrow keys (Shift + arrows for bigger steps).

AABB checks are fast, predictable, and usually “good enough.”

---

## Circle vs Circle

Sometimes a radius fits better than a box—especially for bullets.

Instead of checking axes, we check distance between centers.

```cpp
bool IntersectsCircle(const GameObject* a, const GameObject* b)
{
    Vector2 delta = b->GetPosition() - a->GetPosition();
    float radiusSum = a->GetRadius() + b->GetRadius();

    return delta.LengthSquared() <= radiusSum * radiusSum;
}
```

No square root needed.

<collision-circle-demo
  fixed-radius="78"
  movable-radius="62"
/>

Try it: drag the green circle toward the blue center circle.

---

## Mixed Shapes

Real games don’t stick to one shape.

You’ll usually end up with a small dispatcher:

```cpp
bool CheckCollision(const GameObject* a, const GameObject* b)
{
    if (a->IsAABB() && b->IsAABB())
        return IntersectsAABB(a, b);

    if (a->IsCircle() && b->IsCircle())
        return IntersectsCircle(a, b);

    return IntersectsCircleAABB(a, b);
}
```

Keep it simple. You’re not building a physics engine.

---

## The Duplicate Pair Problem

Because objects can exist in multiple sectors, the same pair can show up more than once.

If you don’t handle this, you’ll:
- waste performance
- apply effects multiple times
- introduce weird bugs

---

## Avoiding Duplicate Checks

Normalize the pair using IDs:

```cpp
struct CollisionPair
{
    int a;
    int b;

    CollisionPair(int id1, int id2)
    {
        if (id1 < id2)
        {
            a = id1;
            b = id2;
        }
        else
        {
            a = id2;
            b = id1;
        }
    }
};
```

Track tested pairs per frame.

If you’ve seen it already, skip it.

---

## Not Every Pair Should Collide

Even if two objects overlap, that doesn’t mean they should interact.

Filter early:

```cpp
if (!CanCollide(a, b))
    return false;
```

Typical rules:
- player bullets hit enemies
- enemies hit player
- bullets don’t hit bullets

This cuts a lot of unnecessary work.

---

## Detection Is Not Response

Detection answers:

> Are these objects overlapping?

Response answers:

> What happens because of that?

Keep them separate:
- detection stays clean and reusable
- response stays game-specific

---

## What the Narrow Phase Actually Does

The pipeline now looks like:

- broad phase → find candidates
- narrow phase → confirm overlap
- response → apply game logic

Each step removes more unnecessary work.

---

## Up Next

From here, you can go two directions:

- **Collision response** (damage, bounce, destruction)
- **Edge cases and optimizations** (fast bullets, tunneling, better partitioning)

Both build directly on this system.
