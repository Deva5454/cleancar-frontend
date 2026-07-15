path = r"src/app/routes.tsx"
with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

if 'SuperAdminFieldTracker' not in c:
    c = c.replace(
        'const SuperAdminPlanEditor = lazy(() => import("./components/admin/SuperAdminPlanEditor"));',
        'const SuperAdminPlanEditor = lazy(() => import("./components/admin/SuperAdminPlanEditor"));\nconst SuperAdminFieldTracker = lazy(() => import("./components/admin/SuperAdminFieldTracker"));'
    )
    c = c.replace(
        '{ path: "founder/control-tower", element: <FounderControlTower /> },',
        '{ path: "field-tracker", element: <SuperAdminFieldTracker /> },\n      { path: "founder/control-tower", element: <FounderControlTower /> },'
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)
print("routes.tsx done:", "field-tracker" in c)
