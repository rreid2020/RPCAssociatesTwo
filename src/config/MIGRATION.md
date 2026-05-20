# src/config Migration Note

`src/config` remains the location for static and runtime-safe frontend configuration.

Target additions:
- centralized environment schema guards
- module-level config adapters exposed via `src/services` and `src/app`

No existing config keys should be renamed without compatibility aliases.

