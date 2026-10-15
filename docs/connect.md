# Connect M3S Councils

Public beta, checked October 14, 2026. The hosted connection is live at `https://councils.middle3rd.com/mcp`. See the verification record below for the checks completed in each client.

The hosted connection needs no local installation, model API key, or M3S account. Your existing AI plan and workspace permissions still apply.

## Claude

1. Open **Customize → Connectors**.
2. Select **+ Add → Add custom connector**.
3. Name it **M3S Councils** and enter `https://councils.middle3rd.com/mcp`.
4. Continue through discovery and select **No sign in**.
5. Finish adding the connector, then enable it in your conversation through **+ → Connectors**.
6. Ask: **“Use the M3S Council to pressure-test this decision: [your decision].”**

Claude's official guide lists custom connectors for Free, Pro, Max, Team, and Enterprise. Free is limited to one custom connector. In Team and Enterprise organizations, an owner or primary owner must add the connector first. An Enterprise custom role with **Manage access to Libraries** permission can also do this. The service must be publicly reachable because Claude connects from Anthropic's infrastructure.

Source: [Claude custom connectors](https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp), checked October 14, 2026.

## ChatGPT

1. On ChatGPT web, open **+ → Add custom MCP server**.
2. Name it **M3S Councils** and enter `https://councils.middle3rd.com/mcp`.
3. Select **No authentication**.
4. Read the connection notice and choose **Create as a plugin**.
5. Install the resulting personal plugin.
6. Start a new conversation, select the plugin with **@**, and ask it to use the M3S Council on your decision.

Custom connections depend on account and workspace permissions. An administrator or Lockdown setting can restrict them. These steps connect a custom server; they do not depend on an entry in a public plugin directory. If the option is absent, use the prompt below or ask your workspace administrator about custom MCP access.

Source: [OpenAI custom MCP server instructions](https://developers.openai.com/api/docs/guides/custom-mcp-server), checked October 14, 2026.

## Your first council

Give your assistant a concrete choice and the context that matters:

```text
Use the M3S Council method to pressure-test this decision.

Decision:
Options, including doing nothing:
Desired outcome:
Facts and sources:
Assumptions and missing information:
Stakeholders and constraints:
Cost of being wrong:
Decision deadline:

Retrieve the method first. Say which execution mode you used.
```

The tool is named `get_council_method`. It takes no arguments and returns public instructions. Your assistant applies them in the conversation. It should produce a decision brief, including the strongest objection and what would change the recommendation.

The connector does not supply independent agents, model inference, or private precedent. Those capabilities depend on the host. The method requires the assistant to describe the mode that actually ran.

## Use the prompt instead

Open [COUNCIL.md](../COUNCIL.md), copy or attach it to your preferred assistant, add your decision brief, and ask it to convene the council. This path needs no MCP connection. The provider's normal usage limits and data settings apply.

## Use the skill instead

The skill lives in [`skills/m3s-council/`](../skills/m3s-council/SKILL.md) and includes its method in `references/COUNCIL.md`. Keep that folder together.

- Claude: download [the skill ZIP](../downloads/m3s-council-skill.zip) and upload it through **Customize → Skills → + → Create skill → Upload a skill**. Skills require code execution to be enabled.
- Codex: copy the `m3s-council` folder into `~/.agents/skills/` for your account or `.agents/skills/` in a project. Invoke `$m3s-council` and give it your decision.
- Other hosts: follow that host's Agent Skills instructions. A skill ZIP is not a universal ChatGPT installer; use the hosted connection or prompt there.

## If it does not connect

- Check that the address ends in `/mcp` and contains no query string or copied punctuation.
- Choose no authentication. There is no M3S key or OAuth account to supply.
- Confirm that your account permits custom connections and the connector is selected for the conversation.
- If the host still cannot connect, use the prompt while the endpoint is checked. A browser displaying an error at `/mcp` does not by itself prove a connection failure; that route expects an MCP request.
- After a tool update in ChatGPT, refresh the connection and start a new conversation. See [OpenAI's connection testing guide](https://developers.openai.com/plugins/deploy/connect-chatgpt).

Read [privacy and data flow](privacy.md) before sharing business context with your AI provider.

## Verification record

Checked October 14, 2026 against deployed Worker version `9cfa0224-60be-4098-a655-71efcabc216a`.

| Check | Result |
| --- | --- |
| Automated suite | 12 tests passed, including modern and legacy SDK connections and HTTP request handling. |
| Live MCP smoke check | Official modern and legacy clients discovered the one read-only tool and retrieved a method whose SHA-256 matched the bundled `COUNCIL.md`. |
| ChatGPT | Installed the custom plugin and completed a fictional pilot/exclusivity council. The output disclosed a single-model role pass, used all five seats, and identified evidence gaps. |
| Claude | Connected successfully and discovered one read-only tool. A full council run is still pending verification. |

These checks establish the behavior observed on that date. They do not measure decision quality or guarantee access in every account.
