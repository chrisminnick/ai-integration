## 9.1 AI-Assisted Writing and Summarization

The first step in most writing projects is a content brief. A good brief defines the type of content you're trying to produce, your intended audience, and any specific messages or terms that need to be included (or avoided). In SPOT, briefs are passed in as JSON and used to generate a structured outline of the piece. This structured outline is called a **scaffold**.

The goal of the scaffold step is to produce a complete plan for the piece before the model starts generating full paragraphs. This improves response speed, reduces drift, and gives your application more control over what’s being created. Later sections can be expanded one at a time—on demand, in parallel, or inside a streaming UI.

SPOT supports this scaffold-first approach out of the box. Here's how it works.

---

### Generate a Scaffold from a Brief

To scaffold a new piece of content:

```bash
npm run scaffold -- \
  --asset_type "landing page" \
  --topic "privacy-first analytics" \
  --audience "startup founders" \
  --tone "confident" \
  --word_count 600
```

This command uses the versioned template `draft_scaffold@1.0.0.json` and returns a structured outline in JSON format. The result includes a list of sections with headings, summaries, and word count targets.

You can also generate scaffolds interactively using:

```bash
npm start
```

Once you have a scaffold, you can expand any section using the `expand` command and pass in a specific section object:

```bash
npm run expand -- \
  --section_json '{"heading":"Why Privacy Matters","bullets":["Build trust","Comply with GDPR"],"context":"Landing page for privacy-first analytics"}'
```

This separation between **scaffolding** and **expansion** makes it easy to plug AI into real-world workflows where drafts are reviewed, edited, or selectively generated.

---

### Rewrite and Localize Content

Rewriting is one of the most practical GenAI features to build. It’s useful for adjusting tone, simplifying language, tailoring for different audiences, or localizing content for other regions. SPOT exposes a simple API for this:

```bash
npm run rewrite -- \
  --text "Original content goes here." \
  --audience "CFOs" \
  --tone "formal" \
  --grade_level 9 \
  --words 140 \
  --locale "en-GB"
```

The prompt template accepts any combination of tone, reading level, locale, and audience parameters. You can hard-code defaults into the template, pull them from your CMS, or allow users to set them at runtime.

This is especially useful in marketing, support, and documentation tools that target different roles or regions. Rewrites can happen inline, with a diff view for editors, or behind a “Simplify” button in your UI.

---

### Generate Grounded Summaries with Citations

Summarization is another core pattern in content applications—but like rewriting, it’s not one-size-fits-all. That’s why SPOT supports different **summarization modes**:

- `executive`: a high-level summary of the main ideas
- `action-only`: filter for decisions and next steps
- `timeline`: chronological highlights
- `headlines`: punchy sentence-style outputs

To generate a summary from a transcript file:

```bash
npm run summarize -- \
  --file golden_set/transcripts/build-ai-applications-1.txt \
  --mode executive
```

The result includes inline citations (e.g. timestamps) based on the original source, which are especially helpful for meeting recaps, podcast highlights, or compliance documentation.

Because all outputs follow a consistent JSON schema, it’s easy to plug them into other workflows—like ticket creation, stakeholder emails, or CMS drafts.

---

### Repurpose Long Content for Multiple Channels

Repurposing takes one input—like a blog post, webinar transcript, or product page—and produces multiple outputs tailored for different platforms: email, LinkedIn, X (formerly Twitter), and so on.

Run the repurposing flow with:

```bash
npm run repurpose -- \
  --file golden_set/repurposing/article_medium_remote_teams.md
```

The output is a structured JSON file with keys for each channel. For example:

```json
{
  "email": "...",
  "linkedin": "...",
  "x": "...",
  "title": "...",
  "cta": "..."
}
```

Each channel has a tuned tone, word limit, and formatting style based on the output configuration. You can edit these rules in `configs/channels.json`, or create your own versioned repurpose template for A/B testing.

---

### Enforce Brand Voice and Style Governance

To maintain consistency, SPOT includes a built-in **style pack** that checks for:

- Required terms
- Prohibited jargon
- Reading level targets
- Tone and formatting expectations

After generation, each piece of content is passed through the style linter. This helps enforce voice consistency across sections and across authors, which is critical in branded applications.

You can customize the style pack in `style/style_pack.json` and run checks like this:

```bash
npm run lint
```

This is especially useful in pre-publish review pipelines or in UI editors that show warnings or “fix it” suggestions.

---

### Structured Outputs for Pipelines

If you need structured output for a CMS, publishing pipeline, or API call, you can request JSON-formatted responses from any template.

All prompt templates in SPOT return structured data by default. For example, `repurpose_pack@1.0.0.json` outputs structured keys for:

- `headline`
- `meta_description`
- `tags`
- `email`, `linkedin`, `x`

Use these outputs directly in automation or apply schema validation post-generation. This is especially important when you're building auto-publishing or headless CMS integrations.

---

### Evaluate Prompt Performance with the Golden Set

SPOT includes a full evaluation framework using a “golden set” of briefs, transcripts, and source files. Each test includes expected behavior and is scored against your prompt templates.

Run the full suite like this:

```bash
npm run eval:all
```

Or run by task:

```bash
npm run eval:scaffold
npm run eval:expand
npm run eval:rewrite
```

Each evaluation computes style violations, reading level compliance, latency, token usage, and more. This helps you benchmark across providers, measure prompt drift, and improve reliability.

---

### Test Accessibility and Inclusion

You can also use SPOT to generate or test for:

- Plain language (via reading level checks)
- Inclusive language (via must-avoid lists)
- Regional formats (locale-aware spelling and phrasing)
- Alt text for media
- Caption generation (via summaries of transcripts)

These are all configurable in the style pack, and they’re enforceable through the same evaluation and linting pipeline.

---

### Legal and IP Guardrails

AI-generated content raises important legal concerns. While SPOT doesn’t do legal filtering by default, it provides hooks for:

- Labeling outputs as “AI-assisted”
- Running third-party plagiarism checks
- Tracking citations and source attribution
- Logging every input/output pair with timestamps
- Using a mock provider for safe evaluation (no API costs)

If you’re deploying in a commercial setting, use the logging and structured output features to maintain an audit trail and support user disclosures.

---

### Integration Patterns

The CLI is great for prototyping, but you’ll likely want to wire these features into your own application. SPOT's modular design makes this easy.

Here are some common integration points:

- **Scaffold → Expand**: Use in a CMS sidebar to draft new posts
- **Rewrite**: Add a “Make this simpler” or “Rephrase” button in an editor
- **Summarize**: Auto-generate meeting summaries or ticket recaps
- **Repurpose**: Let users turn blog posts into email blasts in one click
- **Evaluate**: Run daily tests to verify provider performance or style compliance

The orchestration logic lives in `src/SPOT.js`, and each CLI command is available via Node or through shell execution from your own app.
