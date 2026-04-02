# JavaScript Style Guide (Functional + Result Pattern)

Applies to humans and AI tools equally.

Goals:
- Functional, predictable code
- Minimal mutation
- Shallow control flow
- Explicit error flow
- Small composable functions
- Clear adapter vs orchestrator boundaries

---

## Core Philosophy

- Functional first
- No classes unless required by external libraries/frameworks
- Prefer composition over inheritance
- Prefer expressions over statements
- Immutability by default
- Exceptions should not cross module boundaries — return Result instead


## Variables

- Use const by default
- let only when unavoidable (loops, counters, accumulators)
- Never use var

### Good:

```javascript
const total = items.reduce((s, x) => s + x, 0)
```

### Acceptable:

```javascript
let i = 0
while (i < 3) i += 1
```

### Avoid:

```javascript
let count = 0 // unnecessary mutable state
```

## Functions

- Arrow functions only
- Single parameter → omit parentheses
- Prefer expression bodies

### Good:

```javascript
const square = x => x * x
```

### Avoid:

```javascript
const square = x => {
	return x * x
}
```

---

## Immutability

Do not mutate inputs.

### Bad:

```javascript
user.name = 'Bob'
```

### Good:

```javascript
const updated = { ...user, name: 'Bob' }
```

---

## Control Flow

Use early returns instead of nesting.

### Good:

```javascript
if (!user) return
if (!user.active) return
save(user)
```

Avoid nested conditionals.

---

## Inline Guards

Short guards should be one line.

```javascript
if (!items.length) return []
if (!config) return err
```

---

## Arrays

Prefer functional methods:

- `map`
- `filter`
- `reduce`
- `find`
- `some`
- `every`

Avoid manual loops unless necessary.

---

## Semicolons

- Only when required
- Place at start of next line if needed for ASI safety

```javascript
const x = y
;[1,2,3].map(f)
```

No trailing semicolons.

---

## Error Handling — Result Pattern

Functions that can fail must return:

```javascript
{ ok: true, value }
{ ok: false, error }
```

Do not return null to indicate failure.

---

## Try-Catch Wrapper

Wrap effectful adapters once.

```javascript
export const readSafe = tryCatch(() =>
	readFile(path)
)
```

Do not stack try/catch up the call chain.

---

## Result Helpers

Use:

- `map` → sync transform
- `mapAsync` → async transform
- `chain` → transform returning Result

These preserve error short-circuiting.

---

## Retry Pattern

Retry helpers must:

- Return `Result`
- Preserve last error as `error.cause`
- Avoid sleeping after final attempt
- Support backoff

---

## Adapter vs Orchestrator

### Adapters:

- One effect
- Wrapped with `tryCatch`
- Return `Result`

### Orchestrators:

- Compose adapters
- Early return on failure
- Minimal side effects

---

## Module Exports

Export capabilities, not steps.

### Export:

- Workflows
- Adapters

### Keep private:

- Helpers
- Builders
- Small utilities

---

## Logging

Do not log inside adapters by default.

### Logging allowed at:

- CLI entrypoints
- Top-level runners
- Injected logger boundaries

---

## Imports

Use ES modules only.

### Group:

1. Built-ins
2. External packages
3. Local modules

---

## Formatting

- Tabs for indentation
- Soft max line length ≈ 100

---

## Strings

Use single quotes `'` for plain strings.

Use backticks `` ` `` for template literals (interpolation).

Avoid double quotes `"`.

### Good:

```javascript
const name = 'Alice'
const greeting = `Hello, ${name}!`
const message = `It's a nice day`  // OK: contains single quote
```

### Avoid:

```javascript
const name = "Alice"  // unnecessary double quotes
const greeting = 'Hello, ' + name + '!'  // use template literal instead
```

---

## Object Construction

Destructure or declare fields as `const` before object creation for better readability.

### Good:

```javascript
const code = 'FETCH_FAILED'
const { message } = e
const cause = e

return err({ code, message, cause })
```

### Avoid:

```javascript
return err({
	code: 'FETCH_FAILED',
	message: e.message,
	cause: e,
})
```