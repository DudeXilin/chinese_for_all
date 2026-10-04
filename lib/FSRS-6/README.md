# FSRS-6

This directory contains the FSRS-6 spaced-repetition system used by Chinese for All.

## Structure

- `ts-fsrs-5.4.2/` — the original upstream `ts-fsrs` source code. This copy is kept separately and should not be mixed with our application-specific logic.
- `our_system/` — the Chinese for All implementation layer responsible for integrating and using FSRS-6 across our website. Application-specific logic, data handling, and future integrations belong here.

The original library is kept intact so that the upstream implementation remains clearly separated from our own system.
