export function claimExtractionPrompt(
	chunkText: string,
	paperTitle: string,
	authors: string[],
): string {
	return `Extract all distinct claims from the following text chunk of the paper "${paperTitle}" by ${authors.join(", ")}.

For each claim, identify:
- type: one of "assertion", "methodology", "finding", or "citation"
- statement: the core claim in one sentence
- evidence: the supporting text from the chunk
- confidence: "high", "medium", or "low" based on how strongly the text supports the claim
- metadata: optional fields including section, citedSources (array of cited references), and methodology

Return a JSON array of claims. If no claims can be extracted, return an empty array.

Text chunk:
"""
${chunkText}
"""

Respond with ONLY a JSON object in this exact format:
{
  "claims": [
    {
      "type": "finding",
      "statement": "...",
      "evidence": "...",
      "confidence": "high",
      "metadata": {
        "section": "...",
        "citedSources": ["..."],
        "methodology": "..."
      }
    }
  ]
}`;
}

export function themeClusteringPrompt(
	claims: { id: string; statement: string; type: string }[],
): string {
	const claimList = claims.map((c) => `[${c.id}] (${c.type}) ${c.statement}`).join("\n");

	return `Analyze the following claims extracted from academic papers and group them into coherent research themes.

Each theme should:
- Have a short descriptive label (2-5 words)
- Have a clear description of what the theme covers
- Include the IDs of all claims that belong to it
- A claim may belong to multiple themes

Claims:
"""
${claimList}
"""

Respond with ONLY a JSON object in this exact format:
{
  "themes": [
    {
      "label": "Short Theme Label",
      "description": "A sentence describing this research theme",
      "claimIds": ["claim_id1", "claim_id2"]
    }
  ]
}`;
}

export function relationshipMappingPrompt(
	themes: { id: string; label: string; description: string }[],
): string {
	const themeList = themes.map((t) => `[${t.id}] "${t.label}": ${t.description}`).join("\n");

	return `Analyze the following research themes and identify relationships between them.

For each pair of related themes, determine:
- type: one of "supports", "contradicts", "extends", "prerequisite", "parallel", "methodology_shared"
- strength: a number from 0 to 1 indicating how strong the relationship is
- evidence: a brief explanation of why this relationship exists

Only include pairs that have a meaningful relationship. Not all themes need to be related.

Themes:
"""
${themeList}
"""

Respond with ONLY a JSON object in this exact format:
{
  "relationships": [
    {
      "sourceThemeId": "theme_id1",
      "targetThemeId": "theme_id2",
      "type": "supports",
      "strength": 0.8,
      "evidence": "Brief explanation of the relationship"
    }
  ]
}`;
}

export function contradictionDetectionPrompt(
	claimPairs: {
		claimA: { id: string; paperId: string; statement: string; evidence: string };
		claimB: { id: string; paperId: string; statement: string; evidence: string };
	}[],
): string {
	const pairList = claimPairs
		.map(
			(p, i) =>
				`Pair ${i + 1}:\n  Claim A [${p.claimA.id}] (paper: ${p.claimA.paperId}): ${p.claimA.statement}\n    Evidence: ${p.claimA.evidence}\n  Claim B [${p.claimB.id}] (paper: ${p.claimB.paperId}): ${p.claimB.statement}\n    Evidence: ${p.claimB.evidence}`,
		)
		.join("\n\n");

	return `Analyze the following pairs of claims from academic papers and identify any contradictions between them.

For each contradictory pair, provide:
- claimAId and claimBId: the IDs of the contradicting claims
- paperAId and paperBId: the IDs of their source papers
- description: what the contradiction is about
- severity: "critical" (fundamental disagreement), "major" (significant difference), or "minor" (nuanced difference)
- category: one of "direct_conflict", "methodological", "scope_difference", "temporal", "interpretation"
- resolution: optional suggestion for resolving the contradiction

Only include pairs that genuinely contradict each other. Return an empty array if no contradictions exist.

Claim pairs:
"""
${pairList}
"""

Respond with ONLY a JSON object in this exact format:
{
  "contradictions": [
    {
      "claimAId": "id",
      "claimBId": "id",
      "paperAId": "id",
      "paperBId": "id",
      "description": "Description of the contradiction",
      "severity": "major",
      "category": "direct_conflict",
      "resolution": "Optional resolution suggestion"
    }
  ]
}`;
}

