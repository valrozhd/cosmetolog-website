export type Service = {
  id: string;
  name: string;
  description: string;
  cost: number;
  duration: number;
  notes: string;
  isVisible: boolean;
  isSample: boolean;
};

export const starterServices: Service[] = [
  {
    id: "sample-consultation",
    name: "Skin consultation",
    description: "A one-to-one consultation to discuss your skin, routine, and treatment goals.",
    cost: 900,
    duration: 30,
    notes: "Sample details. Replace with your own service information before publishing.",
    isVisible: false,
    isSample: true,
  },
  {
    id: "sample-hydrating-facial",
    name: "Hydrating facial",
    description: "A soothing facial focused on restoring moisture and leaving skin feeling refreshed.",
    cost: 1500,
    duration: 60,
    notes: "Sample details. Replace with your own service information before publishing.",
    isVisible: false,
    isSample: true,
  },
  {
    id: "sample-chemical-peel",
    name: "Chemical peel",
    description: "A personalized exfoliating treatment selected to suit your skin and its needs.",
    cost: 1800,
    duration: 45,
    notes: "Sample details. Replace with your own service information before publishing.",
    isVisible: false,
    isSample: true,
  },
];

const servicesStorageKey = "cosmetolog-demo-services";
const servicesChangeEvent = "cosmetolog-demo-services-change";

export function subscribeToServices(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(servicesChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(servicesChangeEvent, callback);
  };
}

export function getServicesSnapshot() {
  return localStorage.getItem(servicesStorageKey) ?? JSON.stringify(starterServices);
}

export function getServerServicesSnapshot() {
  return JSON.stringify(starterServices);
}

export function parseServices(snapshot: string): { services: Service[]; error: string | null } {
  try {
    const parsed: unknown = JSON.parse(snapshot);
    if (!Array.isArray(parsed) || !parsed.every(isService)) {
      return { services: [], error: "Saved services are invalid. Reset the service list to continue." };
    }

    return { services: parsed, error: null };
  } catch {
    return { services: [], error: "Saved services could not be read. Reset the service list to continue." };
  }
}

export function saveServices(services: Service[]) {
  localStorage.setItem(servicesStorageKey, JSON.stringify(services));
  window.dispatchEvent(new Event(servicesChangeEvent));
}

function isService(value: unknown): value is Service {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    typeof value.id === "string" &&
    "name" in value &&
    typeof value.name === "string" &&
    "description" in value &&
    typeof value.description === "string" &&
    "cost" in value &&
    typeof value.cost === "number" &&
    Number.isFinite(value.cost) &&
    value.cost >= 0 &&
    "duration" in value &&
    typeof value.duration === "number" &&
    Number.isInteger(value.duration) &&
    value.duration > 0 &&
    "notes" in value &&
    typeof value.notes === "string" &&
    "isVisible" in value &&
    typeof value.isVisible === "boolean" &&
    "isSample" in value &&
    typeof value.isSample === "boolean"
  );
}
