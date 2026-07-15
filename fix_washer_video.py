"""
fix_washer_video.py — Add Before/After video upload to Shampoo Wash and Interior Vacuum sections

Changes:
1. Add video state + refs for shampoo (sha-before, sha-after) and interior (int-before, int-after)
2. Replace "sha-6" text checkbox with video upload UI in shampoo section
3. Add video upload UI to interior section (new item int-video)
4. Store videos as UPLOAD_PENDING blobs in localStorage under WASHER_JOB_VIDEOS_{jobId}
5. Video completion is required before checklist can be marked complete

Run: python fix_washer_video.py
From: E:\\3rd June Final Deployment\\cleancar-root
"""

import shutil, datetime

FILE = r"E:\3rd June Final Deployment\cleancar-root\src\app\components\washer\WasherJobChecklist.tsx"

ts = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
shutil.copy2(FILE, FILE + f".bak_video_{ts}")
print(f"Backed up -> {FILE}.bak_video_{ts}\n")

with open(FILE, "r", encoding="utf-8") as fh:
    c = fh.read()

results = []

def patch(old, new, label):
    global c
    if old in c:
        c = c.replace(old, new, 1)
        results.append(("OK", label))
        print(f"  [OK]   {label}")
    else:
        results.append(("SKIP", label))
        print(f"  [SKIP] {label}")

# =============================================================================
# FIX 1 — Add Video import (Video icon from lucide)
# =============================================================================
patch(
    "import {\n  Camera,\n  ChevronDown,\n  ChevronUp,\n  Check,\n  X,\n  AlertCircle,\n  Upload,\n} from \"lucide-react\";",
    "import {\n  Camera,\n  ChevronDown,\n  ChevronUp,\n  Check,\n  X,\n  AlertCircle,\n  Upload,\n  Video,\n} from \"lucide-react\";",
    "Add Video icon import"
)

# =============================================================================
# FIX 2 — Replace sha-6 text item with video upload marker
# =============================================================================
patch(
    '      { id: "sha-6", name: "Before + after photo sent on WhatsApp",                           completed: false, skipped: false },',
    '      { id: "sha-6", name: "Before + after VIDEO uploaded (required for shampoo wash)",       completed: false, skipped: false },',
    "Mark sha-6 as video required item"
)

# =============================================================================
# FIX 3 — Add int-video item to interior section
# =============================================================================
patch(
    '      { id: "int-6", name: "Replace floor mats \u2014 check alignment",                completed: false, skipped: false },',
    '      { id: "int-6", name: "Replace floor mats \u2014 check alignment",                completed: false, skipped: false },\n      { id: "int-7", name: "Before + after VIDEO uploaded (required for interior clean)",  completed: false, skipped: false },',
    "Add int-7 video required item to interior section"
)

# =============================================================================
# FIX 4 — Add video state variables after existing photo state
# =============================================================================
patch(
    "  const beforePhotoInputRef = useRef<HTMLInputElement>(null);\n\n  const afterPhotoInputRef = useRef<HTMLInputElement>(null);",
    """  const beforePhotoInputRef = useRef<HTMLInputElement>(null);

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
  };""",
    "Add video state, storeVideoClip, and handleVideoCapture"
)

# =============================================================================
# FIX 5 — Add hidden video input elements after existing photo inputs
# =============================================================================
patch(
    "      {/* Activity Tracking Indicator */}",
    """      {/* Hidden video inputs for shampoo and interior */}
      <input ref={shaBeforeRef} type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "shampoo", "before")} />
      <input ref={shaAfterRef}  type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "shampoo", "after")} />
      <input ref={intBeforeRef} type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "interior", "before")} />
      <input ref={intAfterRef}  type="file" accept="video/*" capture="environment" className="hidden"
        onChange={e => handleVideoCapture(e, "interior", "after")} />

      {/* Activity Tracking Indicator */}""",
    "Add hidden video input elements"
)

# =============================================================================
# FIX 6 — Custom render for sha-6 and int-7 items inside section.items.map
# Replace the generic item render with a conditional that shows video UI
# =============================================================================
patch(
    '                  {section.items.map((item) => (',
    """                  {section.items.map((item) => {
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
                    return (""",
    "Custom render for sha-6 and int-7 video items"
)

# Close the map correctly — change ))} to })} since we changed map((item) => ( to map((item) => {
patch(
    '                  ))}\n\n\n\n                </CardContent>\n                </CollapsibleContent>',
    '                  })}\n\n\n\n                </CardContent>\n                </CollapsibleContent>',
    "Fix map closing bracket from )) to })"
)

with open(FILE, "w", encoding="utf-8", newline="") as fh:
    fh.write(c)

print("\n" + "="*60)
ok = sum(1 for r in results if r[0] == "OK")
sk = sum(1 for r in results if r[0] == "SKIP")
print(f"  Applied: {ok}  Skipped: {sk}")
if sk:
    for r, l in results:
        if r == "SKIP": print(f"    SKIP: {l}")
print("""
Next:
  cd "E:\\3rd June Final Deployment\\cleancar-root\\-cleancar-frontend-main"
  npm run build 2>&1 | Select-String -Pattern "error|built"
  cd "E:\\3rd June Final Deployment\\cleancar-root"
  git add src/app/components/washer/WasherJobChecklist.tsx
  git commit -m "Washer: add before/after video upload for shampoo and interior sections"
  git push origin main
""")
