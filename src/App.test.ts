import { mount } from "@vue/test-utils";
import App from "./App.vue";

describe("App", () => {
  it("renders the project title", () => {
    const wrapper = mount(App);
    expect(wrapper.get("h1").text()).toBe("ManaSchmiede");
  });

  it("renders the decklist parser input", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#decklist-input").exists()).toBe(true);
  });

  it("renders the scryfall resolve button", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#resolve-scryfall-button").exists()).toBe(true);
  });

  it("renders the pdf generation button", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#generate-pdf-button").exists()).toBe(true);
  });

  it("renders the options panel controls", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#options-panel").exists()).toBe(true);
    expect(wrapper.find("#include-sideboard").exists()).toBe(true);
    expect(wrapper.find("#fallback-mode").exists()).toBe(true);
    expect(wrapper.find("#layout-mode").exists()).toBe(true);
  });

  it("renders print instructions section", () => {
    const wrapper = mount(App);
    expect(wrapper.find("#print-instructions").exists()).toBe(true);
  });
});
