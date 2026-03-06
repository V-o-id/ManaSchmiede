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
});
