# M3S Councils

**Hear the case you haven't made.**

Bring a business decision to five AI perspectives: Counterparty, Contrarian, CFO, Operator, and Precedent. Each perspective checks a different business constraint. The council leaves you with a recommendation and the strongest objection to it. You still choose.

A Boot Room Labs experiment from [Middle 3rd Solutions](https://middle3rd.com).

> Release candidate: the hosted URL and public repository below are proposed and have not yet been verified. This package is being prepared for review.

## Connect in Claude or ChatGPT

Proposed MCP server URL:

```text
https://councils.middle3rd.com/mcp
```

Add the connection using the [setup guide](docs/connect.md). Then ask your assistant:

> Use the M3S Council to pressure-test this decision: should we accept an exclusive partnership? Our alternatives are a limited pilot or declining. Ask for the context you need before making a recommendation.

The connector supplies the public method. Your assistant runs the council in your conversation. No local installation or M3S API key is required for the hosted connection. Access to custom connections depends on your AI plan and workspace settings.

## What to bring

Bring a partnership offer or your next hire. Start with a decision where the tradeoff matters.

Include the options, your desired outcome, the facts you know, the assumptions you are making, and the cost of being wrong. The method helps distinguish those inputs instead of filling the gaps with invented evidence.

You get a compact brief with a recommendation, its strongest objection, the evidence that would change it, the cost of success, and the smallest useful next test. You own the decision.

### A fictional decision brief

A prospective partner asks for territory exclusivity before proving demand. This prewritten example illustrates the output; it is not a recorded council run.

| Part of the brief | Example |
| --- | --- |
| Recommendation | Propose a limited pilot before committing the territory. |
| Strongest objection | The partner may walk away without exclusivity. |
| What changes the answer | Evidence of demand and a credible commitment from the partner. |
| Cost of success | Someone must carry the onboarding and delivery work; capacity is still unverified. |
| Next test | Ask the partner to name the pilot accounts and agree on delivery responsibilities before negotiating broader rights. |

## Prefer a prompt or skill?

- Prompt: copy or attach [COUNCIL.md](COUNCIL.md) to your assistant, add your decision, and ask it to convene the council.
- Skill: download [m3s-council-skill.zip](downloads/m3s-council-skill.zip), then install it in a compatible host using the [skill setup instructions](docs/connect.md#use-the-skill-instead).
- Build your own: inspect the source and follow the [self-hosting guide](docs/self-host.md).

## What this experiment tests

Can giving different reasoning methods an explicit job make business decisions easier to inspect? Judge a run by the assumption it exposes or the next step it changes.

In ordinary chat, one model plays the seats. Where supported, separate agents can produce the first passes. The output must say which mode ran. Neither mode guarantees accuracy or removes shared model bias.

The method tool takes no decision text. Your conversation stays subject to your AI provider's settings. Read the [privacy note](docs/privacy.md) for what the hosted connection and infrastructure process.

## Source and status

The intended public home is `3rts0n/m3s-councils`; publication is pending. The same method powers the prompt, skill, and connector. [Sources and provenance](SOURCES.md) explain its lineage and technical references.

The method, code, and documentation are licensed under [Apache-2.0](LICENSE).
