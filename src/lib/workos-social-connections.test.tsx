/**
 * @vitest-environment jsdom
 */
import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { providerToIcon } from "./workos-social-connections"

describe("providerToIcon", () => {
  it.each(["Google", "Microsoft", "Apple", "GitHub"] as const)(
    "renders an icon for %s",
    (provider) => {
      const { container } = render(<>{providerToIcon(provider)}</>)
      expect(container.querySelector("svg")).not.toBeNull()
    }
  )

  it("returns null for unknown providers", () => {
    const { container } = render(<>{providerToIcon("Unknown")}</>)
    expect(container.firstChild).toBeNull()
  })
})
