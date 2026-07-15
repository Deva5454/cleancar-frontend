with open('src/app/components/subscription/CustomerPlanPage.tsx', 'rb') as f:
    raw = f.read()

# These are the double-encoded UTF-8 sequences for each emoji
replacements = [
    # Vehicle icons
    (b'\xc3\xb0\xc5\xb8\xc5\xa1\xe2\x80\x94', b'Car'),        # 🚗
    (b'\xc3\xb0\xc5\xb8\xc5\xa1\xe2\x84\xa2', b'SUV'),        # 🚙
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x8f\xc5\xbe', b'Luxury'),     # 🏎
    # Plan icons
    (b'\xc3\xa2\xc2\x9a\xc2\xa1', b'EX'),   # ⚡
    (b'\xc3\xa2\xc2\x9c\xc2\xa8', b'SM'),   # ✨
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x98\xe2\x80\x98', b'EL'),  # 👑
    # Pack icons
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x94\xe2\x80\x98', b'2x'),  # 🔁
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9c\xe2\x80\xa2', b'4x'),  # 📅
    # Trust strip / hero
    (b'\xc3\xb0\xc5\xb8\xc5\xa1\xe2\x80\x94 Surat', b"Surat"),
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x9d\xc2\xb8 Before', b'Before'),
    (b'\xc3\xb0\xc5\xb8\xe2\x80\x98 Before', b'Before'),
    (b'\xc3\x9f\xc2\x9f Razorpay', b'Razorpay'),
    (b'\xc3\xb0\xc5\xb8\xc5\x8f\xc2\xa0 We come', b'We come'),
    (b'\xc3\xb0\xc5\xb8\xc5\x8f\xc2\xa0 Home', b'Home'),
    (b'\xc3\x82\xc2\xb0 Easy', b'Easy'),
]

for old, new in replacements:
    count = raw.count(old)
    if count:
        raw = raw.replace(old, new)
        print(f"Replaced {count}x: {old[:10]} -> {new}")

with open('src/app/components/subscription/CustomerPlanPage.tsx', 'wb') as f:
    f.write(raw)

# Verify hatchback icon
idx = raw.find(b'hatchback')
print("Hatchback area:", raw[idx+20:idx+80])
print("Done")
