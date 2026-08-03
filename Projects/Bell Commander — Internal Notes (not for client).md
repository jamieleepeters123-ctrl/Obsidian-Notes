# Bell Commander — Internal Notes (not for client)

Everything here is real, relevant to the project, and relevant to me as the designer/builder — none of it belongs in front of a client or in a sales conversation. Written 2 Aug 2026 while pulling together [the client/office-staff progress report](Beyond Bell Commander.md) so the two don't get mixed up later. Check this before reusing any older doc, screenshot, or draft in client-facing material.

## Archived plans — don't resurrect without knowing why they died
- [[Bell Commander Product Plan v0.1]] + [[Bell Commander Hardware Options]] — the original Crestron RMC4/CP4 + C#/SIMPL# + tiered Core/Plus/Pro commercial plan. **Confirmed dead 2 Aug 2026**: superseded by Architecture v2 (the actual Python/Linux appliance) with zero further Crestron work since. Both docs now carry an archive banner. If a client or a new hire ever finds these in a search, the banner explains it — but don't let either doc's pricing tables, BOM, or tier names leak into anything client-facing. None of that pricing was ever finalized anyway (every number in it is marked ❓).
- The full VZX-8 sidebar reskin (console nav restructure — DSP/Media Player promoted to top-level, `.sidebar`/`.topbar` shell) was fully planned and built, then explicitly rejected on sight ("i dont like it" / "wrong approach altogether, let's rethink it") and cleanly reverted, nothing committed. **Don't re-propose this exact direction** — the underlying complaint it was trying to solve (Zones tab vs Setup's Sounds & Zones reading as the same thing) was real and got fixed properly afterward, one incremental change at a time, merging zone definitions into the live Zones tab instead of a nav overhaul.

## Unbuilt concepts — real ideas, not yet product
- **[[New features i want to explore|Client discovery/quoting web page]]** — a client-facing page to *collect* info (school name, zones, mic types, custom bells, EVAC count, current pain points) that doubles as both a quoting tool and the actual commissioning input. Good idea, not built. Note the irony if this ever gets confused with the progress-report artifact: that one is for *showing* a client the finished product; this concept is for *extracting information from* a prospective client before a system exists. Different job, don't merge them.
- **Commissioning Agent** — a real step-by-step commissioning wizard (admin + end-user paths) to replace the setup flow that's grown organically feature-by-feature. Would meaningfully de-risk a new site bring-up but is a real chunk of design + build work, not scoped yet.
- Remote fleet monitoring (the "phone-home portal" in [[Bell Commander Telemetry]]) is a *decided* architecture (outbound HTTPS, office-hosted Docker portal) but still genuinely unbuilt — it's fine to say "in progress" to a client (as the artifact does), just don't imply it exists yet if asked for specifics.

## Things that must never appear in client material
- Any real internal IP address, hostname, or the "Xilica POC" repurposing detail — the office prototype is a real school's live system temporarily standing in for bench testing; a client seeing that framing would reasonably ask uncomfortable questions.
- `BC_ADMIN_PASSWORD` and the fact it's currently a weak 4-digit value (`2036`), or any other credential — see [[Backups]] §4, already deliberately kept out of the vault's own git history for the same reason.
- Specific real-school names (e.g. Campbelltown PS) used as a demo/reference site for a *different* prospective client, without that school's own permission — the progress-report artifact deliberately genericized the live prototype to "a live prototype site" for this reason.
- Blow-by-blow bug postmortems (stack traces, specific vendor firmware quirks, misspelled control tags in someone else's project export, etc.) — the *fact* that real bugs were found and fixed through testing is a genuine reliability selling point (and is in the artifact, translated into plain outcomes); the raw technical detail is not.
- Made-up pricing, tiers, or timelines — none were ever actually decided (see the archived plan above). If a client asks for pricing, that's a real conversation to have deliberately, not something to improvise from an old draft.

## Where the real status lives
[[Beyond Bell Commander]] is the single source of truth for current architecture and the full dated build history — that's what the progress-report artifact was built from. [[Open Items]] and [[Bugs]] track the real engineering backlog (useful for me, not for a client meeting). This note is specifically the *filter* between those and anything client-facing — update it whenever something moves from "idea" to "built" or from "internal" to "safe to show."

## Related
[[Beyond Bell Commander]] · [[Open Items]] · [[Bugs]] · [[Backups]] · [[New features i want to explore]]

#bns #project/bell-commander #internal
