// Job Checklist Tab - Core execution with before/after photos

import { useState, useEffect, useRef } from "react";

import { Card, CardContent } from "../ui/card";

import { Button } from "../ui/button";

import { Progress } from "../ui/progress";

import { Checkbox } from "../ui/checkbox";

import { Textarea } from "../ui/textarea";

import { JobActivityTracker } from "./JobActivityTracker";

import {

  Collapsible,

  CollapsibleContent,

  CollapsibleTrigger,

} from "../ui/collapsible";

import {

  Dialog,

  DialogContent,

  DialogDescription,

  DialogFooter,

  DialogHeader,

  DialogTitle,

} from "../ui/dialog";

import {

  Camera,

  ChevronDown,

  ChevronUp,

  Check,

  X,

  AlertCircle,

  Upload,

  Video,

} from "lucide-react";

import { Badge } from "../ui/badge";

import { toast } from "sonner";



interface ChecklistItem {

  id: string;

  name: string;

  completed: boolean;

  skipped: boolean;

  skipReason?: string;

}



interface ChecklistSection {

  id: string;

  name: string;

  items: ChecklistItem[];

  isOpen: boolean;

}



import { computePeriodicFlagsB } from "../../services/periodicScheduleService";

import { periodicScheduleService } from "../../services/periodicScheduleService";



// ── Plan-aware checklist builder ──────────────────────────────────────────────

// Builds the correct sections based on job.packageType + today's periodic flags.

// EXPRESS_WASH:   Exterior (daily water wash + weekly tyre spray) + Quality only

// SMART_WASH: Exterior + [Shampoo 2×/month] + [Interior Vacuum 2×/month] + [Tyre Dressing 1×/month] + Quality

// ELITE_WASH:   Exterior + [Shampoo 4×/month] + [Dashboard 2×/month] + [Interior 2×/month] + [Tyre 2×/month] + [Wax 1×/month] + [Engine Bay 1×/month] + Quality



