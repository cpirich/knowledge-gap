export type RelationshipType =
	| "supports"
	| "contradicts"
	| "extends"
	| "prerequisite"
	| "parallel"
	| "methodology_shared";

export interface Theme {
	id: string;
	label: string;
	description: string;
	claimIds: string[];
	paperIds: string[];
	density: number;
	parentThemeId?: string;
}

export interface Relationship {
	id: string;
	sourceThemeId: string;
	targetThemeId: string;
	type: RelationshipType;
	strength: number;
	evidence: string;
}