export function gapAnalysisPrompt(
	themes: { id: string; label: string; description: string; density: number }[],
	relationships: { sourceThemeId: string; targetThemeId: string; type: string }[],
	contradictionAreas: string[],
): string {
	const themeList = themes
		.map((t) => `[${t.id}] "${t.label}" (density: ${t.density.toFixed(2)}): ${t.description}`)
		.join("\n");
	const relList = relationships
		.map((r) => `${r.sourceThemeId} --[${r.type}]--> ${r.targetThemeId}`)
		.join("\n");
	const contradictionList =
		contradictionAreas.length > 0 ? contradictionAreas.join("\n") : "None identified";

	return `Analyze the following research landscape and identify knowledge gaps — areas that are understudied, missing, or need further investigation.

Themes:
"""
${themeList}
"""

Relationships between themes:
"""
${relList}
"""

Areas with contradictions:
"""
${contradictionList}
"""

For each gap, provide:
- title: short descriptive title
- description: detailed explanation of the gap
- type: one of "unexplored_intersection" (theme pairs with no relationship), "sparse_coverage" (low-density themes), "methodological_gap" (missing methods), "temporal_gap" (outdated research), "contradictory_area" (unresolved contradictions)
- relatedThemeIds: IDs of themes related to this gap
- confidence: 0-1 score of how confident you are this is a real gap
- evidence: what evidence points to this gap
- potentialImpact: why filling this gap matters

Respond with ONLY a JSON object in this exact format:
{
  "gaps": [
    {
      "title": "Gap Title",
      "description": "Detailed description",
      "type": "unexplored_intersection",
      "relatedThemeIds": ["theme_id1", "theme_id2"],
      "confidence": 0.8,
      "evidence": "Evidence for the gap",
      "potentialImpact": "Why this gap matters"
    }
  ]
}`;
}

export function questionGenerationPrompt(
	gaps: { id: string; title: string; description: string; type: string; potentialImpact: string }[],
	themes: { id: string; label: string }[],
): string {
	const gapList = gaps
		.map(
			(g) => `[${g.id}] "${g.title}" (${g.type}): ${g.description}\n  Impact: ${g.potentialImpact}`,
		)
		.join("\n\n");
	const themeList = themes.map((t) => `[${t.id}] "${t.label}"`).join(", ");

	return `Based on the following knowledge gaps identified in academic research, generate 1-3 research questions per gap.

Gaps:
"""
${gapList}
"""

Available themes for reference: ${themeList}

For each question, provide:
- gapId: the ID of the gap this question addresses
- question: a clear, specific research question
- rationale: why this question is important
- relatedThemeIds: IDs of related themes
- suggestedMethodology: optional suggestion for research methodology
- priorityScore: 0-1 score based on the gap's type and confidence

Respond with ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "gapId": "gap_id",
      "question": "What is the effect of X on Y?",
      "rationale": "Why this matters",
      "relatedThemeIds": ["theme_id1"],
      "suggestedMethodology": "Randomized controlled trial",
      "priorityScore": 0.85
    }
  ]
}`;
}

export function metadataExtractionPrompt(text: string): string {
	const preview = text.slice(0, 3000);
	return `Extract the metadata from the beginning of this academic paper.

Text (first ~3000 characters):
"""
${preview}
"""

Respond with ONLY a JSON object in this exact format:
{
  "title": "The full title of the paper",
  "authors": ["Author One", "Author Two"],
  "abstract": "The full abstract text, or empty string if not found"
}`;
}