function buildChecklistSections(job: any): ChecklistSection[] {

  const flags = computePeriodicFlagsB(

    job.id,

    job.packageType ?? job.planType ?? "EXPRESS_WASH",

    job.subscriptionStartDate,

  );



  const exteriorSection: ChecklistSection = {

    id: "exterior", name: "Exterior Wash", isOpen: true,

    items: [

      { id: "ext-1", name: "Pre-rinse vehicle body — dust + loose dirt",     completed: false, skipped: false },

      { id: "ext-2", name: "Rinse all panels — pressure spray, top to bottom",  completed: false, skipped: false },

      { id: "ext-3", name: "Scrub body panels with microfibre mitt",          completed: false, skipped: false },

      { id: "ext-4", name: "Clean wheels, tyres, mudguard",                   completed: false, skipped: false },

      { id: "ext-5", name: "Rinse thoroughly — no shampoo residue",           completed: false, skipped: false },

      { id: "ext-6", name: "Dry with microfibre towel — no water marks",      completed: false, skipped: false },

      { id: "ext-7", name: "Mirrors, door handles, number plate cleaned",     completed: false, skipped: false },

    ],

  };



    const shampooSection: ChecklistSection = {

    id: "shampoo",

    name: "🧴 Shampoo Wash", isOpen: true,

    items: [

      { id: "sha-1", name: "Apply car-safe shampoo foam — spray evenly, all panels",         completed: false, skipped: false },

      { id: "sha-2", name: "Work foam with microfibre mitt — circular motion, panel by panel", completed: false, skipped: false },

      { id: "sha-3", name: "Full rinse — zero soap residue on any panel",                     completed: false, skipped: false },

      { id: "sha-4", name: "Glass cleaned outside — windscreen, rear, side windows",           completed: false, skipped: false },

      { id: "sha-5", name: "Final microfibre dry — no water marks",                           completed: false, skipped: false },

      { id: "sha-6", name: "Before + after VIDEO uploaded (required for shampoo wash)",       completed: false, skipped: false },

    ],

  };



    const waxSection: ChecklistSection = {

    id: "wax",

    name: "✨ Full Hand Wax Polish", isOpen: true,

    items: [

      { id: "wax-1", name: "Shampoo wash complete first — car must be clean and dry",          completed: false, skipped: false },

      { id: "wax-2", name: "Apply wax one panel at a time — do not spread over whole car",      completed: false, skipped: false },

      { id: "wax-3", name: "Buff each panel — circular motion, low pressure, check for haze",  completed: false, skipped: false },

      { id: "wax-4", name: "Bonnet and boot last — hero reflection check",                     completed: false, skipped: false },

      { id: "wax-5", name: "No wax on glass — outer body panels only",                        completed: false, skipped: false },

      { id: "wax-6", name: "Before + after photo sent on WhatsApp",                           completed: false, skipped: false },

    ],

  };



  const glassSection: ChecklistSection = {

    id: "glass",

    name: `Glass Cleaning — Aaj ka schedule hai 🪟`,

    isOpen: true,

    items: [

      { id: "gl-1", name: "Spray glass cleaner on windscreen — inside and outside", completed: false, skipped: false },

      { id: "gl-2", name: "Wipe with glass-only cloth — no smears",                  completed: false, skipped: false },

      { id: "gl-3", name: "Rear windscreen + side windows — same process",            completed: false, skipped: false },

      { id: "gl-4", name: "Check in sunlight — no streaks visible",                   completed: false, skipped: false },

    ],

  };



    const dashboardSection: ChecklistSection = {

    id: "dashboard",

    name: "🧹 Dashboard & Console Deep Clean", isOpen: true,

    items: [

      { id: "dash-1", name: "Dashboard polish — wipe panel by panel",                         completed: false, skipped: false },

      { id: "dash-2", name: "Console polish — gear surround, centre console, cupholders",      completed: false, skipped: false },

      { id: "dash-3", name: "Door pads — wipe + polish all 4 doors",                          completed: false, skipped: false },

      { id: "dash-4", name: "AC vents — blow clean with compressed air or soft brush",         completed: false, skipped: false },

      { id: "dash-5", name: "Before + after photo sent on WhatsApp",                          completed: false, skipped: false },

    ],

  };



  const tyreSection: ChecklistSection = {

    id: "tyre",

    name: `Tyre Dressing — Aaj ka schedule hai 🛞`,

    isOpen: true,

    items: [

      { id: "ty-1", name: "Clean tyre sidewall — remove dust and old product", completed: false, skipped: false },

      { id: "ty-2", name: "Apply tyre dressing with sponge — all 4 tyres",     completed: false, skipped: false },

      { id: "ty-3", name: "Let sit 2 minutes — do not wipe off",                completed: false, skipped: false },

    ],

  };



  const interiorSection: ChecklistSection = {

    id: "interior",

    name: `Interior Vacuum — Aaj ka schedule hai 🪣`,

    isOpen: true,

    items: [

      { id: "int-1", name: "Remove floor mats — shake out loose dirt",           completed: false, skipped: false },

      { id: "int-2", name: "Vacuum cabin floor + under seats",                    completed: false, skipped: false },

      { id: "int-3", name: "Vacuum both front and rear seats",                    completed: false, skipped: false },

      { id: "int-4", name: "Vacuum boot / dicky area",                            completed: false, skipped: false },

      { id: "int-5", name: "Seat cover pockets + door pad pockets — vacuum out",  completed: false, skipped: false },

      { id: "int-6", name: "Replace floor mats — check alignment",                completed: false, skipped: false },
      { id: "int-7", name: "Before + after VIDEO uploaded (required for interior clean)",  completed: false, skipped: false },

    ],

  };



    const engineSection: ChecklistSection = {

    id: "engine",

    name: "⚙️ Engine Bay Dry Blow", isOpen: true,

    items: [

      { id: "eng-1", name: "⚠️ STRICTLY DRY ONLY — no water in engine bay under any circumstances", completed: false, skipped: false },

      { id: "eng-2", name: "Dry blow with compressed air / blower — remove dust and debris",   completed: false, skipped: false },

      { id: "eng-3", name: "Check bonnet hinge area — dust cleared",                          completed: false, skipped: false },

      { id: "eng-4", name: "Close bonnet fully — confirm latch",                               completed: false, skipped: false },

      { id: "eng-5", name: "Before + after photo sent on WhatsApp",                           completed: false, skipped: false },

    ],

  };



  const fragranceSection: ChecklistSection = {

    id: "fragrance",

    name: "🌸 Car Fragrance Application", isOpen: true,

    items: [

      { id: "fra-1", name: "Interior dry and windows up before applying fragrance",    completed: false, skipped: false },

      { id: "fra-2", name: "Spray fragrance — 2-3 short bursts, not directly on seats", completed: false, skipped: false },

      { id: "fra-3", name: "Close doors for 1 minute — allow fragrance to settle",      completed: false, skipped: false },

      { id: "fra-4", name: "Before + after photo sent on WhatsApp",                     completed: false, skipped: false },

    ],

  };



    const qualitySection: ChecklistSection = {

    id: "quality", name: "Quality Check", isOpen: true,

    items: [

      { id: "qc-1", name: "Check for water spots on body panels",      completed: false, skipped: false },

      { id: "qc-2", name: "All panels clean — no missed spots",         completed: false, skipped: false },

      { id: "qc-3", name: "Windows streak-free",                        completed: false, skipped: false },

      { id: "qc-4", name: "Tyres clean and dry",                        completed: false, skipped: false },

      { id: "qc-5", name: "Final walk-around inspection",               completed: false, skipped: false },

    ],

  };



  // ── NEW SECTIONS for previously missing deliverables ─────────────────────

  const underbodySection: ChecklistSection = {
    id: "underbody", name: "💧 Underbody Flush", isOpen: true,
    items: [
      { id: "ub-1", name: "Position pressure gun under the vehicle — front to rear",  completed: false, skipped: false },
      { id: "ub-2", name: "Flush both sides of underbody — remove road grime",         completed: false, skipped: false },
      { id: "ub-3", name: "Flush wheel arches all 4 corners",                          completed: false, skipped: false },
      { id: "ub-4", name: "Allow to drip dry — do not use cloth under vehicle",        completed: false, skipped: false },
    ],
  };

  const exterior2WSection: ChecklistSection = {
    id: "exterior2W", name: "Exterior Wash — 2-Wheeler", isOpen: true,
    items: [
      { id: "2w-1", name: "Full body pressure rinse — top to bottom",                  completed: false, skipped: false },
      { id: "2w-2", name: "Tyre and mudguard pressure spray — both tyres",             completed: false, skipped: false },
      { id: "2w-3", name: "Chain and sprocket water rinse — flush off grit",           completed: false, skipped: false },
      { id: "2w-4", name: "Seat wipe with damp cloth — remove dust",                   completed: false, skipped: false },
      { id: "2w-5", name: "Headlight, instrument cluster, mirrors wiped clean",        completed: false, skipped: false },
      { id: "2w-6", name: "Full microfibre dry — body + seat + mirrors",               completed: false, skipped: false },
    ],
  };

  const spoke2WSection: ChecklistSection = {
    id: "spoke2W", name: "🛞 Spoke & Rim Scrub — Weekly", isOpen: true,
    items: [
      { id: "sp-1", name: "Wet spokes with water — loosen grime",                      completed: false, skipped: false },
      { id: "sp-2", name: "Scrub each spoke with detailing brush",                     completed: false, skipped: false },
      { id: "sp-3", name: "Scrub rim surface — both front and rear",                   completed: false, skipped: false },
      { id: "sp-4", name: "Rinse thoroughly — no soap residue",                        completed: false, skipped: false },
      { id: "sp-5", name: "Dry with cloth — check shine",                              completed: false, skipped: false },
    ],
  };

  const engineSurface2WSection: ChecklistSection = {
    id: "engineSurface2W", name: "⚙️ Engine Surface Wipe — Monthly", isOpen: true,
    items: [
      { id: "es-1", name: "⚠️ DRY ONLY — no water on engine",                         completed: false, skipped: false },
      { id: "es-2", name: "Wipe engine casing surfaces with dry microfibre",            completed: false, skipped: false },
      { id: "es-3", name: "Remove dust from cooling fins with soft brush",              completed: false, skipped: false },
      { id: "es-4", name: "Before + after photo sent on WhatsApp",                     completed: false, skipped: false },
    ],
  };

  const sprayWax2WSection: ChecklistSection = {
    id: "sprayWax2W", name: "✨ Spray Wax / Liquid Polish — Monthly", isOpen: true,
    items: [
      { id: "sw-1", name: "Bike must be clean and dry before applying polish",          completed: false, skipped: false },
      { id: "sw-2", name: "Spray liquid polish on body panels — section by section",    completed: false, skipped: false },
      { id: "sw-3", name: "Buff with clean microfibre — circular motion",              completed: false, skipped: false },
      { id: "sw-4", name: "Do NOT apply on seat, tyres, or brake discs",               completed: false, skipped: false },
      { id: "sw-5", name: "Before + after photo sent on WhatsApp",                     completed: false, skipped: false },
    ],
  };

  // ── Section routing ───────────────────────────────────────────────────────
  const pkg = job.packageType ?? job.planType ?? "EXPRESS_WASH";
  const variant = job.packVariant ?? job.oneTimeVariant ?? "shampoo";
  const addOnList: string[] = job.serviceDetails?.addOns ?? [];

  // For 2W plans use the 2W exterior checklist instead of 4W
  const baseExterior = (pkg === "ELITE_2W") ? exterior2WSection : exteriorSection;
  const sections: ChecklistSection[] = [baseExterior];

  // ── MONTHLY SUBSCRIPTION PLANS ────────────────────────────────────────────

  if (pkg === "EXPRESS_WASH") {
    // Daily: exterior only (above)
    // Periodic: shampoo 1×/month, underbody 1×/month, windshield 1×/month
    if (flags.isShampooDay)   sections.push(shampooSection);
    if (flags.isUnderbodyDay) sections.push(underbodySection);
    if (flags.isGlassDay)     sections.push(glassSection);
    // Weekly: tyre rinse — covered in exterior item 4
  }

  if (pkg === "SMART_WASH") {
    // Fortnightly: shampoo 2×, interior 2×, tyre 1×
    // Monthly: fragrance 1×
    if (flags.isShampooDay)   sections.push(shampooSection);
    if (flags.isInteriorDay)  sections.push(interiorSection);
    if (flags.isTyreDay)      sections.push(tyreSection);
    if (flags.isFragranceDay) sections.push(fragranceSection);
  }

  if (pkg === "ELITE_WASH") {
    // Weekly: shampoo 4×
    // Fortnightly: dashboard 2×, interior 2×, tyre 2×
    // Monthly: wax 1×, engine 1×, fragrance 1×
    if (flags.isShampooDay)    sections.push(shampooSection);
    if (flags.isWaxDay)        sections.push(waxSection);
    if (flags.isDashboardDay)  sections.push(dashboardSection);
    if (flags.isInteriorDay)   sections.push(interiorSection);
    if (flags.isTyreDay)       sections.push(tyreSection);
    if (flags.isEngineDay)     sections.push(engineSection);
    if (flags.isFragranceDay)  sections.push(fragranceSection);
  }

  if (pkg === "ELITE_2W") {
    // Fortnightly: shampoo 2×
    // Weekly: spoke & rim scrub
    // Monthly: engine surface wipe, spray wax
    if (flags.isShampooDay)   sections.push(shampooSection);
    if (flags.isSpokeDay)     sections.push(spoke2WSection);
    if (flags.isEngineDay)    sections.push(engineSurface2WSection);
    if (flags.isWaxDay)       sections.push(sprayWax2WSection);
  }

  // ── PACK OF 2 / PACK OF 4 — variant-aware ─────────────────────────────────
  if (pkg === "pack2" || pkg === "pack4") {
    // Always do at least exterior (already added)
    // Shampoo variant or Shampoo+Wax variant → add shampoo section
    if (variant === "shampoo" || variant === "shampooWax") {
      sections.push(shampooSection);
    }
    // Shampoo+Wax variant → add wax section (shampoo must be done first)
    if (variant === "shampooWax") {
      sections.push(waxSection);
    }
  }

  // ── ONE-TIME WASH — variant-aware ─────────────────────────────────────────
  if (pkg === "onetime") {
    if (variant === "shampoo" || variant === "shampooWax") {
      sections.push(shampooSection);
    }
    if (variant === "shampooWax") {
      sections.push(waxSection);
    }
  }

  // ── URGENT WASH — always Shampoo + Wax ───────────────────────────────────
  if (pkg === "urgent") {
    sections.push(shampooSection);
    sections.push(waxSection);
  }

  // ── ADD-ONS — append sections for any add-on purchased ───────────────────
  // Checks job.serviceDetails.addOns[] for add-on IDs or names
  const hasAddon = (keywords: string[]) =>
    addOnList.some(a => keywords.some(k => a.toLowerCase().includes(k.toLowerCase())));

  // Only add sections not already in the list to avoid duplicates
  const alreadyHas = (id: string) => sections.some(s => s.id === id);

  if (hasAddon(["vacuum", "interior", "addon-001"]) && !alreadyHas("interior")) {
    sections.push(interiorSection);
  }
  if (hasAddon(["dashboard", "console", "addon-002"]) && !alreadyHas("dashboard")) {
    sections.push(dashboardSection);
  }
  if (hasAddon(["tyre", "tire", "dressing", "addon-003"]) && !alreadyHas("tyre")) {
    sections.push(tyreSection);
  }
  if (hasAddon(["wax", "polish", "addon-004"]) && !alreadyHas("wax")) {
    sections.push(waxSection);
  }
  if (hasAddon(["underbody", "addon-005"]) && !alreadyHas("underbody")) {
    sections.push(underbodySection);
  }
  if (hasAddon(["engine", "addon-006"]) && !alreadyHas("engine")) {
    sections.push(engineSection);
  }
  if (hasAddon(["fragrance", "addon-007"]) && !alreadyHas("fragrance")) {
    sections.push(fragranceSection);
  }

  // Quality check always last
  sections.push(qualitySection);
  return sections;
}



