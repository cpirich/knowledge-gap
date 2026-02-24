import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { UploadProgress } from "@/components/upload/upload-progress";

afterEach(cleanup);

describe("UploadProgress", () => {
	it("returns null when not visible", () => {
		const { container } = render(<UploadProgress progress={50} visible={false} />);
		expect(container.firstChild).toBeNull();
	});

	it("renders progress bar when visible", () => {
		render(<UploadProgress progress={50} visible={true} />);
		expect(screen.getByRole("progressbar")).toBeInTheDocument();
	});

	it("shows correct stage label for early progress", () => {
		const { container } = render(<UploadProgress progress={10} visible={true} />);
		const label = container.querySelector(".font-medium");
		expect(label?.textContent).toContain("Extracting text");
	});

	it("shows correct stage label for mid progress", () => {
		const { container } = render(<UploadProgress progress={30} visible={true} />);
		const label = container.querySelector(".font-medium");
		expect(label?.textContent).toContain("Chunking");
	});

	it("shows correct stage label for late progress", () => {
		const { container } = render(<UploadProgress progress={60} visible={true} />);
		const label = container.querySelector(".font-medium");
		expect(label?.textContent).toContain("Extracting claims");
	});

	it("shows percentage", () => {
		const { container } = render(<UploadProgress progress={70} visible={true} />);
		expect(container.textContent).toContain("70%");
	});
});
