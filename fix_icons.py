with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c = f.read()

# Replace emoji icons in vehicleCategories config with text
c = c.replace('{ id: "hatchback", label: "Hatchback / Compact Sedan", icon: "\U0001f697" }', '{ id: "hatchback", label: "Hatchback / Compact Sedan", icon: "H" }')
c = c.replace('{ id: "suv", label: "SUV / Sedan / MUV", icon: "\U0001f699" }', '{ id: "suv", label: "SUV / Sedan / MUV", icon: "S" }')
c = c.replace('{ id: "luxury", label: "Luxury / Large SUV", icon: "\U0001f3ce\ufe0f" }', '{ id: "luxury", label: "Luxury / Large SUV", icon: "L" }')

# Replace all emoji in hero badge
c = c.replace('\U0001f697 Surat\'s #1 Daily Car Wash', "Surat's #1 Daily Car Wash")

# Replace trust items emoji
c = c.replace('"📸 Before & after photos every wash"', '"Before & after photos every wash"')
c = c.replace('"🏠 We come to you"', '"We come to you"')
c = c.replace('"📞 Easy cancellation process"', '"Easy cancellation process"')
c = c.replace('"🔒 Razorpay secured"', '"Razorpay secured"')
c = c.replace('"📸 Before & after photos"', '"Before & after photos"')
c = c.replace('"🏠 Home, office, society"', '"Home, office, society"')

# Replace plan icons
c = c.replace('icon:"\u26a1"', 'icon:"EX"')
c = c.replace('icon:"\u2728"', 'icon:"SM"')
c = c.replace('icon:"\U0001f451"', 'icon:"EL"')

# Replace pack icons
c = c.replace('icon:"1\ufe0f\u20e3"', 'icon:"1x"')
c = c.replace('icon:"\U0001f501"', 'icon:"2x"')
c = c.replace('icon:"\U0001f4c5"', 'icon:"4x"')

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'w', encoding='utf-8') as f:
    f.write(c)

# Verify
with open('src/app/components/subscription/CustomerPlanPage.tsx', 'r', encoding='utf-8') as f:
    c2 = f.read()
print("Hatchback icon:", c2[c2.find("hatchback")+40:c2.find("hatchback")+80])
