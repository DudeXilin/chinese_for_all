# Our FSRS-6 system

This folder contains the Chinese for All application layer built around the original FSRS-6 implementation.

## Responsibilities

- Provide one stable API for every application in the website that needs spaced repetition.
- Keep application code independent from the internal structure of the upstream `ts-fsrs-5.4.2` source.
- Convert FSRS cards and review logs into JSON-safe data that can later be stored in Supabase.
- Keep user-specific parameters separate from the upstream library defaults.

## Current stage

The first integration layer is intentionally database-free. It can:

1. Create a new FSRS card.
2. Preview Again / Hard / Good / Easy.
3. Apply a selected rating.
4. Return serialized card and review-log data.
5. Expose the effective FSRS parameters.

Supabase persistence and user-specific settings will be added in a later step.
