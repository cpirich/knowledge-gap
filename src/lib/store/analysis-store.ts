import * as fs from "node:fs";
import * as path from "node:path";
import type { AnalysisResult } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), ".data");
const ANALYSIS_FILE = path.join(DATA_DIR, "analysis.json");

const analyses = new Map<string, AnalysisResult>();

let loaded = false;

function ensureDataDir(): void {
	if (!fs.existsSync(DATA_DIR)) {
		fs.mkdirSync(DATA_DIR, { recursive: true });
	}
}

function load(): void {
	if (loaded) return;
	ensureDataDir();

	if (fs.existsSync(ANALYSIS_FILE)) {
		const data = JSON.parse(fs.readFileSync(ANALYSIS_FILE, "utf-8")) as AnalysisResult[];
		for (const analysis of data) {
			analyses.set(analysis.id, analysis);
		}
	}

	loaded = true;
}

function persist(): void {
	ensureDataDir();
	fs.writeFileSync(ANALYSIS_FILE, JSON.stringify([...analyses.values()], null, 2));
}

export function saveAnalysis(analysis: AnalysisResult): void {
	load();
	analyses.set(analysis.id, analysis);
	persist();
}

export function getAnalysis(id: string): AnalysisResult | undefined {
	load();
	return analyses.get(id);
}

export function getLatestAnalysis(): AnalysisResult | undefined {
	load();
	const all = [...analyses.values()];
	if (all.length === 0) return undefined;
	return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0];
}