interface WasherJobChecklistProps {

  job: any;

  onChecklistChange: (complete: boolean, photos: boolean, autoAdvance?: string) => void;

  isInProgress: boolean;

}



export function WasherJobChecklist({ job, onChecklistChange, isInProgress }: WasherJobChecklistProps) {

  const [beforePhoto, setBeforePhoto] = useState<string | null>(null);

  const [afterPhoto, setAfterPhoto] = useState<string | null>(null);

  const beforePhotoInputRef = useRef<HTMLInputElement>(null);

  const afterPhotoInputRef = useRef<HTMLInputElement>(null);

  // Video clips for shampoo and interior
  const [shaBeforeVideo, setShaBeforeVideo] = useState<{ blobUrl: string; size: number } | null>(null);
  const [shaAfterVideo,  setShaAfterVideo]  = useState<{ blobUrl: string; size: number } | null>(null);
  const [intBeforeVideo, setIntBeforeVideo] = useState<{ blobUrl: string; size: number } | null>(null);
  const [intAfterVideo,  setIntAfterVideo]  = useState<{ blobUrl: string; size: number } | null>(null);
  const shaBeforeRef = useRef<HTMLInputElement>(null);
  const shaAfterRef  = useRef<HTMLInputElement>(null);
  const intBeforeRef = useRef<HTMLInputElement>(null);
  const intAfterRef  = useRef<HTMLInputElement>(null);

  // Persist video clips to localStorage when captured
  const storeVideoClip = (sectionId: string, type: "before" | "after", blobUrl: string, size: number) => {
    try {
      const key = `WASHER_JOB_VIDEOS_${job.id}`;
      const existing = JSON.parse(localStorage.getItem(key) || "[]");
      existing.push({
        id: `VID-${Date.now()}`,
        sectionId,
        type,
        status: "UPLOAD_PENDING",
        localBlobUrl: blobUrl,
        size,
        timestamp: new Date().toISOString(),
      });
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (_) {}
  };

  const handleVideoCapture = (
    e: React.ChangeEvent<HTMLInputElement>,
    sectionId: "shampoo" | "interior",
    type: "before" | "after"
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blobUrl = URL.createObjectURL(file);
    const data = { blobUrl, size: file.size };
    if (sectionId === "shampoo") {
      if (type === "before") setShaBeforeVideo(data);
      else setShaAfterVideo(data);
    } else {
      if (type === "before") setIntBeforeVideo(data);
      else setIntAfterVideo(data);
    }
    storeVideoClip(sectionId, type, blobUrl, file.size);
    // Auto-complete the video checklist item
    const itemId = sectionId === "shampoo" ? "sha-6" : "int-7";
    const shaComplete = sectionId === "shampoo"
      ? (type === "before" ? true : !!shaBeforeVideo)
      : !!shaBeforeVideo;
    const intComplete = sectionId === "interior"
      ? (type === "before" ? true : !!intBeforeVideo)
      : !!intBeforeVideo;
    // Mark item complete only when both before+after are done
    const bothDone = sectionId === "shampoo"
      ? (type === "after" && !!shaBeforeVideo)
      : (type === "after" && !!intBeforeVideo);
    if (bothDone) {
      setSections(prev => prev.map(section =>
        section.id === sectionId
          ? { ...section, items: section.items.map(item =>
              item.id === itemId ? { ...item, completed: true } : item) }
          : section
      ));
    }
    if (e.target) e.target.value = "";
  };



  // Build sections based on the job's plan — only show what this customer gets today

  const [sections, setSections] = useState<ChecklistSection[]>(() => buildChecklistSections(job));



  // Option B periodic flags — computed from subscriptionStartDate via periodicScheduleService

  const periodicFlags = computePeriodicFlagsB(

    job.id,

    job.packageType ?? job.planType ?? "EXPRESS_WASH",

    job.subscriptionStartDate,

  );

  const hasPeriodicToday = periodicFlags.periodicServices.length > 0;



  const [skipDialogOpen, setSkipDialogOpen] = useState(false);

  const [skipItem, setSkipItem] = useState<{ sectionId: string; itemId: string } | null>(null);

  const [skipReason, setSkipReason] = useState("");



  // Calculate progress

  const totalItems = sections.reduce((sum, section) => sum + section.items.length, 0);

  const completedItems = sections.reduce(

    (sum, section) => sum + section.items.filter(item => item.completed).length,

    0

  );

  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;



  const qualityCheckComplete = sections

    .find(s => s.id === "quality")

    ?.items.every(item => item.completed || item.skipped) || false;



  const canTakeAfterPhoto = qualityCheckComplete;



  useEffect(() => {

    const allComplete = sections.every(section =>

      section.items.every(item => item.completed || item.skipped)

    );

    const photosComplete = beforePhoto !== null && afterPhoto !== null;

    onChecklistChange(allComplete, photosComplete);

  }, [sections, beforePhoto, afterPhoto, onChecklistChange]);



  // Auto-collapse completed sections

  useEffect(() => {

    setSections(prev =>

      prev.map(section => {

        const allDone = section.items.every(item => item.completed || item.skipped);

        if (allDone && section.id !== "quality") {

          return { ...section, isOpen: false };

        }

        return section;

      })

    );

  }, [sections]);



  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: "before" | "after") => {

    const file = e.target.files?.[0];



    if (file) {

      const reader = new FileReader();

      reader.onload = (readerEvent) => {

        const photoUrl = readerEvent.target?.result as string;



        if (type === "before") {

          setBeforePhoto(photoUrl);

          toast.success("Before photo uploaded - proceeding to checklist");

          setTimeout(() => {

            const firstSection = document.querySelector('[id^="checklist-section"]');

            if (firstSection) {

              firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

            }

          }, 500);

        } else {

          setAfterPhoto(photoUrl);

          toast.success("After photo uploaded - advancing to report");

          const allComplete = sections.every(section =>

            section.items.every(item => item.completed || item.skipped)

          );

          onChecklistChange(allComplete, true, "report");

        }

      };

      reader.readAsDataURL(file);

    }

    // Reset input so same file can be selected again

    e.target.value = '';

  };



  const handlePhotoCapture = (type: "before" | "after") => {

    // For Figma Make demo: Simulate photo capture immediately

    const simulatedPhoto = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%2398e5c2" width="400" height="300"/><text x="50%" y="45%" text-anchor="middle" fill="%23047857" font-size="24" font-weight="bold">${type.toUpperCase()} PHOTO</text><text x="50%" y="55%" text-anchor="middle" fill="%23065f46" font-size="16">Photo Captured ✓</text></svg>`;



    if (type === "before") {

      setBeforePhoto(simulatedPhoto);

      toast.success("Before photo captured - proceeding to checklist");

      setTimeout(() => {

        const firstSection = document.querySelector('[id^="checklist-section"]');

        if (firstSection) {

          firstSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

        }

      }, 500);

    } else {

      setAfterPhoto(simulatedPhoto);

      toast.success("After photo captured - advancing to report");

      const allComplete = sections.every(section =>

        section.items.every(item => item.completed || item.skipped)

      );

      onChecklistChange(allComplete, true, "report");

    }

  };



  const handleUploadPhoto = (type: "before" | "after") => {

    // Optionally trigger file upload

    if (type === "before") {

      beforePhotoInputRef.current?.click();

    } else {

      afterPhotoInputRef.current?.click();

    }

  };



  const handleItemToggle = (sectionId: string, itemId: string) => {

    if (!beforePhoto) {

      toast.error("Please take the before photo first");

      return;

    }



    setSections(prev =>

      prev.map(section => {

        if (section.id === sectionId) {

          return {

            ...section,

            items: section.items.map(item => {

              if (item.id === itemId) {

                return { ...item, completed: !item.completed, skipped: false, skipReason: undefined };

              }

              return item;

            }),

          };

        }

        return section;

      })

    );

  };



  const handleSkipItem = (sectionId: string, itemId: string) => {

    setSkipItem({ sectionId, itemId });

    setSkipDialogOpen(true);

    setSkipReason("");

  };



  const confirmSkip = () => {

    if (!skipReason.trim()) {

      toast.error("Please provide a reason for skipping");

      return;

    }



    if (skipItem) {

      setSections(prev =>

        prev.map(section => {

          if (section.id === skipItem.sectionId) {

            return {

              ...section,

              items: section.items.map(item => {

                if (item.id === skipItem.itemId) {

                  return { ...item, skipped: true, completed: false, skipReason: skipReason };

                }

                return item;

              }),

            };

          }

          return section;

        })

      );

      setSkipDialogOpen(false);

      toast.success("Item skipped");

    }

  };



  const toggleSection = (sectionId: string) => {

    setSections(prev =>

      prev.map(section =>

        section.id === sectionId ? { ...section, isOpen: !section.isOpen } : section

      )

    );

  };



  const getProgressColor = () => {

    if (progress < 50) return "bg-red-500";

    if (progress < 80) return "bg-amber-500";

    return "bg-green-500";

  };



  return (

    <div className="space-y-4 p-4 pb-40">

      {/* Hidden file inputs for photo upload */}

      <input

        ref={beforePhotoInputRef}

        type="file"

        accept="image/*"

        onChange={(e) => handleFileChange(e, "before")}

        className="hidden"

      />

      <input

        ref={afterPhotoInputRef}

        type="file"

        accept="image/*"

        onChange={(e) => handleFileChange(e, "after")}

        className="hidden"

      />



      {/* Hidden video inputs for shampoo and interior */}
      <input ref={shaBeforeRef} type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "shampoo", "before")} />
      <input ref={shaAfterRef}  type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "shampoo", "after")} />
      <input ref={intBeforeRef} type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "interior", "before")} />
      <input ref={intAfterRef}  type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "interior", "after")} />

      {/* Activity Tracking Indicator */}

      {isInProgress && beforePhoto && (

        <JobActivityTracker jobId={job.id} showTimestamps />

      )}



      {/* Progress Bar */}

      <Card>

        <CardContent className="pt-6">

          <div className="space-y-2">

            <div className="flex items-center justify-between">

              <span className="text-sm font-medium text-gray-700">

                {completedItems} of {totalItems} services completed

              </span>

              <span className="text-lg font-bold text-gray-900">{Math.round(progress)}%</span>

            </div>

            <div className="relative">

              <Progress value={progress} className="h-3" />

              <div

                className={`absolute top-0 left-0 h-3 rounded-full transition-all ${getProgressColor()}`}

                style={{ width: `${progress}%` }}

              />

            </div>

          </div>

        </CardContent>

      </Card>



      {/* Before Photo */}

      <Card>

        <CardContent className="pt-6">

          <div className="space-y-3">

            <div className="flex items-center gap-2">

              <Camera className="w-5 h-5 text-teal-600" />

              <h3 className="font-semibold text-gray-900">Before Photo — Required</h3>

            </div>

            

            {!beforePhoto ? (

              <Button

                onClick={() => handlePhotoCapture("before")}

                className="w-full h-32 bg-teal-600 hover:bg-teal-700 text-white"

              >

                <div className="text-center">

                  <div className="flex items-center justify-center gap-2 mb-2">

                    <Camera className="w-8 h-8" />

                    <Upload className="w-6 h-6" />

                  </div>

                  <p className="text-lg font-semibold">Take Before Photo</p>

                  <p className="text-xs mt-1 opacity-90">Click to capture</p>

                </div>

              </Button>

            ) : (

              <div className="space-y-2">

                <img

                  src={beforePhoto}

                  alt="Before"

                  className="w-full h-40 object-cover rounded-lg border-2 border-green-500"

                />

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 text-green-600">

                    <Check className="w-4 h-4" />

                    <span className="text-sm font-medium">Photo captured</span>

                  </div>

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => handlePhotoCapture("before")}

                  >

                    Retake

                  </Button>

                </div>

              </div>

            )}

          </div>

        </CardContent>

      </Card>



      {/* Checklist Sections */}

      {!beforePhoto && (

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">

          <div className="flex items-start gap-2">

            <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

            <p className="text-sm text-amber-900">

              Take the before photo to start the checklist

            </p>

          </div>

        </div>

      )}



      {/* ── Periodic service banner ── shown when today has scheduled extras ── */}

      {isInProgress && hasPeriodicToday && (

        <div className="mx-4 mt-3 mb-2 rounded-xl border-2 border-teal-400 bg-teal-50 p-3">

          <div className="flex items-center gap-2 mb-2">

            <span className="text-lg">📅</span>

            <div>

              <p className="text-sm font-bold text-teal-800">Aaj ke special services hai!</p>

              <p className="text-xs text-teal-600">{job.packageName} — neeche wale sections complete karo</p>

            </div>

          </div>

          <div className="flex flex-wrap gap-2">

            {periodicFlags.periodicServices.map(svc => (

              <div key={svc.id}

                className="flex items-center gap-1.5 bg-white border border-teal-200 rounded-lg px-2.5 py-1.5">

                <span className="text-base">{svc.icon}</span>

                <div>

                  <p className="text-xs font-semibold text-teal-800">{svc.name}</p>

                  <p className="text-xs text-teal-600">{svc.nameHindi}</p>

                </div>

              </div>

            ))}

          </div>

        </div>

      )}



      {/* ── Customer periodic balance panel ── always visible when job is active ── */}

      {isInProgress && job.id && job.packageType && job.packageType !== "EXPRESS_WASH" && (() => {

        const today      = new Date().toISOString().split("T")[0];

        const month      = today.slice(0, 7); // YYYY-MM

        const usage      = periodicScheduleService.getMonthlyUsage(job.id, month);

        const services   = [

          { key: "shampoo",   icon: "🧴", label: "Shampoo Wash",        u: usage.shampoo   },

          { key: "interior",  icon: "🪣", label: "Interior Vacuum",     u: usage.interior  },

          { key: "tyre",      icon: "🛞", label: "Tyre Dressing",       u: usage.tyre      },

          { key: "dashboard", icon: "🧹", label: "Dashboard Clean",     u: usage.dashboard },

          { key: "wax",       icon: "✨", label: "Hand Wax",            u: usage.wax       },

          { key: "engine",    icon: "⚙️", label: "Engine Bay Blow",     u: usage.engine    },

          { key: "fragrance", icon: "🌸", label: "Fragrance",           u: usage.fragrance },

        ].filter(s => s.u.cap > 0);

        if (services.length === 0) return null;

        const totalUsed = services.reduce((s, x) => s + x.u.used, 0);

        const totalCap  = services.reduce((s, x) => s + x.u.cap, 0);

        const allDone   = totalUsed >= totalCap;

        return (

          <div className={`mx-4 mt-2 mb-2 rounded-xl border-2 p-3 ${allDone ? "border-gray-200 bg-gray-50" : "border-blue-200 bg-blue-50"}`}>

            <div className="flex items-center justify-between mb-2">

              <div className="flex items-center gap-1.5">

                <span className="text-base">📊</span>

                <p className="text-xs font-bold text-blue-900">Customer Periodic Balance — {month}</p>

              </div>

              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${allDone ? "bg-gray-200 text-gray-600" : "bg-blue-100 text-blue-700"}`}>

                {totalUsed}/{totalCap} used

              </span>

            </div>

            <div className="grid grid-cols-2 gap-1.5">

              {services.map(({ key, icon, label, u }) => {

                const rem = u.cap - u.used;

                const barPct = u.cap > 0 ? Math.round((u.used / u.cap) * 100) : 0;

                const color  = rem === 0 ? "text-red-600 bg-red-50 border-red-200"

                             : rem === 1 ? "text-amber-700 bg-amber-50 border-amber-200"

                             : "text-green-700 bg-green-50 border-green-200";

                return (

                  <div key={key} className={`flex items-center justify-between px-2 py-1.5 rounded-lg border text-xs ${color}`}>

                    <span>{icon} {label}</span>

                    <div className="flex items-center gap-1.5 ml-1">

                      <div className="w-10 h-1 bg-white/70 rounded-full overflow-hidden flex-shrink-0">

                        <div className="h-full bg-current rounded-full" style={{ width: `${barPct}%` }} />

                      </div>

                      <span className="font-bold flex-shrink-0">{rem}/{u.cap}</span>

                    </div>

                  </div>

                );

              })}

            </div>

            <p className="text-xs text-blue-600 mt-2 leading-snug">

              ⚠️ <strong>Policy:</strong> Unused balance carry forward nahi hota. Month end par bachi hui services ke liye koi reimbursement nahi milega.

            </p>

          </div>

        );

      })()}



      {/* ── Regular wash only banner for SHINE / no periodic ── */}

      {isInProgress && !hasPeriodicToday && job.packageType !== "EXPRESS_WASH" && (

        <div className="mx-4 mt-3 mb-2 rounded-xl border border-gray-200 bg-gray-50 p-3">

          <div className="flex items-center gap-2">

            <span className="text-base">💧</span>

            <p className="text-xs text-gray-600">

              Aaj <strong>regular water wash only</strong> hai.

              Koi periodic service scheduled nahi hai aaj ke liye.

            </p>

          </div>

        </div>

      )}



      {sections.map((section) => {

        const sectionComplete = section.items.every(item => item.completed || item.skipped);

        const completedCount = section.items.filter(item => item.completed).length;

        const totalCount = section.items.length;



        return (

          <Collapsible

            key={section.id}

            open={section.isOpen}

            onOpenChange={() => toggleSection(section.id)}

          >

            <Card className={sectionComplete ? "border-green-500" : ""}>

              <CollapsibleTrigger asChild>

                <CardContent className="pt-6 pb-6 cursor-pointer hover:bg-gray-50 transition-colors">

                  <div className="flex items-center justify-between">

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                      <h3 className="font-semibold text-gray-900">{section.name}</h3>

                      <Badge variant={sectionComplete ? "default" : "outline"} className={sectionComplete ? "bg-green-500" : ""}>

                        {completedCount} / {totalCount}

                      </Badge>

                      {sectionComplete && (

                        <Badge className="bg-green-500">Complete</Badge>

                      )}

                    </div>

                    {section.isOpen ? (

                      <ChevronUp className="w-5 h-5 text-gray-400" />

                    ) : (

                      <ChevronDown className="w-5 h-5 text-gray-400" />

                    )}

                  </div>

                </CardContent>

              </CollapsibleTrigger>



              <CollapsibleContent>

                <CardContent className="pt-0 pb-6 space-y-3">

                  {section.items.map((item) => {
                    // ── Video upload items: sha-6 and int-7 ──────────────────
                    if (item.id === "sha-6" || item.id === "int-7") {
                      const isSha     = item.id === "sha-6";
                      const beforeVid = isSha ? shaBeforeVideo : intBeforeVideo;
                      const afterVid  = isSha ? shaAfterVideo  : intAfterVideo;
                      const beforeRef = isSha ? shaBeforeRef   : intBeforeRef;
                      const afterRef  = isSha ? shaAfterRef    : intAfterRef;
                      const label     = isSha ? "Shampoo Wash" : "Interior Clean";
                      if (!beforePhoto) return null;
                      return (
                        <div key={item.id} className="p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-3">
                          <div className="flex items-center gap-2">
                            <Video className="h-4 w-4 text-indigo-600" />
                            <p className="text-sm font-bold text-indigo-800">
                              {label} — Before &amp; After Video Required
                            </p>
                            {item.completed && (
                              <span className="ml-auto text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">
                                Done
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {/* Before video */}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">Before</p>
                              {beforeVid ? (
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                  <video src={beforeVid.blobUrl} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 left-1 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                    Pending Upload
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => beforeRef.current?.click()}
                                  className="w-full aspect-video flex flex-col items-center justify-center gap-1 bg-indigo-100 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-700"
                                >
                                  <Video className="h-5 w-5" />
                                  <span className="text-xs font-semibold">Record Before</span>
                                </button>
                              )}
                            </div>
                            {/* After video */}
                            <div>
                              <p className="text-xs font-semibold text-gray-600 mb-1">After</p>
                              {afterVid ? (
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                  <video src={afterVid.blobUrl} className="w-full h-full object-cover" />
                                  <span className="absolute bottom-1 left-1 text-xs bg-amber-500 text-white px-1.5 py-0.5 rounded">
                                    Pending Upload
                                  </span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => { if (beforeVid) afterRef.current?.click(); }}
                                  disabled={!beforeVid}
                                  className={`w-full aspect-video flex flex-col items-center justify-center gap-1 border-2 border-dashed rounded-lg ${
                                    beforeVid
                                      ? "bg-indigo-100 border-indigo-300 text-indigo-700"
                                      : "bg-gray-100 border-gray-200 text-gray-400"
                                  }`}
                                >
                                  <Video className="h-5 w-5" />
                                  <span className="text-xs font-semibold">
                                    {beforeVid ? "Record After" : "Before first"}
                                  </span>
                                </button>
                              )}
                            </div>
                          </div>
                          {!item.completed && (
                            <p className="text-xs text-indigo-600">
                              Record both clips to mark this service complete
                            </p>
                          )}
                        </div>
                      );
                    }
                    // ── Default item render ────────────────────────────────
                    return (

                    <div

                      key={item.id}

                      className="flex items-start justify-between gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors"

                    >

                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">

                          <Checkbox

                            id={item.id}

                            checked={item.completed}

                            onCheckedChange={() => handleItemToggle(section.id, item.id)}

                            className="h-7 w-7 rounded-full data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"

                            disabled={!beforePhoto}

                          />

                          <label

                            htmlFor={item.id}

                            className={`text-base cursor-pointer ${

                              item.completed

                                ? "text-gray-500 line-through"

                                : item.skipped

                                ? "text-red-600"

                                : "text-gray-900"

                            }`}

                          >

                            {item.name}

                          </label>

                        </div>

                        {item.skipped && item.skipReason && (

                          <div className="ml-10 mt-1 flex items-center gap-2 text-xs text-red-600">

                            <X className="w-3 h-3" />

                            Skipped: {item.skipReason}

                          </div>

                        )}

                      </div>

                      {!item.completed && !item.skipped && beforePhoto && (

                        <Button

                          variant="ghost"

                          size="sm"

                          onClick={() => handleSkipItem(section.id, item.id)}

                          className="text-red-600 hover:text-red-700 hover:bg-red-50"

                        >

                          Skip

                        </Button>

                      )}

                    </div>

                  );

                            })}

                </CardContent>

              </CollapsibleContent>

            </Card>

          </Collapsible>

        );

      })}



      {/* After Photo */}

      <Card>

        <CardContent className="pt-6">

          <div className="space-y-3">

            <div className="flex items-center gap-2">

              <Camera className="w-5 h-5 text-teal-600" />

              <h3 className="font-semibold text-gray-900">After Photo — Required</h3>

            </div>

            

            {!canTakeAfterPhoto && (

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">

                <div className="flex items-start gap-2">

                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

                  <p className="text-sm text-amber-900">

                    Complete all Quality Check items first

                  </p>

                </div>

              </div>

            )}



            {canTakeAfterPhoto && !afterPhoto && (

              <Button

                onClick={() => handlePhotoCapture("after")}

                className="w-full h-32 bg-teal-600 hover:bg-teal-700 text-white"

              >

                <div className="text-center">

                  <div className="flex items-center justify-center gap-2 mb-2">

                    <Camera className="w-8 h-8" />

                    <Upload className="w-6 h-6" />

                  </div>

                  <p className="text-lg font-semibold">Take / Upload After Photo</p>

                </div>

              </Button>

            )}



            {afterPhoto && (

              <div className="space-y-2">

                <img

                  src={afterPhoto}

                  alt="After"

                  className="w-full h-40 object-cover rounded-lg border-2 border-green-500"

                />

                <div className="flex items-center justify-between">

                  <div className="flex items-center gap-2 text-green-600">

                    <Check className="w-4 h-4" />

                    <span className="text-sm font-medium">Photo captured</span>

                  </div>

                  <Button

                    variant="outline"

                    size="sm"

                    onClick={() => handlePhotoCapture("after")}

                  >

                    Retake

                  </Button>

                </div>

              </div>

            )}

          </div>

        </CardContent>

      </Card>



      {/* Before/After Comparison */}

      {beforePhoto && afterPhoto && (

        <Card>

          <CardContent className="pt-6">

            <h3 className="font-semibold text-gray-900 mb-3">Before & After Comparison</h3>

            <div className="grid grid-cols-2 gap-3">

              <div>

                <p className="text-xs text-gray-500 mb-1">Before</p>

                <img src={beforePhoto} alt="Before" className="w-full h-24 object-cover rounded" />

              </div>

              <div>

                <p className="text-xs text-gray-500 mb-1">After</p>

                <img src={afterPhoto} alt="After" className="w-full h-24 object-cover rounded" />

              </div>

            </div>

          </CardContent>

        </Card>

      )}



      {/* Skip Dialog */}

      <Dialog open={skipDialogOpen} onOpenChange={setSkipDialogOpen}>

        <DialogContent>

          <DialogHeader>

            <DialogTitle>Skip Checklist Item</DialogTitle>

            <DialogDescription>

              Please provide a reason for skipping this item. This will be reviewed by your Supervisor.

            </DialogDescription>

          </DialogHeader>

          <div className="space-y-4 py-4">

            <Textarea

              placeholder="Enter reason for skipping (required)"

              value={skipReason}

              onChange={(e) => setSkipReason(e.target.value)}

              className="min-h-24 text-base"

            />

          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">

            <Button variant="outline" onClick={() => setSkipDialogOpen(false)}>

              Cancel

            </Button>

            <Button onClick={confirmSkip} className="bg-red-600 hover:bg-red-700">

              Confirm Skip

            </Button>

          </DialogFooter>

        </DialogContent>

      </Dialog>

    </div>

  );

}

