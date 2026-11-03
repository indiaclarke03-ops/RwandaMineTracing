# Ground Control — assistant instructions

Project rules live in docs/PROJECT_RULES.md and are binding:
@docs/PROJECT_RULES.md

Workflow:
- Hand-curated inputs live in `pipeline/seed/*.json`. Never hand-edit `/data`; run
  `python3 pipeline/build.py` to validate the seed and write `/data`.
- The build fails on unsourced rows, unknown source ids, bad evidence tiers,
  broken references or malformed dates. Fix the seed, not the validator.
- Research logs (Sayari calls, Tavily verification) go in `pipeline/notes/`.
- On this Mac, `python3` may hit an Xcode licence error; use
  `/Library/Developer/CommandLineTools/usr/bin/python3` instead.
