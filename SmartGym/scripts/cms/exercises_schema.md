# Google Sheets CMS — Exercises Sheet Schema

## Sheet Name: `Exercises`

Create these **exact column headers** (row 1) in your Google Sheet.

| Column | Header | Type | Required | Example | Notes |
|--------|--------|------|----------|---------|-------|
| A | `id` | string | ✅ | `bench_press` | Unique, URL-safe, snake_case |
| B | `slug` | string | ✅ | `bench-press` | Auto-generated from name if empty |
| C | `name` | string | ✅ | `Bench Press` | Display name |
| D | `description` | string | ✅ | `King of chest exercises...` | Short description |
| E | `muscle_group` | enum | ✅ | `chest` | See valid values below |
| F | `secondary_muscles` | string | ❌ | `shoulders\|arms` | Pipe-separated `\|` |
| G | `category` | string | ❌ | `Push` | Push/Pull/Legs/Core/Cardio |
| H | `equipment` | enum | ✅ | `barbell` | See valid values below |
| I | `type` | enum | ✅ | `strength` | `strength` / `cardio` / `flexibility` |
| J | `difficulty` | enum | ✅ | `intermediate` | `beginner` / `intermediate` / `advanced` |
| K | `instructions` | string | ✅ | `Lie flat on bench\|Grip bar...` | Pipe-separated steps |
| L | `tips` | string | ❌ | `Keep blades retracted\|Control descent` | Pipe-separated tips |
| M | `image_url` | url | ❌ | `https://cdn.example.com/bench.jpg` | 16:9, JPEG/PNG/WebP |
| N | `gif_url` | url | ❌ | `https://cdn.example.com/bench.gif` | Animated GIF demo |
| O | `video_url` | url | ❌ | `https://cdn.example.com/bench.mp4` | MP4 video demo |
| P | `calories_per_minute` | number | ❌ | `8.5` | Approx kcal/min |
| Q | `is_popular` | boolean | ❌ | `true` | `true` / `false` |
| R | `updated_at` | datetime | ❌ | `2024-01-15T10:00:00Z` | ISO 8601 |

---

## Valid Enum Values

### `muscle_group`
`chest` · `back` · `shoulders` · `arms` · `legs` · `core` · `glutes` · `cardio` · `full_body`

### `equipment`
`barbell` · `dumbbell` · `machine` · `cable` · `bodyweight` · `kettlebell` · `resistance_band` · `smith_machine` · `other`

### `type`
`strength` · `cardio` · `flexibility`

### `difficulty`
`beginner` · `intermediate` · `advanced`

---

## Sample Row

```
bench_press | bench-press | Bench Press | King of chest exercises | chest | shoulders|arms | Push | barbell | strength | intermediate | Lie flat on bench|Grip bar wide|Lower to chest|Press up | Keep blades retracted|Control descent | https://... | | | 8.5 | true | 2024-01-01T00:00:00Z
```

---

## Notes

- **Multi-value fields** (secondary_muscles, instructions, tips) use `|` as separator
- **Empty cells** are fine — optional fields are skipped
- **Row order** determines display order in the app
- Add a **Filter** to row 1 in Sheets for easy sorting
- The Apps Script caches responses for 1 hour — clear cache by redeploying or wait
