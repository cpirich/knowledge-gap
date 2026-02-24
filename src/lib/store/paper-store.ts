import * as fs from "node:fs";
import * as path from "node:path";
import type { Claim, Paper } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const PAPERS_FILE = path.join(DATA_DIR, "papers.json");
const CLAIMS_FILE = path.join(DATA_DIR, "claims.json");

const papers = new Map<string, Paper>();
const claims = new Map<string, Claim>();

let loaded = false;

function ensureDataDir(): void {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
}

function load(): void {
	if (loaded) return;
	ensureDataDir();

	if (fs.existsSync(PAPERS_FILE)) {
		const data = JSON.parse(fs.readFileSync(PAPERS_FILE, "utf-8")) as Paper[];
		for (const paper of data) {
			papers.set(paper.id, paper);
		}
	}

	if (fs.existsSync(CLAIMS_FILE)) {
		const data = JSON.parse(fs.readFileSync(CLAIMS_FILE, "utf-8")) as Claim[];
		for (const claim of data) {
			claims.set(claim.id, claim);
		}
	}

	loaded = true;
}

function persistPapers(): void {
	ensureDataDir();
	fs.writeFileSync(PAPERS_FILE, JSON.stringify([...papers.values()], null, 2));
}

function persistClaims(): void {
	ensureDataDir();
	fs.writeFileSync(CLAIMS_FILE, JSON.stringify([...claims.values()], null, 2));
}

export function addPaper(paper: Paper): void {
	load();
	papers.set(paper.id, paper);
	persistPapers();
}

export function updatePaper(id: string, updates: Partial<Paper>): Paper {
	load();
	const existing = papers.get(id);
	if (!existing) throw new Error(`Paper not found: ${id}`);
	const updated = { ...existing, ...updates };
	papers.set(id, updated);
	persistPapers();
	return updated;
}

export function getPaper(id: string): Paper | undefined {
	load();
	return papers.get(id);
}

export function getAllPapers(): Paper[] {
	load();
	return [...papers.values()];
}

export function deletePaper(id: string): boolean {
	load();
	const existed = papers.delete(id);
	if (existed) {
		// Also delete associated claims
		for (const [claimId, claim] of claims) {
			if (claim.paperId === id) {
				claims.delete(claimId);
			}
		}
		persistPapers();
		persistClaims();
	}
	return existed;
}

export function addClaim(claim: Claim): void {
	load();
	claims.set(claim.id, claim);
	persistClaims();
}

export function getClaim(id: string): Claim | undefined {
	load();
	return claims.get(id);
}

export function getClaimsByPaper(paperId: string): Claim[] {
	load();
	return [...claims.values()].filter((c) => c.paperId === paperId);
}
