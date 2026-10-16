// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import RouteScrollManager from "./RouteScrollManager";

function NavigationControls() {
  const navigate = useNavigate();
  return (
    <>
      <button onClick={() => navigate("/busca?condominium=genesis-2")}>
        Abrir outro condomínio
      </button>
      <button onClick={() => navigate("/busca?condominium=tambore-2", { replace: true })}>
        Ajustar filtros
      </button>
      <button onClick={() => navigate("/#contato")}>
        Ir ao contato
      </button>
      <button onClick={() => navigate("/admin/leads")}>
        Abrir admin
      </button>
      <button onClick={() => navigate(-1)}>
        Voltar
      </button>
    </>
  );
}

function setup() {
  render(
    <MemoryRouter initialEntries={["/busca?condominium=alphaville-2"]}>
      <RouteScrollManager />
      <NavigationControls />
    </MemoryRouter>
  );
}

describe("RouteScrollManager", () => {
  let scrollTo: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    scrollTo = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    scrollTo.mockRestore();
  });

  it("keeps the initial scroll position on mount", () => {
    setup();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("scrolls to top when navigating to a different condominium on the same pathname", () => {
    setup();
    fireEvent.click(document.querySelector("button")!);
    expect(scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("does not reset scroll for in-place filter normalization using replace", () => {
    setup();
    fireEvent.click(document.querySelectorAll("button")[1]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not override hash anchor navigation", () => {
    setup();
    fireEvent.click(document.querySelectorAll("button")[2]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("does not change the position when entering admin", () => {
    setup();
    fireEvent.click(document.querySelectorAll("button")[3]);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("leaves browser back navigation alone", () => {
    setup();
    fireEvent.click(document.querySelectorAll("button")[0]);
    scrollTo.mockClear();
    fireEvent.click(document.querySelectorAll("button")[4]);
    expect(scrollTo).not.toHaveBeenCalled();
  });
});
