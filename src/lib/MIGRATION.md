# src/lib Migration Note

`src/lib` is currently a broad utility and client surface.

Strangler target:
- keep stable low-level helpers in `src/lib`
- move domain-specific facades to `src/services`
- move permission contracts to `src/lib/permissions`
- keep backward-compatible re-exports while migrating imports

