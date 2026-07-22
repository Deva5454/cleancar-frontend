/**
 * carManufacturers — the real, structured manufacturer → model data
 * for the Buy Page's vehicle selector.
 *
 * This replaces the free-text "type your car model" box with a real
 * two-step dropdown: pick your manufacturer, then pick your model.
 *
 * Deliberately scoped to the exact same 12 manufacturers and 27 models
 * already recognized by the Buy Page's keyword-detection map
 * (carModelMap in CustomerPlanPage.tsx) - every model here maps to the
 * exact same real category (hatchback/suv/luxury) that map already
 * assigns, so pricing behavior is unchanged, just more reliable: a
 * dropdown selection is a certain match, not a keyword guess.
 *
 * No logo image files are included here. A manufacturer's logo is
 * trademarked - using the real image needs the actual asset sourced
 * from that manufacturer's own official brand/press kit, not copied
 * from a search result. `initials` below is a real, honest placeholder
 * (a short text badge) until real logo assets are sourced and added.
 */

export interface CarModel {
  name: string;
  category: "hatchback" | "suv" | "luxury";
}

export interface CarManufacturer {
  id: string;
  name: string;
  initials: string; // Placeholder badge text, until real logo assets are added
  models: CarModel[];
}

export const CAR_MANUFACTURERS: CarManufacturer[] = [
  {
    id: "maruti-suzuki",
    name: "Maruti Suzuki",
    initials: "MS",
    models: [
      { name: "Swift", category: "hatchback" },
      { name: "Baleno", category: "hatchback" },
      { name: "Dzire", category: "hatchback" },
      { name: "Alto", category: "hatchback" },
      { name: "WagonR", category: "hatchback" },
      { name: "Ertiga", category: "suv" },
      { name: "Ciaz", category: "suv" },
      { name: "Brezza", category: "suv" },
    ],
  },
  {
    id: "hyundai",
    name: "Hyundai",
    initials: "HY",
    models: [
      { name: "i20", category: "hatchback" },
      { name: "Creta", category: "suv" },
      { name: "Venue", category: "suv" },
      { name: "Verna", category: "suv" },
    ],
  },
  {
    id: "tata-motors",
    name: "Tata Motors",
    initials: "TM",
    models: [
      { name: "Tiago", category: "hatchback" },
      { name: "Tigor", category: "hatchback" },
      { name: "Nexon", category: "suv" },
      { name: "Harrier", category: "luxury" },
      { name: "Safari", category: "luxury" },
    ],
  },
  {
    id: "honda",
    name: "Honda",
    initials: "HO",
    models: [
      { name: "Jazz", category: "hatchback" },
      { name: "Amaze", category: "hatchback" },
      { name: "City", category: "suv" },
    ],
  },
  {
    id: "mahindra",
    name: "Mahindra",
    initials: "MH",
    models: [
      { name: "Thar", category: "suv" },
      { name: "XUV300", category: "suv" },
      { name: "XUV700", category: "luxury" },
      { name: "Scorpio", category: "luxury" },
    ],
  },
  {
    id: "ford",
    name: "Ford",
    initials: "FD",
    models: [
      { name: "Figo", category: "hatchback" },
      { name: "EcoSport", category: "suv" },
      { name: "Endeavour", category: "luxury" },
    ],
  },
  {
    id: "volkswagen",
    name: "Volkswagen",
    initials: "VW",
    models: [
      { name: "Polo", category: "hatchback" },
    ],
  },
  {
    id: "kia",
    name: "Kia",
    initials: "KI",
    models: [
      { name: "Seltos", category: "suv" },
    ],
  },
  {
    id: "skoda",
    name: "Skoda",
    initials: "SK",
    models: [
      { name: "Kushaq", category: "suv" },
      { name: "Slavia", category: "suv" },
    ],
  },
  {
    id: "toyota",
    name: "Toyota",
    initials: "TY",
    models: [
      { name: "Innova", category: "suv" },
      { name: "Fortuner", category: "luxury" },
      { name: "Hilux", category: "luxury" },
      { name: "Innova Crysta", category: "luxury" },
    ],
  },
  {
    id: "jeep",
    name: "Jeep",
    initials: "JP",
    models: [
      { name: "Meridian", category: "luxury" },
    ],
  },
  {
    id: "mg",
    name: "MG",
    initials: "MG",
    models: [
      { name: "Gloster", category: "luxury" },
    ],
  },
];
