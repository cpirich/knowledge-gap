import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SeverityBadge } from "@/components/contradictions/severity-badge";

describe("SeverityBadge", () => {
	it("renders critical severity with red background", () => {
		render(<SeverityBadge severity="critical" />);
		const badge = screen.getByText("critical");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("bg-red-500");
	});

	it("renders major severity with orange background", () => {
		render(<SeverityBadge severity="major" />);
		const badge = screen.getByText("major");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("bg-orange-500");
	});

	it("renders minor severity with yellow background", () => {
		render(<SeverityBadge severity="minor" />);
		const badge = screen.getByText("minor");
		expect(badge).toBeInTheDocument();
		expect(badge.className).toContain("bg-yellow-500");
	});
});
